import { describe, expect, it } from 'vitest';
import { seed, demoProfile } from '../src/data/seed';
import { SqliteStorage } from '../src/data/sqliteStorage';
import { sqliteDb } from './helpers/sqlite';
import { applyDelta, bootstrapShared, makeDelta, type SharedRemote } from '../src/shared/protocol';
import { SharedRepository } from '../src/shared/repository';
const actor = demoProfile('ADMIN');
const initial = bootstrapShared('delta', seed(new Date('2026-10-10T12:00:00Z')), 'one');
function fixtures() {
  const snapshots = [initial];
  for (let cursor = 1; cursor <= 8; cursor++)
    snapshots.push({
      ...initial,
      cursor,
      state: { ...initial.state, responsables: ['Persona ' + cursor] },
    });
  return { snapshots, deltas: snapshots.slice(1).map((s, i) => makeDelta(snapshots[i]!, s)) };
}
describe('recepción incremental duradera', () => {
  it('aplica entidades por ID y rechaza duplicados, huecos y otra generación', () => {
    const next = structuredClone(initial);
    next.cursor++;
    next.state.obras.reverse();
    next.state.materiales.pop();
    const delta = makeDelta(initial, next);
    expect(applyDelta(initial, delta)).toEqual(next);
    for (const invalid of [
      { ...delta, from: 2 },
      { ...delta, epoch: 'other' },
      { ...delta, cursor: 4 },
    ])
      expect(() => applyDelta(initial, invalid)).toThrow();
    expect(() => applyDelta(next, delta)).toThrow();
  });
  it('limita páginas, persiste watermark y reanuda SQLite sin repetir páginas', async () => {
    const { snapshots, deltas } = fixtures();
    const seen: number[] = [];
    const remote: SharedRemote = {
      snapshot: async () => {
        throw Error('snapshot inesperado');
      },
      commit: async () => {
        throw Error('commit inesperado');
      },
      receipt: async () => null,
      pull: async () => {
        throw Error('pull anterior inesperado');
      },
      deltaPull: async (cursor, epoch, watermark) => {
        seen.push(cursor);
        expect(epoch).toBe('one');
        if (cursor) expect(watermark).toBe(8);
        return {
          kind: 'DELTA',
          changes: [deltas[cursor]!],
          watermark: 8,
          epoch,
          hasMore: cursor + 1 < 8,
        };
      },
    };
    const storage = new SqliteStorage(sqliteDb());
    const first = new SharedRepository(storage, 'delta', actor, initial, remote);
    await first.init();
    await first.sync();
    expect(first.current().confirmed.cursor).toBe(5);
    expect(first.current().receivingPending).toBe(true);
    const second = new SharedRepository(storage, 'delta', actor, initial, remote);
    await second.init();
    await second.sync();
    expect(second.current().confirmed).toEqual(snapshots[8]);
    expect(second.current().receivingPending).toBe(false);
    expect(seen).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
  });
  it('no avanza cursor si falla guardado ni acepta páginas repetidas', async () => {
    const { deltas } = fixtures();
    const control = { failRoot: false, failAt: 0, runs: 0 };
    const remote: SharedRemote = {
      snapshot: async () => initial,
      commit: async () => {
        throw Error('unexpected');
      },
      receipt: async () => null,
      pull: async () => ({ changes: [], watermark: 0, epoch: 'one' }),
      deltaPull: async () => ({
        kind: 'DELTA',
        changes: [deltas[0]!],
        watermark: 8,
        epoch: 'one',
        hasMore: true,
      }),
    };
    const repo = new SharedRepository(
      new SqliteStorage(sqliteDb(control)),
      'delta',
      actor,
      initial,
      remote,
    );
    await repo.init();
    control.failAt = control.runs + 1;
    await repo.sync();
    expect(repo.current().confirmed.cursor).toBe(0);
    control.failAt = 0;
    await repo.sync();
    expect(repo.current().confirmed.cursor).toBe(1);
    expect(repo.current().error).toContain('DELTA_ORDER');
  });
});
