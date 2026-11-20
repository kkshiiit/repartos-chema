import type { AppState, DomainSnapshot } from '../types';
import { emptyLocalState } from '../data/localInitialState';
import { snapshot } from '../domain/engine';
import { applySync, type SyncOperation } from './ops';

export interface PullPage {
  ops: { seq: number; op: unknown }[];
  lastSeq: number;
}

/**
 * Rearma el inventario tal como estaba justo ANTES de la operación `opId`, aplicando en orden
 * todas las operaciones anteriores guardadas en el servidor (las rechazadas se saltean igual que
 * en los teléfonos). Devuelve null si esa operación no está en el servidor.
 */
export async function stateBefore(
  opId: string,
  pull: (after: number) => Promise<PullPage>,
): Promise<{ state: AppState; seq: number } | null> {
  let state = emptyLocalState() as AppState;
  let after = 0;
  for (let guard = 0; guard < 10000; guard++) {
    const page = await pull(after);
    if (!page.ops.length) return null;
    for (const item of page.ops) {
      const op = item.op as SyncOperation;
      if (op?.id === opId) return { state, seq: item.seq - 1 };
      try {
        state = applySync(state, op);
      } catch {
        /* rechazada: tampoco se aplicó en los teléfonos */
      }
      after = item.seq;
    }
    if (after >= page.lastSeq) return null;
  }
  return null;
}

export function summary(s: DomainSnapshot) {
  const pieces = s.materiales.reduce(
    (n, m) => n + m.cantidadGalpon + m.cantidadEnObra + m.cantidadEnTaller + m.cantidadPerdido,
    0,
  );
  return { obras: s.obras.length, materiales: s.materiales.length, piezas: pieces };
}

export { snapshot };
