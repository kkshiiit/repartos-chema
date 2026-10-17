import type { AppState, Envelope, Operation, UserProfile } from '../types';
import { parseEnvelope, validateImportEnvelope } from './validation';
import { applyOperation, clone } from '../domain/engine';
import { emptyLocalState } from './localInitialState';
export interface KeyValueStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  getAllKeys?(): Promise<readonly string[]>;
  getRecoveryItem?(key: string): Promise<string | null>;
  restoreMissingDatabase?(key: string, raw: string): Promise<void>;
  atomicSet?(entries: readonly (readonly [string, string])[]): Promise<void>;
}
export interface RemoteAdapter {
  fetch(): Promise<AppState>;
  commit(op: Operation): Promise<AppState>;
}
let archiveSequence = 0;
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
      if (!validateExisting) return f();
      const fresh = await this.storage.getItem(this.key);
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
  private async persist(e: Envelope, extra: [string, string][] = []) {
    const raw = JSON.stringify(e);
    if (extra.length && this.storage.atomicSet)
      await this.storage.atomicSet([...extra, [this.key, raw]]);
    else {
      for (const [key, value] of extra) await this.storage.setItem(key, value);
      await this.storage.setItem(this.key, raw);
    }
    return this.publish(e);
  }
  private publish(e: Envelope) {
    this.envelope = e;
    this.listeners.forEach((l) => l(clone(e)));
    return clone(e);
  }
  // Incluye incluso datos inválidos para que soporte pueda recuperarlos sin sobreescribir.
  async exportRaw() {
    return this.storage.getRecoveryItem
      ? this.storage.getRecoveryItem(this.key)
      : this.storage.getItem(this.key);
  }
  restoreDemo(raw: string, actor: UserProfile) {
    return this.serial(async () => {
      if (this.remote || actor.role !== 'ADMIN')
        throw new Error('Restauración local exclusiva de administración en demo.');
      const restored = parseEnvelope(raw);
      validateImportEnvelope(restored);
      if (restored.queue.length) throw new Error('No se restaura una cola remota en la demo.');
      try {
        return await this.persist(
          restored,
          await this.archiveEntries('before-restore', 'previous-restore'),
        );
      } catch (error) {
        if (
          !['LOCAL_DATABASE_MISSING', 'LOCAL_MIGRATION_FAILED'].includes(
            (error as { code?: string }).code || '',
          ) ||
          !this.storage.restoreMissingDatabase
        )
          throw error;
        await this.storage.restoreMissingDatabase(this.key, JSON.stringify(restored));
        return this.publish(restored);
      }
    }, false);
  }
  undoRestore(actor: UserProfile) {
    return this.serial(async () => {
      if (this.remote || actor.role !== 'ADMIN')
        throw new Error('Recuperación disponible solo para administración local.');
      const archive = await this.storage.getItem(`${this.key}:previous-restore`);
      const original = archive ? await this.storage.getItem(archive) : null;
      if (!original)
        throw new Error('No hay una importación anterior para deshacer. No se modificaron datos.');
      const restored = parseEnvelope(original);
      if (restored.queue.length)
        throw new Error('La copia anterior contiene envíos remotos. Se conserva sin modificar.');
      return this.persist(restored, await this.archiveEntries('before-undo-restore'));
    }, false);
  }
  startEmpty(actor: UserProfile) {
    return this.serial(async () => {
      if (this.remote || actor.role !== 'ADMIN')
        throw new Error('Acción local exclusiva de administración.');
      if (!this.envelope) throw new Error('El almacenamiento no está listo.');
      const original = await this.storage.getItem(this.key);
      if (original === null)
        throw new Error('No se encontró el original. No se modificaron datos.');
      const extra = await this.archiveEntries('before-empty', 'previous-empty');
      const state = emptyLocalState();
      return this.persist({ schema: 1, confirmed: state, state, queue: [] }, extra);
    });
  }
  recoverPrevious(actor: UserProfile) {
    return this.serial(async () => {
      if (this.remote || actor.role !== 'ADMIN')
        throw new Error('Recuperación disponible solo en modo local.');
      const archive = await this.storage.getItem(`${this.key}:previous-empty`);
      const original = archive ? await this.storage.getItem(archive) : null;
      if (!original)
        throw new Error('No hay una copia anterior a Empezar vacío. Puedes importar un JSON.');
      const restored = parseEnvelope(original);
      if (restored.queue.length)
        throw new Error('La copia contiene operaciones remotas. Se conserva sin modificar.');
      return this.persist(restored, await this.archiveEntries('before-recover'));
    });
  }
  private async archiveEntries(reason: string, pointer?: string): Promise<[string, string][]> {
    const raw = await this.storage.getItem(this.key);
    if (raw === null) return [];
    let archive: string;
    do {
      archive = `${this.key}:${reason}:${Date.now()}_${++archiveSequence}`;
    } while ((await this.storage.getItem(archive)) !== null);
    return [
      [archive, raw],
      ...(pointer ? [[`${this.key}:${pointer}`, archive] as [string, string]] : []),
    ];
  }
  async listArchives() {
    const keys = (await this.storage.getAllKeys?.()) || [];
    return keys
      .filter((k) => k.startsWith(`${this.key}:before-`))
      .sort()
      .reverse()
      .map((key) => {
        const stamp = /:(\d{10,})(?:_|$)/.exec(key)?.[1];
        return {
          key,
          createdAt: stamp ? new Date(Number(stamp)).toISOString() : '',
          reason: key.split(':')[3] || 'recuperación',
        };
      });
  }
  recoverArchive(key: string, actor: UserProfile) {
    return this.serial(async () => {
      if (this.remote || actor.role !== 'ADMIN' || !key.startsWith(`${this.key}:before-`))
        throw new Error('Recuperación no autorizada.');
      const raw = await this.storage.getItem(key);
      if (!raw) throw new Error('No se encontró esa copia. No se modificaron datos.');
      const restored = parseEnvelope(raw);
      if (restored.queue.length)
        throw new Error('La copia contiene envíos remotos; requiere revisión.');
      return this.persist(restored, await this.archiveEntries('before-recover-archive'));
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
