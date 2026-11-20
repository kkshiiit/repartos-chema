import { describe, expect, it } from 'vitest';
import { SyncStore, type Transport } from '../src/sync/store';
import { actorFor, type SyncOperation } from '../src/sync/ops';
import { stateBefore, summary } from '../src/sync/restore';
import { snapshot } from '../src/domain/engine';

const log: { seq: number; op: unknown; id: string }[] = [];
const transport: Transport = {
  async push(ops) {
    return (ops as { opId: string; op: unknown }[]).map((o) => {
      let f = log.find((l) => l.id === o.opId);
      if (!f) log.push((f = { seq: log.length + 1, op: JSON.parse(JSON.stringify(o.op)), id: o.opId }));
      return { opId: o.opId, seq: f.seq };
    });
  },
  async pull(after) {
    return { ops: log.filter((l) => l.seq > after).slice(0, 2), lastSeq: log.length };
  },
};
const mem = new Map<string, string>();
const storage = { getItem: async (k: string) => mem.get(k) ?? null, setItem: async (k: string, v: string) => void mem.set(k, v) };
let n = 0;
const op = (action: SyncOperation['action']): SyncOperation => ({
  id: `rst_${++n}_xxxxxxxx`,
  createdAt: new Date(Date.UTC(2026, 10, 20, 12, 0, n)).toISOString(),
  actor: actorFor({ id: 'u1', name: 'Ana' }),
  action,
});

describe('volver a como estaba antes de un cambio', () => {
  it('rearma el estado previo y la restauración se aplica igual en todos y queda auditada', async () => {
    const a = new SyncStore(storage, 't', transport);
    await a.load();
    await a.dispatch(op({ type: 'SAVE_MATERIAL', material: { id: 'm1', nombre: 'Tablón', categoria: 'TABLONES' } }));
    await a.dispatch(op({ type: 'ADJUST', materialId: 'm1', bucket: 'cantidadGalpon', delta: 30, motivo: 'Alta', procedencia: 'Compra' }));
    const wipe = op({ type: 'IMPORT_SNAPSHOT', origen: 'archivo equivocado', snapshot: { obras: [], materiales: [], combos: [], responsables: [], notificaciones: [] } });
    await a.dispatch(wipe);
    await a.sync();
    expect(a.current()!.state.materiales).toHaveLength(0);

    const before = await stateBefore(wipe.id, transport.pull);
    expect(before).not.toBeNull();
    expect(summary(snapshot(before!.state))).toEqual({ obras: 0, materiales: 1, piezas: 30 });

    await a.dispatch(op({ type: 'IMPORT_SNAPSHOT', origen: 'restauración', accion: 'Volvió a como estaba antes de “Importó…”', snapshot: snapshot(before!.state) }));
    await a.sync();
    expect(a.current()!.state.materiales[0]!.cantidadGalpon).toBe(30);
    expect(a.current()!.state.logs[0]!.accion).toMatch(/^Volvió a como estaba antes/);
    expect(a.current()!.state.logs).toHaveLength(4); // la auditoría completa se conserva

  });
  it('devuelve null si el cambio no está en el servidor', async () => {
    expect(await stateBefore('no-existe', transport.pull)).toBeNull();
  });
});
