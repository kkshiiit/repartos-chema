import { beforeEach, it, expect } from 'vitest';
import { createRequire } from 'node:module';
import { seed } from '../src/data/seed';
const require = createRequire(new URL('../functions/package.json', import.meta.url));
const {
  joinTeam,
  createTeamInvitation,
  removeTeamMember,
  applyMovement,
  exportDocument,
} = require('./lib/functions/src/index.js');
const { getFirestore } = require('firebase-admin/firestore');
const { createHash } = require('node:crypto');
if (process.env.GCLOUD_PROJECT !== 'demo-repartos-chema' || !process.env.FIRESTORE_EMULATOR_HOST)
  throw new Error('Solo emuladores de prueba.');
const db = getFirestore();
let owner = '',
  guest = '';
const req = (uid: string, data: unknown) => ({
  auth: { uid, token: { email_verified: false } },
  data,
});
beforeEach(async () => {
  owner = `owner_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  guest = `guest_${owner}`;
  await db.doc(`users/${owner}`).set({
    uid: owner,
    nombre: 'Equipo de prueba',
    role: 'ADMIN',
    teamAccess: true,
    active: true,
    teamOwner: true,
    createdAt: new Date().toISOString(),
  });
  await db.doc('system/team').set({ ownerUid: owner });
  await db.doc('system/state').set(seed());
});
it('el nombre solo no permite acceder; una invitación fuerte solo puede consumirse una vez', async () => {
  await expect(joinTeam.run(req(guest, { nombre: 'Ana', token: '' }))).rejects.toMatchObject({
    code: 'permission-denied',
  });
  const invite = await createTeamInvitation.run(req(owner, {})),
    token = new URL(invite.url).searchParams.get('token');
  expect(token).toMatch(/^[a-f0-9]{64}$/);
  const joined = await joinTeam.run(req(guest, { nombre: 'Ana', token }));
  expect(joined.uid).toBe(guest);
  expect(joined.owner).toBe(false);
  expect((await db.doc(`users/${guest}`).get()).get('role')).toBe('ADMIN');
  await expect(
    joinTeam.run(req('another_' + guest, { nombre: 'Otro', token })),
  ).rejects.toMatchObject({ code: 'permission-denied' });
  await expect(joinTeam.run(req(guest, { nombre: 'Ana', token }))).resolves.toMatchObject({
    uid: guest,
  });
  const state = await applyMovement.run(
    req(guest, {
      id: `move_${guest}`,
      action: { type: 'RESPONSABLES', nombres: ['Flete de prueba'] },
    }),
  );
  expect(state.responsables).toEqual(['Flete de prueba']);
});
it('solo propietario quita acceso; la revocación impide operar y exportar sin borrar historial', async () => {
  const invite = await createTeamInvitation.run(req(owner, {})),
    token = new URL(invite.url).searchParams.get('token');
  await joinTeam.run(req(guest, { nombre: 'Ana', token }));
  await expect(createTeamInvitation.run(req(guest, {}))).rejects.toMatchObject({
    code: 'permission-denied',
  });
  await expect(removeTeamMember.run(req(guest, { uid: owner }))).rejects.toMatchObject({
    code: 'permission-denied',
  });
  await expect(removeTeamMember.run(req(owner, { uid: owner }))).rejects.toMatchObject({
    code: 'failed-precondition',
  });
  const movement = req(guest, {
    id: `before_${guest}`,
    action: { type: 'RESPONSABLES', nombres: ['Flete'] },
  });
  await applyMovement.run(movement);
  await removeTeamMember.run(req(owner, { uid: guest }));
  await removeTeamMember.run(req(owner, { uid: guest }));
  await expect(applyMovement.run(movement)).rejects.toMatchObject({ code: 'permission-denied' });
  await expect(exportDocument.run(req(guest, { kind: 'excel' }))).rejects.toMatchObject({
    code: 'permission-denied',
  });
  expect((await db.doc(`audit/${movement.data.id}`).get()).exists).toBe(true);
  await expect(joinTeam.run(req(guest, { nombre: 'Ana', token }))).rejects.toMatchObject({
    code: 'permission-denied',
  });
});
it('invitaciones vencidas no incorporan miembros y demasiados intentos se limitan', async () => {
  const invite = await createTeamInvitation.run(req(owner, {})),
    token = new URL(invite.url).searchParams.get('token');
  const hash = createHash('sha256').update(token).digest('hex');
  await db.doc(`teamInvitations/${hash}`).update({ expiresAt: '2000-01-01T00:00:00Z' });
  await expect(joinTeam.run(req(guest, { nombre: 'Ana', token }))).rejects.toMatchObject({
    code: 'permission-denied',
  });
  expect((await db.doc(`users/${guest}`).get()).exists).toBe(false);
  await db.doc(`teamJoinLimits/${guest}`).set({ window: Date.now(), attempts: 10 });
  await expect(joinTeam.run(req(guest, { nombre: 'Ana', token }))).rejects.toMatchObject({
    code: 'resource-exhausted',
  });
});
