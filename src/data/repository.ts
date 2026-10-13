import type { AppState, Envelope, Operation } from '../types';
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
  private serial<T>(f: () => Promise<T>): Promise<T> {
    const run = async () => {
      const fresh = await this.storage.getItem(this.key);
      if (fresh) {
        const parsed = JSON.parse(fresh) as Envelope;
        if (parsed.schema !== 1 || !parsed.state || !Array.isArray(parsed.queue))
          throw new Error('Datos locales incompatibles. Conserva una copia.');
        this.envelope = parsed;
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
  load() {
    return this.serial(async () => {
      if (this.envelope) return clone(this.envelope);
      const raw = await this.storage.getItem(this.key);
      if (raw) {
        const e = JSON.parse(raw) as Envelope;
        if (e.schema !== 1 || !e.state || !Array.isArray(e.queue))
          throw new Error('Datos locales incompatibles. Conserva la copia antes de restablecer.');
        this.envelope = e;
        return clone(e);
      }
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
      if (e.queue.some((q) => q.status === 'CONFLICT')) return e;
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
            /failed-precondition|permission-denied|invalid-argument|not-found|resource-exhausted/.test(
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
