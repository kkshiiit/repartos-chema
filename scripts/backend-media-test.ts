/** QA remoto con JPEG de 1px y dos cuentas desechables. No usar datos comerciales. */
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { SharedAuth, SharedSessionVault } from '../src/shared/auth';
import { createSharedClient } from '../src/shared/client';
import { createCommand } from '../src/shared/protocol';
import { validateJpeg, downloadSharedPhoto } from '../src/shared/media';
import { SHARED_CONFIG } from '../src/services/sharedConfig';
const qa = JSON.parse(
  readFileSync(process.env.CHEMA_REMOTE_QA_FILE || '/tmp/chema-remote-qa-private.json', 'utf8'),
);
if (!/^chema-qa-[a-f0-9]+@example\.invalid$/.test(qa.email) || !qa.completed)
  throw Error('QA no validada');
const auth = () => {
  const values = new Map<string, string>();
  return new SharedAuth(
    SHARED_CONFIG,
    new SharedSessionVault({
      getItem: async (k) => values.get(k) ?? null,
      setItem: async (k, v) => {
        values.set(k, v);
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
// Previous QA ends with revocation; a new private invitation explicitly restores this synthetic member.
const rejoin = await ra.request<{ token: string }>('invite');
await b.enroll(rejoin.token, 'Persona QA operativa', qa.email2, qa.password);
const bytes = new Uint8Array(readFileSync('tests/fixtures/media-synthetic.jpg'));
const hash = await validateJpeg(bytes);
const photoId = 'qa_photo_' + randomUUID().replaceAll('-', '');
let count = 0;
const run = async (name: string, fn: () => Promise<void>) => {
  await fn();
  count++;
  console.log('PASS ' + name);
};
const base = await ra.snapshot();
const obraId = base.state.obras[0]!.id;
const command = createCommand(
  base,
  {
    type: 'PHOTO',
    obraId,
    photo: { id: photoId, uri: 'chema-photo:' + photoId, status: 'PENDING', usuarioUid: qa.userId },
  },
  randomUUID(),
  qa.userId,
);
await run('registro foto conserva referencia lógica y existencias', async () => {
  const result = await ra.commit(command);
  assert.equal(result.kind, 'CONFIRMED');
  assert.deepEqual((await ra.snapshot()).state.materiales, base.state.materiales);
});
const upload = () =>
  ra.request<{ hash: string }>('photo-upload', {
    obraId,
    photoId,
    hash,
    data: Buffer.from(bytes).toString('base64'),
  });
await run('Storage privado recibe JPEG y reintento no reemplaza el objeto', async () => {
  assert.equal((await upload()).hash, hash);
  assert.equal((await upload()).hash, hash);
});
await run('otro miembro descarga bytes idénticos bajo Auth y ACL', async () => {
  assert.deepEqual(await downloadSharedPhoto(rb, obraId, photoId), bytes);
});
await run('referencia inexistente impide lectura y JPEG falso no se acepta', async () => {
  await assert.rejects(() => rb.request('photo-download', { obraId: 'another_rental', photoId }));
  await assert.rejects(() => ra.request('photo-upload', { obraId, photoId, hash, data: 'AAAA' }));
});
await run('bucket no entrega el objeto por URL pública anónima', async () => {
  const hex = (s: string) => Buffer.from(s).toString('hex');
  const path = [hex(qa.spaceId), hex(obraId), hex(photoId), hash + '.jpg'].join('/');
  const result = await fetch(SHARED_CONFIG.url + '/storage/v1/object/public/chema-photos/' + path);
  assert.notEqual(result.status, 200);
});
writeFileSync(
  `${process.env.CHEMA_QA_EVIDENCE_DIR || 'docs/evidencias-etapa2'}/media-remota-real.json`,
  JSON.stringify(
    {
      dateUTC: new Date().toISOString(),
      environment: 'Supabase Auth/Edge v3/Storage/Postgres reales; JPEG sintético1px',
      passed: count,
      failed: 0,
      photoId,
      spaceId: qa.spaceId,
      hash,
      physicalAndroid: false,
      cleanup: 'pendiente con QA de rutas',
    },
    null,
    2,
  ) + '\n',
);
console.log('PASS total ' + count);
