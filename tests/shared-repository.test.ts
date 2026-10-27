import { describe, it, expect } from 'vitest';
import { seed, demoProfile } from '../src/data/seed';
import { SqliteStorage } from '../src/data/sqliteStorage';
import { sqliteDb } from './helpers/sqlite';
import {
  bootstrapShared,
  prepareCommit,
  type SharedRemote,
  type CommitResult,
} from '../src/shared/protocol';
import { SharedRepository } from '../src/shared/repository';
const actor = demoProfile('ADMIN'),
  now = new Date('2026-10-10T12:00:00Z');
function server() {
  let snapshot = bootstrapShared('space_test', seed(now), 'epoch_test');
  const receipts = new Map<string, CommitResult>();
  let failReply = false;
  const remote: SharedRemote = {
    snapshot: async () => snapshot,
    receipt: async (id) => receipts.get(id) || null,
    pull: async () => ({ changes: [snapshot], watermark: snapshot.cursor, epoch: snapshot.epoch }),
    commit: async (command) => {
      const result =
        receipts.get(command.operationId) || prepareCommit(snapshot, command, actor, now);
      if (result.kind === 'CONFIRMED') {
        snapshot = result.snapshot;
        receipts.set(command.operationId, result);
      }
      if (failReply) {
        failReply = false;
        throw new Error('respuesta perdida');
      }
      return result;
    },
  };
  return {
    remote,
    initial: snapshot,
    loseReply: () => {
      failReply = true;
    },
  };
}
describe('cola compartida durable', () => {
  it('cierre y reapertura tras timeout consulta recibo sin duplicar retiro', async () => {
    const backend = server(),
      storage = new SqliteStorage(sqliteDb());
    const a = new SharedRepository(storage, 'space_test', actor, backend.initial, backend.remote);
    await a.init();
    await a.dispatch(
      { type: 'RETIRE', obraId: 'obra_1', responsables: ['Fabián'], incidents: [] },
      'retire_one',
    );
    backend.loseReply();
    await a.sync();
    expect(a.current().outbox[0]?.status).toBe('ERROR');
    const b = new SharedRepository(storage, 'space_test', actor, backend.initial, backend.remote);
    await b.init();
    await b.sync();
    expect(b.current().outbox).toHaveLength(0);
    expect(b.current().confirmed.state.appliedIds.filter((id) => id === 'retire_one')).toHaveLength(
      1,
    );
    expect(b.current().state.obras.find((o) => o.id === 'obra_1')?.estadoProceso).toBe('RETIRADO');
  });
  it('fallo de persistencia no publica un éxito ni pierde el estado anterior', async () => {
    const backend = server(),
      control = { failRoot: false, failAt: 0, runs: 0 },
      storage = new SqliteStorage(sqliteDb(control));
    const repo = new SharedRepository(
      storage,
      'space_test',
      actor,
      backend.initial,
      backend.remote,
    );
    await repo.init();
    const before = repo.current();
    control.failAt = control.runs + 1;
    await expect(
      repo.dispatch({ type: 'RESPONSABLES', nombres: ['Flete'] }, 'failed'),
    ).rejects.toThrow();
    expect(repo.current()).toEqual(before);
  });
  it('conflicto se conserva después de reabrir y cambiar usuario no toma su cola', async () => {
    const backend = server(),
      storage = new SqliteStorage(sqliteDb());
    const a = new SharedRepository(storage, 'space_test', actor, backend.initial, backend.remote);
    await a.init();
    const action = {
      type: 'RETIRE' as const,
      obraId: 'obra_1',
      responsables: ['Fabián'],
      incidents: [],
    };
    await a.dispatch(action, 'a');
    const other = new SharedRepository(
      storage,
      'space_test',
      { ...actor, uid: 'otro' },
      backend.initial,
      backend.remote,
    );
    await other.init();
    expect(other.current().outbox).toHaveLength(0);
    await other.dispatch(action, 'b');
    await other.sync();
    await a.sync();
    expect(a.current().outbox[0]?.status).toBe('CONFLICT');
    const reopened = new SharedRepository(
      storage,
      'space_test',
      actor,
      backend.initial,
      backend.remote,
    );
    await reopened.init();
    expect(reopened.current().outbox[0]?.status).toBe('CONFLICT');
  });
});
it('una respuesta atrasada no hace retroceder cursor, datos ni revisión confirmada', async () => {
  const backend = server(),
    storage = new SqliteStorage(sqliteDb());
  const base = backend.initial;
  const { createCommand } = await import('../src/shared/protocol');
  const result = await backend.remote.commit(
    createCommand(
      base,
      { type: 'RESPONSABLES', nombres: ['Nombre actualizado'] },
      'remote_new',
      actor.uid,
    ),
  );
  if (result.kind !== 'CONFIRMED') throw Error('fixture');
  const repo = new SharedRepository(storage, 'space_test', actor, base, backend.remote);
  await repo.init();
  await repo.sync();
  expect(repo.current().confirmed.cursor).toBe(1);
  backend.remote.snapshot = async () => base;
  await repo.sync();
  expect(repo.current().confirmed.cursor).toBe(1);
  expect(repo.current().state.responsables).toEqual(['Nombre actualizado']);
  expect(repo.current().error).toMatch(/anterior|atrasada/);
});
