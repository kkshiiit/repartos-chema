import type { Action, AppState, UserProfile } from '../types';
import type { KeyValueStorage } from '../data/repository';
import { parseEnvelope } from '../data/validation';
import { applyOperation, clone } from '../domain/engine';
import {
  canonical,
  applyDelta,
  createCommand,
  prepareCommit,
  type SharedRemote,
  type SharedSnapshot,
  type SyncCommand,
} from './protocol';
export interface SharedQueued {
  command: SyncCommand;
  status: 'PENDING' | 'SENDING' | 'CONFLICT' | 'ERROR';
  error?: string;
  attempts: number;
  uncertain?: boolean;
}
export interface ConflictArchive {
  schema: 1;
  id: string;
  spaceId: string;
  userId: string;
  archivedAt: string;
  reason: string;
  proposals: SharedQueued[];
  context: AppState;
}
export type ConflictArchiveSummary = Pick<ConflictArchive, 'id' | 'archivedAt' | 'reason'>;
export interface SharedEnvelope {
  schema: 1;
  spaceId: string;
  userId: string;
  confirmed: SharedSnapshot;
  state: AppState;
  outbox: SharedQueued[];
  lastSyncedAt?: string;
  error?: string;
  accessBlocked?: boolean;
  pullWatermark?: number;
  receivingPending?: boolean;
}
export function validateSnapshot(value: unknown, spaceId: string): SharedSnapshot {
  if (!value || typeof value !== 'object')
    throw new Error('La respuesta del equipo está incompleta. Conservamos la copia local.');
  const v = value as SharedSnapshot;
  if (
    v.protocol !== 1 ||
    v.spaceId !== spaceId ||
    typeof v.epoch !== 'string' ||
    !Number.isSafeInteger(v.cursor) ||
    v.cursor < 0 ||
    !v.versions ||
    !v.tasks
  )
    throw new Error('La versión del equipo requiere revisión. No se reemplazaron datos.');
  parseEnvelope(JSON.stringify({ schema: 1, confirmed: v.state, state: v.state, queue: [] }), {
    allowLegacyRetirementDate: true,
  });
  for (const n of Object.values(v.versions))
    if (!Number.isSafeInteger(n) || n < 0) throw new Error('Revisiones de equipo inválidas.');
  return v;
}
function receiveSnapshot(value: unknown, previous: SharedSnapshot, spaceId: string) {
  const next = validateSnapshot(value, spaceId);
  if (next.epoch === previous.epoch && next.cursor < previous.cursor)
    throw new Error(
      'Recibimos una respuesta anterior del equipo. Conservamos la revisión más reciente; reintentá.',
    );
  return next;
}
export class SharedRepository {
  readonly key: string;
  private value: SharedEnvelope | null = null;
  private tail: Promise<unknown> = Promise.resolve();
  private listeners = new Set<(value: SharedEnvelope) => void>();
  constructor(
    private storage: KeyValueStorage,
    readonly spaceId: string,
    private actor: UserProfile,
    private initial: SharedSnapshot,
    private remote: SharedRemote,
  ) {
    this.key = `chema:shared:v1:${encodeURIComponent(spaceId)}:${encodeURIComponent(actor.uid)}`;
  }
  private serial<T>(task: () => Promise<T>): Promise<T> {
    const run = this.tail.then(task, task);
    this.tail = run.catch(() => undefined);
    return run;
  }
  current(): SharedEnvelope {
    if (!this.value) throw new Error('El espacio todavía está cargando.');
    return clone(this.value);
  }
  subscribe(listener: (value: SharedEnvelope) => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }
  private async save(value: SharedEnvelope) {
    const raw = JSON.stringify(value);
    if (this.storage.atomicSet) await this.storage.atomicSet([[this.key, raw]]);
    else {
      await this.storage.setItem(this.key, raw);
      if ((await this.storage.getItem(this.key)) !== raw)
        throw new Error('No se pudo verificar el guardado del equipo.');
    }
    this.value = clone(value);
    for (const listener of this.listeners) listener(clone(value));
    return this.current();
  }
  init() {
    return this.serial(async () => {
      const raw = await this.storage.getItem(this.key);
      if (raw !== null) {
        let value: SharedEnvelope;
        try {
          value = JSON.parse(raw) as SharedEnvelope;
          validateSnapshot(value.confirmed, this.spaceId);
          if (
            value.schema !== 1 ||
            value.spaceId !== this.spaceId ||
            value.userId !== this.actor.uid ||
            !Array.isArray(value.outbox)
          )
            throw new Error('IDENTITY');
          parseEnvelope(
            JSON.stringify({ schema: 1, confirmed: value.state, state: value.state, queue: [] }),
            { allowLegacyRetirementDate: true },
          );
          for (const row of value.outbox) {
            if (
              !row.command ||
              row.command.spaceId !== this.spaceId ||
              row.command.payloadHash !== canonical(row.command.action) ||
              !['PENDING', 'SENDING', 'CONFLICT', 'ERROR'].includes(row.status)
            )
              throw new Error('QUEUE');
          }
        } catch {
          throw new Error(
            'Los datos locales del equipo no pudieron leerse. Conservamos el original para recuperar; no se reinició el inventario.',
          );
        }
        this.value = value;
        for (const listener of this.listeners) listener(this.current());
        return this.current();
      }
      const confirmed = clone(validateSnapshot(this.initial, this.spaceId));
      return this.save({
        schema: 1,
        spaceId: this.spaceId,
        userId: this.actor.uid,
        confirmed,
        state: clone(confirmed.state),
        outbox: [],
      });
    });
  }
  private projection(envelope: SharedEnvelope) {
    let state = clone(envelope.confirmed.state);
    for (const row of envelope.outbox) {
      if (row.status === 'CONFLICT') break;
      try {
        state = applyOperation(state, {
          id: row.command.operationId,
          createdAt: row.command.clientTimestamp,
          actor: this.actor,
          action: row.command.action,
        });
      } catch {
        break;
      }
    }
    envelope.state = state;
    return envelope;
  }
  dispatch(action: Action, operationId: string) {
    return this.serial(async () => {
      const value = this.current();
      if (value.accessBlocked)
        throw new Error(
          'El acceso al equipo está suspendido. Conservamos tus cambios para revisión.',
        );
      if (value.outbox.some((row) => row.status === 'CONFLICT'))
        throw new Error('Revisá el conflicto pendiente antes de registrar otra operación.');
      if (
        value.outbox.some((row) => row.command.operationId === operationId) ||
        value.confirmed.state.appliedIds.includes(operationId)
      )
        return value;
      let basis = clone(value.confirmed);
      for (const row of value.outbox) {
        const predicted = prepareCommit(
          basis,
          row.command,
          this.actor,
          new Date(row.command.clientTimestamp),
        );
        if (predicted.kind !== 'CONFIRMED')
          throw new Error('Hay una operación previa que requiere revisión.');
        basis = predicted.snapshot;
      }
      const command = createCommand(basis, action, operationId, this.actor.uid);
      const predicted = prepareCommit(basis, command, this.actor);
      if (predicted.kind !== 'CONFIRMED') throw new Error(predicted.message);
      value.outbox.push({ command, status: 'PENDING', attempts: 0 });
      value.state = predicted.snapshot.state;
      delete value.error;
      return this.save(value);
    });
  }
  sync() {
    return this.serial(async () => {
      let value = this.current();
      try {
        if (value.accessBlocked) {
          const verified = receiveSnapshot(
            await this.remote.snapshot(),
            value.confirmed,
            this.spaceId,
          );
          if (verified.epoch !== value.confirmed.epoch) return value;
          value.accessBlocked = false;
        }
        for (let i = 0; i < value.outbox.length;) {
          const row = value.outbox[i]!;
          if (row.status === 'CONFLICT') break;
          row.status = 'SENDING';
          row.attempts++;
          row.uncertain = true;
          await this.save(value);
          try {
            // Every resumed/uncertain request checks its receipt before another submission.
            const receipt = await this.remote.receipt(row.command.operationId);
            const result = receipt || (await this.remote.commit(row.command));
            if (result.kind === 'CONFLICT') {
              row.status = 'CONFLICT';
              row.uncertain = false;
              row.error = result.message;
              if (result.snapshot) {
                value.confirmed = clone(
                  receiveSnapshot(result.snapshot, value.confirmed, this.spaceId),
                );
                delete value.pullWatermark;
              }
              break;
            }
            if (result.payloadHash !== row.command.payloadHash)
              throw new Error(
                'El identificador ya fue usado para otro contenido. Conservamos tu propuesta.',
              );
            const snapshot = receiveSnapshot(result.snapshot, value.confirmed, this.spaceId);
            if (snapshot.epoch !== value.confirmed.epoch) {
              row.status = 'CONFLICT';
              row.error =
                'El equipo fue recuperado desde una copia. Revisá los cambios antes de reenviar.';
              break;
            }
            value.confirmed = clone(snapshot);
            delete value.pullWatermark;
            value.outbox.splice(i, 1);
            await this.save(this.projection(value));
          } catch (error) {
            const definitelyRejected =
              error &&
              typeof error === 'object' &&
              'status' in error &&
              Number(error.status) === 409;
            row.status = definitelyRejected ? 'CONFLICT' : 'ERROR';
            row.uncertain = !definitelyRejected;
            row.error =
              error instanceof Error ? error.message : 'No pudimos enviar los cambios. Reintentar.';
            value.error = row.error;
            if (
              error &&
              typeof error === 'object' &&
              'status' in error &&
              [401, 403].includes(Number(error.status))
            )
              value.accessBlocked = true;
            break;
          }
        }
        if (!value.outbox.some((row) => row.status === 'ERROR')) {
          if (this.remote.deltaPull) {
            // Persist each complete page with the outbox before requesting another page.
            for (let pageNumber = 0; pageNumber < 5; pageNumber++) {
              const page = await this.remote.deltaPull(
                value.confirmed.cursor,
                value.confirmed.epoch,
                value.pullWatermark,
              );
              if (!Number.isSafeInteger(page.watermark) || page.watermark < 0)
                throw Error('DELTA_WATERMARK');
              if (page.epoch !== value.confirmed.epoch) {
                value.error =
                  'La generación del equipo cambió. Conservamos la copia local para revisión.';
                value.accessBlocked = true;
                break;
              }
              if (page.kind === 'RESET') {
                const next = receiveSnapshot(page.snapshot, value.confirmed, this.spaceId);
                if (next.epoch !== page.epoch || next.cursor !== page.watermark)
                  throw Error('DELTA_RESET');
                value.confirmed = clone(next);
                delete value.pullWatermark;
                value.receivingPending = false;
              } else {
                if (
                  (value.pullWatermark !== undefined && page.watermark !== value.pullWatermark) ||
                  page.watermark < value.confirmed.cursor
                )
                  throw Error('DELTA_WATERMARK');
                let next = value.confirmed;
                for (const delta of page.changes)
                  next = validateSnapshot(applyDelta(next, delta), this.spaceId);
                if (
                  next.cursor > page.watermark ||
                  page.hasMore !== next.cursor < page.watermark ||
                  (page.hasMore && next.cursor === value.confirmed.cursor)
                )
                  throw Error('DELTA_PAGE');
                if (page.currentLog) {
                  if (page.hasMore || page.currentLog.id !== next.state.logs[0]?.id)
                    throw Error('DELTA_LOG');
                  next.state.logs[0] = clone(page.currentLog);
                  validateSnapshot(next, this.spaceId);
                }
                value.confirmed = next;
                value.receivingPending = page.hasMore;
                if (page.hasMore) value.pullWatermark = page.watermark;
                else delete value.pullWatermark;
              }
              value.lastSyncedAt = new Date().toISOString();
              delete value.error;
              try {
                await this.save(this.projection(value));
              } catch (error) {
                value = this.current();
                throw error;
              }
              if (!value.receivingPending) break;
            }
          } else {
            const next = receiveSnapshot(
              await this.remote.snapshot(),
              value.confirmed,
              this.spaceId,
            );
            if (next.epoch !== value.confirmed.epoch) {
              value.error =
                'La generación del equipo cambió. Conservamos la copia local para revisión.';
              value.accessBlocked = true;
            } else {
              value.confirmed = clone(next);
              value.lastSyncedAt = new Date().toISOString();
              delete value.error;
            }
          }
        }
      } catch (error) {
        value.error =
          error instanceof Error ? error.message : 'No pudimos recibir los cambios. Reintentar.';
        if (
          error &&
          typeof error === 'object' &&
          'status' in error &&
          [401, 403].includes(Number(error.status))
        )
          value.accessBlocked = true;
      }
      return this.save(this.projection(value));
    });
  }
  /** Only a definitely rejected conflict may be discarded; uncertain writes must query receipts. */
  dismissConflict(operationId: string) {
    return this.serial(async () => {
      const value = this.current(),
        index = value.outbox.findIndex((row) => row.command.operationId === operationId);
      if (index < 0) return value;
      const row = value.outbox[index]!;
      if (row.status !== 'CONFLICT' || row.uncertain)
        throw new Error('Primero debemos confirmar si el servidor recibió esta operación.');
      const proposals = value.outbox.slice(index);
      if (
        proposals
          .slice(1)
          .some(
            (dependent) =>
              dependent.status !== 'PENDING' || dependent.attempts !== 0 || dependent.uncertain,
          )
      )
        throw new Error('Primero debemos confirmar los recibos de los cambios dependientes.');
      if (!this.storage.atomicSet)
        throw new Error('Este almacenamiento no permite archivar la propuesta de forma segura.');
      const remaining = clone(value);
      remaining.outbox.splice(index);
      delete remaining.error;
      this.projection(remaining);
      const archive: ConflictArchive = {
        schema: 1,
        id: operationId,
        spaceId: this.spaceId,
        userId: this.actor.uid,
        archivedAt: new Date().toISOString(),
        reason: row.error || 'Rechazo confirmado',
        proposals: clone(proposals),
        context: clone(value.state),
      };
      const summaries = await this.listConflictArchives();
      if (summaries.some((entry) => entry.id === operationId))
        throw new Error('Esta propuesta ya tiene un archivo. Se conserva la cola para revisión.');
      await this.storage.atomicSet([
        [this.key + ':archive:' + encodeURIComponent(operationId), JSON.stringify(archive)],
        [
          this.key + ':archives',
          JSON.stringify([
            ...summaries,
            {
              id: archive.id,
              archivedAt: archive.archivedAt,
              reason: archive.reason,
            },
          ]),
        ],
        [this.key, JSON.stringify(remaining)],
      ]);
      this.value = remaining;
      for (const listener of this.listeners) listener(this.current());
      return this.current();
    });
  }
  async listConflictArchives(): Promise<ConflictArchiveSummary[]> {
    const raw = await this.storage.getItem(this.key + ':archives');
    if (raw === null) return [];
    const entries = JSON.parse(raw) as ConflictArchiveSummary[];
    if (
      !Array.isArray(entries) ||
      entries.some(
        (entry) =>
          typeof entry.id !== 'string' ||
          typeof entry.archivedAt !== 'string' ||
          typeof entry.reason !== 'string',
      )
    )
      throw new Error('No se pudo leer el índice de propuestas archivadas.');
    return entries;
  }
  async readConflictArchive(id: string): Promise<ConflictArchive | null> {
    const raw = await this.storage.getItem(this.key + ':archive:' + encodeURIComponent(id));
    if (raw === null) return null;
    const archive = JSON.parse(raw) as ConflictArchive;
    if (
      archive.schema !== 1 ||
      archive.id !== id ||
      archive.spaceId !== this.spaceId ||
      archive.userId !== this.actor.uid ||
      !Array.isArray(archive.proposals)
    )
      throw new Error('No se pudo leer la propuesta de este usuario y equipo.');
    return archive;
  }
  exportRaw() {
    return this.storage.getItem(this.key);
  }
}
