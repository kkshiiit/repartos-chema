import type { AppState, Envelope, Operation, UserProfile } from '../types';
import { parseEnvelope } from './validation';
import { applyOperation, clone } from '../domain/engine';
export interface KeyValueStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
}
export interface RemoteAdapter {
  fetch(): Promise<AppState>;
  commit(op: Operation): Promise<AppState>;
}
export class Repository {
  private tail: Promise<unknown> = Promise.resolve();
  private envelope: Envelope | null = null;
  private listeners = new Set<(value: Envelope) => void>();
  constructor(
    private storage: KeyValueStorage,
    private key: string,
    private initial: () => AppState,
    private remote?: RemoteAdapter,
  ) {}
  private serial<T>(f: () => Promise<T>, validateExisting = true): Promise<T> {
    const run = async () => {
      const fresh = await this.storage.getItem(this.key);
      if (!validateExisting) return f();
      if (fresh !== null) {
        const parsed = parseEnvelope(fresh);
        this.envelope = parsed;
      } else if (this.envelope) {
        throw new Error(
          'El almacenamiento local desapareció. Conserva esta sesión y restaura una copia; no se reiniciaron datos.',
        );
      }
      return f();
    };
    const locked = () =>
      typeof navigator !== 'undefined' && navigator.locks
        ? navigator.locks.request(this.key, run)
        : run();
    const task = this.tail.then(locked, locked);
    this.tail = task.catch(() => undefined);
    return task;
  }
  subscribe(listener: (e: Envelope) => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }
  private async persist(e: Envelope) {
    await this.storage.setItem(this.key, JSON.stringify(e));
    this.envelope = e;
    this.listeners.forEach((l) => l(clone(e)));
    return clone(e);
  }
  // Incluye incluso datos inválidos para que soporte pueda recuperarlos sin sobreescribir.
  async exportRaw() {
    return this.storage.getItem(this.key);
  }
  restoreDemo(raw: string, actor: UserProfile) {
    return this.serial(async () => {
      if (this.remote || actor.role !== 'ADMIN')
        throw new Error('Restauración local exclusiva de administración en demo.');
      const restored = parseEnvelope(raw);
      if (restored.queue.length) throw new Error('No se restaura una cola remota en la demo.');
      const original = await this.storage.getItem(this.key);
      if (original !== null)
        await this.storage.setItem(`${this.key}:before-restore:${Date.now()}`, original);
      return this.persist(restored);
    }, false);
  }
  load() {
    return this.serial(async () => {
      if (this.envelope) return clone(this.envelope);
      const state = this.initial();
      return this.persist({ schema: 1, confirmed: state, state, queue: [] });
    });
  }
  dispatch(op: Operation) {
    return this.serial(async () => {
      if (!this.envelope) throw new Error('El almacenamiento no está listo.');
      const e = clone(this.envelope);
      if (e.queue.some((q) => q.status === 'CONFLICT'))
        throw new Error('Resuelve el conflicto pendiente antes de registrar otro cambio.');
      e.state = applyOperation(e.state, op);
      if (e.queue.some((q) => q.operation.id === op.id) || e.confirmed.appliedIds.includes(op.id))
        return e;
      if (this.remote) e.queue.push({ operation: clone(op), status: 'PENDING' });
      else e.confirmed = clone(e.state);
      return this.persist(e);
    });
  }
  sync() {
    return this.serial(async () => {
      if (!this.remote || !this.envelope) return this.envelope;
      let e = clone(this.envelope);
      const conflict = e.queue.find((q) => q.status === 'CONFLICT');
      if (conflict) throw new Error(conflict.error || 'Resuelve el conflicto pendiente.');
      while (e.queue.length) {
        const item = e.queue[0]!;
        if (item.status === 'CONFLICT') {
          await this.persist(e);
          throw new Error(item.error || 'Conflicto de inventario.');
        }
        try {
          e.confirmed = await this.remote.commit(item.operation);
          e.queue.shift();
        } catch (error) {
          const code = (error as { code?: string }).code || '';
          if (
            /failed-precondition|permission-denied|invalid-argument|not-found|resource-exhausted|storage\/(unauthorized|object-not-found|invalid-argument)/.test(
              code,
            )
          ) {
            item.status = 'CONFLICT';
            item.error =
              error instanceof Error ? error.message : 'El servidor rechazó el movimiento.';
            await this.persist(e);
          }
          throw error;
        }
        e.state = this.replay(e);
        await this.persist(e);
      }
      e.confirmed = await this.remote.fetch();
      e.state = this.replay(e);
      return this.persist(e);
    });
  }
  private replay(e: Envelope) {
    let state = clone(e.confirmed);
    for (const q of e.queue) {
      try {
        state = applyOperation(state, q.operation, new Date(q.operation.createdAt));
      } catch (error) {
        q.status = 'CONFLICT';
        q.error = error instanceof Error ? error.message : 'Conflicto de inventario.';
        break;
      }
    }
    return state;
  }
  // Solo elimina un intento rechazado explícitamente por el servidor, nunca un envío incierto.
  discardConflict() {
    return this.serial(async () => {
      if (!this.envelope || !this.remote) throw new Error('Sin integración remota.');
      const e = clone(this.envelope);
      if (!e.queue[0] || e.queue[0].status !== 'CONFLICT')
        throw new Error('No hay un rechazo confirmado para descartar.');
      await this.storage.setItem(
        `${this.key}:rejected:${e.queue[0].operation.id}`,
        JSON.stringify(e.queue[0]),
      );
      e.queue.shift();
      e.confirmed = await this.remote.fetch();
      e.state = this.replay(e);
      return this.persist(e);
    });
  }
}
