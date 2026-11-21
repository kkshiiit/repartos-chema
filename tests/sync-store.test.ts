import { describe, expect, it } from 'vitest';
import { SyncStore, type Transport } from '../src/sync/store';
import { actorFor, type SyncOperation } from '../src/sync/ops';
import type { Action } from '../src/types';

function server() {
  const log: { seq: number; op: unknown; id: string }[] = [];
  return {
    log,
    transport(): Transport {
      return {
        async push(ops) {
          return (ops as { opId: string; op: unknown }[]).map((o) => {
            let found = log.find((l) => l.id === o.opId);
            if (!found) log.push((found = { seq: log.length + 1, op: JSON.parse(JSON.stringify(o.op)), id: o.opId }));
            return { opId: o.opId, seq: found.seq };
          });
        },
        async pull(after) {
          return { ops: log.filter((l) => l.seq > after).slice(0, 2), lastSeq: log.length };
        },
      };
    },
  };
}
const mem = () => {
  const m = new Map<string, string>();
  return { getItem: async (k: string) => m.get(k) ?? null, setItem: async (k: string, v: string) => void m.set(k, v) };
};
let n = 0;
const op = (who: string, action: Action | SyncOperation['action']): SyncOperation => ({
  id: `op_${++n}`,
  createdAt: new Date(Date.UTC(2026, 10, 17, 12, 0, n)).toISOString(),
  actor: actorFor({ id: `id_${who}`, name: who }),
  action,
});

describe('sincronización entre teléfonos', () => {
  it('dos teléfonos convergen al mismo inventario y auditoría', async () => {
    const srv = server();
    const a = new SyncStore(mem(), 't1', srv.transport());
    const b = new SyncStore(mem(), 't1', srv.transport());
    await a.load();
    await b.load();
    await a.dispatch(op('Ana', { type: 'SAVE_MATERIAL', material: { id: 'm1', nombre: 'Andamio', medida: '1,5 m', categoria: 'ANDAMIOS' } }));
    await a.dispatch(op('Ana', { type: 'ADJUST', materialId: 'm1', bucket: 'cantidadGalpon', delta: 50, motivo: 'Alta', procedencia: 'Compra' }));
    await a.sync();
    await b.sync();
    expect(b.current()!.state.materiales[0]!.cantidadGalpon).toBe(50);
    await b.dispatch(op('Beto', { type: 'ADJUST', materialId: 'm1', bucket: 'cantidadGalpon', delta: -5, motivo: 'Rotura', procedencia: 'Control' }));
    expect(b.current()!.pending).toHaveLength(1);
    await b.sync();
    await a.sync();
    expect(a.current()!.state.materiales[0]!.cantidadGalpon).toBe(45);
    expect(a.current()!.pending).toHaveLength(0);
    expect(JSON.stringify(a.current()!.state)).toBe(JSON.stringify(b.current()!.state));
    expect(a.current()!.state.logs.map((l) => l.usuarioNombre)).toEqual(['Beto', 'Ana', 'Ana']);
  });
  it('un cambio que ya no es posible queda rechazado y avisado, sin romper el resto', async () => {
    const srv = server();
    const a = new SyncStore(mem(), 't1', srv.transport());
    const b = new SyncStore(mem(), 't1', srv.transport());
    await a.load();
    await b.load();
    await a.dispatch(op('Ana', { type: 'SAVE_MATERIAL', material: { id: 'm1', nombre: 'Tablón', categoria: 'TABLONES' } }));
    await a.dispatch(op('Ana', { type: 'ADJUST', materialId: 'm1', bucket: 'cantidadGalpon', delta: 10, motivo: 'Alta', procedencia: 'Compra' }));
    await a.sync();
    await b.sync();
    await a.dispatch(op('Ana', { type: 'ADJUST', materialId: 'm1', bucket: 'cantidadGalpon', delta: -8, motivo: 'Venta', procedencia: 'X' }));
    await b.dispatch(op('Beto', { type: 'ADJUST', materialId: 'm1', bucket: 'cantidadGalpon', delta: -8, motivo: 'Venta', procedencia: 'Y' }));
    await a.sync();
    await b.sync();
    await a.sync();
    expect(b.current()!.rejected).toHaveLength(1);
    expect(a.current()!.state.materiales[0]!.cantidadGalpon).toBe(2);
    expect(b.current()!.state.materiales[0]!.cantidadGalpon).toBe(2);
  });
  it('importación y notas quedan en la auditoría', async () => {
    const srv = server();
    const a = new SyncStore(mem(), 't1', srv.transport());
    await a.load();
    await a.dispatch(op('Ana', { type: 'IMPORT_SNAPSHOT', origen: 'copia.json', snapshot: { obras: [], materiales: [], combos: [], responsables: ['Ana'], notificaciones: [] } }));
    await a.dispatch(op('Ana', { type: 'NOTE', accion: 'Ingresó a la app' }));
    await a.sync();
    expect(a.current()!.state.responsables).toEqual(['Ana']);
    expect(a.current()!.state.logs[1]!.accion).toMatch(/Importó/);
  });
});

describe('acciones que requieren PIN', () => {
  it('si el servidor rechaza una importación sin PIN, sale de pendientes y se avisa', async () => {
    const transport: Transport = {
      async push(ops) {
        return (ops as { opId: string }[]).map((o) => ({ opId: o.opId, seq: null, rejected: 'PIN_REQUERIDO' }));
      },
      async pull() {
        return { ops: [], lastSeq: 0 };
      },
    };
    const a = new SyncStore(mem(), 't1', transport);
    await a.load();
    await a.dispatch(op('Ana', { type: 'IMPORT_SNAPSHOT', origen: 'x', snapshot: { obras: [], materiales: [], combos: [], responsables: [], notificaciones: [] } }));
    await a.sync();
    expect(a.current()!.pending).toHaveLength(0);
    expect(a.current()!.rejected[0]!.error).toMatch(/PIN del responsable/);
  });
});
