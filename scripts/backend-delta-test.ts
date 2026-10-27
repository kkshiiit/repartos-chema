/** Real Auth/Edge/Postgres delta delivery into real SQLite, disposable QA identities only. */
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { SharedAuth, SharedSessionVault } from '../src/shared/auth';
import { createSharedClient } from '../src/shared/client';
import { createCommand } from '../src/shared/protocol';
import { SharedRepository } from '../src/shared/repository';
import { SqliteStorage } from '../src/data/sqliteStorage';
import { sqliteDb } from '../tests/helpers/sqlite';
import { SHARED_CONFIG } from '../src/services/sharedConfig';
const qa = JSON.parse(readFileSync(process.env.CHEMA_REMOTE_QA_FILE!, 'utf8'));
if (!/^chema-qa-[a-f0-9]+@example\.invalid$/.test(qa.email) || !qa.completed)
  throw Error('Sólo QA sintética validada');
const auth = () => {
  const d = new Map<string, string>();
  return new SharedAuth(
    SHARED_CONFIG,
    new SharedSessionVault({
      getItem: async (k) => d.get(k) ?? null,
      setItem: async (k, v) => {
        d.set(k, v);
      },
    }),
  );
};
const a = auth(),
  b = auth();
await a.signIn(qa.email, qa.password);
await b.signIn(qa.email2, qa.password);
const ra = createSharedClient(
  { ...SHARED_CONFIG, spaceId: qa.spaceId, expectedUserId: qa.userId },
  (u) => a.accessToken(u),
);
const rb = createSharedClient(
  { ...SHARED_CONFIG, spaceId: qa.spaceId, expectedUserId: qa.userId2 },
  (u) => b.accessToken(u),
);
const initial = await rb.snapshot();
const actor = {
  uid: qa.userId2,
  nombre: initial.member!.nombre,
  role: initial.member!.role,
  email: qa.email2,
  createdAt: new Date().toISOString(),
};
let snapshotReads = 0;
const receiver = new SharedRepository(new SqliteStorage(sqliteDb()), qa.spaceId, actor, initial, {
  ...rb,
  snapshot: async () => {
    snapshotReads++;
    return rb.snapshot();
  },
});
await receiver.init();
for (let i = 0; i < 3; i++) {
  const before = await ra.snapshot();
  const command = createCommand(
    before,
    { type: 'RESPONSABLES', nombres: ['Responsable QA ' + i] },
    randomUUID(),
    qa.userId,
  );
  const result = await ra.commit(command);
  assert.equal(result.kind, 'CONFIRMED');
}
await receiver.sync();
const final = receiver.current();
assert.equal(final.confirmed.cursor, initial.cursor + 3);
assert.deepEqual(final.state.responsables, ['Responsable QA 2']);
assert.equal(snapshotReads, 0);
assert.deepEqual(final.state.materiales, initial.state.materiales);
assert.equal(final.outbox.length, 0);
assert.equal(final.receivingPending, false);
console.log(
  'PASS tres cambios recibidos por delta real y SQLite sin pedir snapshot ni mover stock',
);
const again = await rb.deltaPull!(final.confirmed.cursor, final.confirmed.epoch);
assert.equal(again.kind, 'DELTA');
if (again.kind === 'DELTA') assert.equal(again.changes.length, 0);
console.log('PASS cursor confirmado repetido no vuelve a entregar cambios');
const reset = await rb.deltaPull!(0, final.confirmed.epoch);
assert.equal(reset.kind, 'RESET');
console.log('PASS historia previa sin delta requiere RESET explícito');
writeFileSync(
  `${process.env.CHEMA_QA_EVIDENCE_DIR}/delta-remota-real.json`,
  JSON.stringify(
    {
      dateUTC: new Date().toISOString(),
      passed: 3,
      failed: 0,
      environment: 'Auth/Edge v5/PostgreSQL reales + SQLiteNode, dos identidades sintéticas',
      physicalAndroid: false,
      source: 'post53a30d1, diff delta etapa3',
    },
    null,
    2,
  ) + '\n',
);
