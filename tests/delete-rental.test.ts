import { describe, expect, it } from 'vitest';
import { applyOperation } from '../src/domain/engine';
import { seed } from '../src/data/seed';
import { actorFor } from '../src/sync/ops';
import { deleteBlocker } from '../src/utils/deleteRental';
import type { Action } from '../src/types';

const actor = actorFor({ id: 'u1', name: 'Ana' });
let n = 0;
const op = (action: Action) => ({ id: `del_${++n}_xxxxxxxx`, createdAt: '2026-11-19T12:00:00.000Z', actor, action });

describe('borrar alquiler con un toque', () => {
  it('borra un alquiler por entregar con carga y fotos sin tocar el stock, y queda auditado', () => {
    const s = seed();
    const o = s.obras.find((x) => x.estadoProceso === 'PENDIENTE_ENTREGA')!;
    o.fotos = [{ id: 'foto1', uri: 'file:///x.jpg', status: 'PENDING', usuarioUid: 'u1' }];
    expect(o.materialesCargados.length).toBeGreaterThan(0);
    expect(deleteBlocker(o)).toBeNull();
    const before = JSON.stringify(s.materiales);
    const next = applyOperation(s, op({ type: 'DELETE_OBRA', obraId: o.id }));
    expect(next.obras.some((x) => x.id === o.id)).toBe(false);
    expect(JSON.stringify(next.materiales)).toBe(before);
    expect(next.logs[0]!.accion).toBe(`Borró el alquiler de ${o.clienteNombre}`);
    expect(next.logs[0]!.usuarioNombre).toBe('Ana');
  });
  it('no borra un alquiler con material en obra y explica qué hacer', () => {
    const s = seed();
    const o = s.obras.find((x) => x.estadoProceso === 'ENTREGADO')!;
    expect(deleteBlocker(o)).toMatch(/registrá el retiro/);
    expect(() => applyOperation(s, op({ type: 'DELETE_OBRA', obraId: o.id }))).toThrow();
  });
});
