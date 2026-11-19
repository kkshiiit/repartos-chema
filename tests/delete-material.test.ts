import { describe, expect, it } from 'vitest';
import { applyOperation, assertState } from '../src/domain/engine';
import { seed } from '../src/data/seed';
import { actorFor } from '../src/sync/ops';
import { materialDeleteBlocker } from '../src/utils/deleteRental';
import type { Action } from '../src/types';

const actor = actorFor({ id: 'u1', name: 'Ana' });
let n = 0;
const op = (action: Action) => ({ id: `mat_${++n}_xxxxxxxx`, createdAt: '2026-11-19T12:00:00.000Z', actor, action });

describe('borrar material del depósito', () => {
  it('da de baja el stock, lo quita de combos y queda auditado', () => {
    let s = seed();
    s = applyOperation(s, op({ type: 'SAVE_MATERIAL', material: { id: 'nuevo', nombre: 'Rueda', categoria: 'ACCESORIOS' } }));
    s = applyOperation(s, op({ type: 'ADJUST', materialId: 'nuevo', bucket: 'cantidadGalpon', delta: 7, motivo: 'Alta', procedencia: 'Compra' }));
    s = applyOperation(s, op({ type: 'SAVE_COMBO', combo: { id: 'cmb', nombreCombo: 'Ruedas', items: [{ materialId: 'nuevo', cantidad: 4 }] } }));
    expect(materialDeleteBlocker(s.materiales.find((m) => m.id === 'nuevo')!, s.obras)).toBeNull();
    const next = applyOperation(s, op({ type: 'DELETE_MATERIAL', materialId: 'nuevo' }));
    expect(next.materiales.some((m) => m.id === 'nuevo')).toBe(false);
    expect(next.combos.some((c) => c.id === 'cmb')).toBe(false);
    expect(next.logs[0]!.accion).toBe('Borró el material Rueda');
    expect(next.logs[0]!.movimientos).toEqual([expect.objectContaining({ cantidad: 7, origen: 'galpon', destino: 'baja' })]);
    expect(() => assertState(next)).not.toThrow();
  });
  it('no borra un material que está en obra o en una carga, y explica por qué', () => {
    const s = seed();
    const inWork = s.materiales.find((m) => m.cantidadEnObra > 0)!;
    expect(materialDeleteBlocker(inWork, s.obras)).toMatch(/en obras/);
    expect(() => applyOperation(s, op({ type: 'DELETE_MATERIAL', materialId: inWork.id }))).toThrow();
  });
});
