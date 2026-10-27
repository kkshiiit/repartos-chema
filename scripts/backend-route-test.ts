/** Auth/SQL reales, exclusivamente espacio sintético generado por QA. */
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { SharedAuth, SharedSessionVault } from '../src/shared/auth';
import { createSharedClient } from '../src/shared/client';
import { SHARED_CONFIG } from '../src/services/sharedConfig';
import { proposalFromSnapshot, parsePublishedRoute } from '../src/services/publishedRoute';
const qa = JSON.parse(
  readFileSync(process.env.CHEMA_REMOTE_QA_FILE || '/tmp/chema-remote-qa-private.json', 'utf8'),
);
if (!/^chema-qa-[a-f0-9]+@example\.invalid$/.test(qa.email) || !qa.completed)
  throw Error('QA no validada');
const auth = () => {
  const data = new Map<string, string>();
  return new SharedAuth(
    SHARED_CONFIG,
    new SharedSessionVault({
      getItem: async (k) => data.get(k) ?? null,
      setItem: async (k, v) => {
        data.set(k, v);
      },
    }),
  );
};
const a = auth(),
  b = auth();
await a.signIn(qa.email, qa.password);
await b.signIn(qa.email2, qa.password);
const client = (identity: SharedAuth, uid: string) =>
  createSharedClient({ ...SHARED_CONFIG, spaceId: qa.spaceId, expectedUserId: uid }, (u) =>
    identity.accessToken(u),
  );
const ra = client(a, qa.userId),
  rb = client(b, qa.userId2);
let passed = 0;
const run = async (name: string, fn: () => Promise<void>) => {
  await fn();
  passed++;
  console.log('PASS ' + name);
};
const initial = await ra.snapshot();
const ids = Object.keys(initial.tasks);
const route = proposalFromSnapshot(ids, ids.length ? { [ids[0]!]: qa.userId2 } : {}, initial);
const before = parsePublishedRoute(await ra.request('get-route'));
const revision = before?.revision || 0;
await run('dos autores sobre misma versión no sobrescriben plan y no alteran stock', async () => {
  const saved = parsePublishedRoute(await ra.request('route', { expected: revision, route }));
  assert.equal(saved?.revision, revision + 1);
  await assert.rejects(
    () => rb.request('route', { expected: revision, route }),
    (e) => typeof e === 'object' && e !== null && 'status' in e && e.status === 409,
  );
  const current = parsePublishedRoute(await rb.request('get-route'));
  assert.equal(current?.userId, qa.userId);
  assert.deepEqual((await ra.snapshot()).state.materiales, initial.state.materiales);
});
await run('historia conserva versiones/autor y asignación real bajo revisión', async () => {
  const saved = parsePublishedRoute(
    await rb.request('route', {
      expected: revision + 1,
      route: { ...route, ids: [...ids].reverse() },
    }),
  );
  assert.equal(saved?.userId, qa.userId2);
  const rows = await ra.request<{ revision: number; userId: string }[]>('route-history');
  assert.equal(rows[0]?.revision, revision + 2);
  assert.equal(rows[1]?.userId, qa.userId);
});
const invite = await ra.request<{ token: string }>('invite');
await run('revocación con JWT vigente bloquea snapshot y fotografía privada', async () => {
  await ra.request('revoke', { targetId: qa.userId2 });
  await assert.rejects(() => rb.snapshot());
  const media = JSON.parse(
    readFileSync(
      `${process.env.CHEMA_QA_EVIDENCE_DIR || 'docs/evidencias-etapa2'}/media-remota-real.json`,
      'utf8',
    ),
  );
  await assert.rejects(() =>
    rb.request('photo-download', { obraId: initial.state.obras[0]!.id, photoId: media.photoId }),
  );
});
await run(
  'invitación nueva reincorpora misma identidad con rol OPERADOR y mismo stock',
  async () => {
    const enrolled = await b.enroll(invite.token, 'Persona QA operativa', qa.email2, qa.password);
    assert.equal(enrolled.session.userId, qa.userId2);
    const snap = await rb.snapshot();
    assert.equal(snap.member?.role, 'OPERADOR');
    assert.deepEqual(snap.state.materiales, initial.state.materiales);
  },
);
writeFileSync(
  `${process.env.CHEMA_QA_EVIDENCE_DIR || 'docs/evidencias-etapa2'}/ruta-remota-real.json`,
  JSON.stringify(
    {
      dateUTC: new Date().toISOString(),
      environment: 'Auth/Edge v4/PostgreSQL reales, dos identidades sintéticas',
      passed,
      failed: 0,
      physicalAndroid: false,
      spaceId: qa.spaceId,
    },
    null,
    2,
  ) + '\n',
);
