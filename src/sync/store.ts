import type { AppState } from '../types';
import { clone } from '../domain/engine';
import { emptyLocalState } from '../data/localInitialState';
import { applySync, photoIdsOf, type SyncOperation } from './ops';
import { SyncError } from './api';

export interface Rejected {
  op: SyncOperation;
  error: string;
  at: string;
}
export interface SyncData {
  schema: 2;
  teamId: string;
  lastSeq: number;
  confirmed: AppState;
  pending: SyncOperation[];
  rejected: Rejected[];
  uploadedPhotos: string[];
  lastSyncAt?: string;
}
export interface Storage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
}
export interface Transport {
  push(ops: unknown[]): Promise<{ opId: string; seq: number }[]>;
  pull(after: number): Promise<{ ops: { seq: number; op: unknown }[]; lastSeq: number }>;
  uploadPhoto?(id: string): Promise<void>;
}
export interface View {
  state: AppState;
  pending: SyncOperation[];
  rejected: Rejected[];
  lastSyncAt?: string;
  lastSeq: number;
}

const isOp = (v: unknown): v is SyncOperation =>
  !!v &&
  typeof v === 'object' &&
  typeof (v as SyncOperation).id === 'string' &&
  typeof (v as SyncOperation).createdAt === 'string' &&
  !!(v as SyncOperation).actor &&
  !!(v as SyncOperation).action;

/**
 * Inventario local-primero. `confirmed` es el resultado de aplicar, en orden, todas las
 * operaciones del servidor. `pending` son cambios de este teléfono aún no confirmados.
 */
export class SyncStore {
  private data: SyncData | null = null;
  private view: View | null = null;
  private tail: Promise<unknown> = Promise.resolve();
  private listeners = new Set<(v: View) => void>();
  constructor(
    private storage: Storage,
    private teamId: string,
    private transport: Transport,
  ) {}
  private get key() {
    return `chema2:data:${this.teamId}`;
  }
  private serial<T>(f: () => Promise<T>): Promise<T> {
    const task = this.tail.then(f, f);
    this.tail = task.catch(() => undefined);
    return task;
  }
  subscribe(l: (v: View) => void) {
    this.listeners.add(l);
    if (this.view) l(this.view);
    return () => void this.listeners.delete(l);
  }
  current() {
    return this.view;
  }
  private rebuild() {
    const d = this.data!;
    let state = d.confirmed;
    for (const op of d.pending) {
      try {
        state = applySync(state, op);
      } catch {
        /* se envía igual: el servidor decide el orden final */
      }
    }
    this.view = {
      state,
      pending: d.pending,
      rejected: d.rejected,
      lastSyncAt: d.lastSyncAt,
      lastSeq: d.lastSeq,
    };
    this.listeners.forEach((l) => l(this.view!));
    return this.view;
  }
  private async save() {
    await this.storage.setItem(this.key, JSON.stringify(this.data));
  }
  load() {
    return this.serial(async () => {
      if (this.data) return this.view!;
      const raw = await this.storage.getItem(this.key);
      if (raw) {
        const parsed = JSON.parse(raw) as SyncData;
        if (parsed.schema !== 2 || parsed.teamId !== this.teamId)
          throw new Error('Los datos guardados pertenecen a otro equipo.');
        this.data = parsed;
      } else
        this.data = {
          schema: 2,
          teamId: this.teamId,
          lastSeq: 0,
          confirmed: emptyLocalState(),
          pending: [],
          rejected: [],
          uploadedPhotos: [],
        };
      return this.rebuild();
    });
  }
  /** Valida contra el estado visible y guarda en el teléfono antes de enviar. */
  dispatch(op: SyncOperation) {
    return this.serial(async () => {
      if (!this.data) throw new Error('Los datos todavía se están cargando.');
      applySync(this.view!.state, op); // lanza el error de negocio si no corresponde
      this.data.pending.push(clone(op));
      await this.save();
      return this.rebuild();
    });
  }
  dismissRejected(id?: string) {
    return this.serial(async () => {
      if (!this.data) return;
      this.data.rejected = id ? this.data.rejected.filter((r) => r.op.id !== id) : [];
      await this.save();
      this.rebuild();
    });
  }
  /** Envía pendientes y trae lo nuevo. Seguro de repetir: el servidor ignora duplicados. */
  sync() {
    return this.serial(async () => {
      if (!this.data) return this.view;
      const d = this.data;
      // 1) Subir fotos y luego operaciones, en lotes.
      while (d.pending.length) {
        const batch = d.pending.slice(0, 40);
        if (this.transport.uploadPhoto)
          for (const op of batch)
            for (const id of photoIdsOf(op))
              if (!d.uploadedPhotos.includes(id)) {
                try {
                  await this.transport.uploadPhoto(id);
                } catch (e) {
                  if (e instanceof SyncError) throw e;
                  /* foto ausente en este teléfono: no bloquea el resto */
                }
                d.uploadedPhotos.push(id);
              }
        await this.transport.push(
          batch.map((op) => ({
            opId: op.id,
            actorId: op.actor.uid,
            actorName: op.actor.nombre,
            clientAt: op.createdAt,
            op,
          })),
        );
        // Quedan en `pending` hasta verlas volver confirmadas en el pull.
        if (batch.length < 40 || (await this.pullAll()) === 0) break;
      }
      await this.pullAll();
      d.lastSyncAt = new Date().toISOString();
      await this.save();
      return this.rebuild();
    });
  }
  private async pullAll() {
    const d = this.data!;
    let received = 0;
    for (;;) {
      const page = await this.transport.pull(d.lastSeq);
      if (!page.ops.length) break;
      let state = d.confirmed;
      for (const item of page.ops) {
        const op = item.op;
        if (isOp(op)) {
          const mine = d.pending.findIndex((p) => p.id === op.id);
          try {
            state = applySync(state, op);
          } catch (e) {
            if (mine >= 0)
              d.rejected.unshift({
                op,
                error: e instanceof Error ? e.message : 'Cambio rechazado.',
                at: new Date().toISOString(),
              });
          }
          if (mine >= 0) d.pending.splice(mine, 1);
        }
        d.lastSeq = item.seq;
        received++;
      }
      d.confirmed = state;
      d.rejected = d.rejected.slice(0, 50);
      await this.save();
      this.rebuild();
      if (d.lastSeq >= page.lastSeq) break;
    }
    return received;
  }
  exportState() {
    return this.view ? clone(this.view.state) : null;
  }
}
