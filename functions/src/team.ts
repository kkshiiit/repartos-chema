import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getFirestore } from 'firebase-admin/firestore';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { z } from 'zod';
import { teamName, type TeamMember } from '../../src/domain/team';
const uidSchema = z.string().regex(/^[a-zA-Z0-9_-]{1,128}$/);
const options = { timeoutSeconds: 30, maxInstances: 3 } as const;
function uid(req: { auth?: { uid: string } | null }) {
  if (!req.auth?.uid)
    throw new HttpsError('unauthenticated', 'Se requiere una vinculación del dispositivo.');
  return req.auth.uid;
}
function member(data: FirebaseFirestore.DocumentData | undefined, id: string): TeamMember {
  if (!data?.teamAccess || data.active !== true)
    throw new HttpsError('permission-denied', 'Tu acceso al equipo no está activo.');
  return {
    uid: id,
    nombre: data.nombre,
    createdAt: data.createdAt,
    active: true,
    owner: data.teamOwner === true,
  };
}
export const joinTeam = onCall(options, async (req) => {
  const actorUid = uid(req),
    parsed = z
      .object({ nombre: z.string(), token: z.string().regex(/^$|^[a-f0-9]{64}$/) })
      .strict()
      .safeParse(req.data);
  if (!parsed.success) throw new HttpsError('invalid-argument', 'Nombre o invitación inválidos.');
  let nombre: string;
  try {
    nombre = teamName(parsed.data.nombre);
  } catch {
    throw new HttpsError('invalid-argument', 'Escribe tu nombre, entre 2 y 60 caracteres.');
  }
  const db = getFirestore(),
    userRef = db.doc(`users/${actorUid}`),
    teamRef = db.doc('system/team'),
    hash = createHash('sha256').update(parsed.data.token).digest('hex'),
    inviteRef = db.doc(`teamInvitations/${hash}`),
    limitRef = db.doc(`teamJoinLimits/${actorUid}`);
  const result = await db.runTransaction(async (tx) => {
    const [user, team, invite, limit] = await Promise.all([
      tx.get(userRef),
      tx.get(teamRef),
      tx.get(inviteRef),
      tx.get(limitRef),
    ]);
    if (!team.exists)
      throw new HttpsError(
        'failed-precondition',
        'El equipo aún no está configurado. Contacta al responsable.',
      );
    if (user.get('active') === false)
      throw new HttpsError(
        'permission-denied',
        'Tu acceso fue retirado. Contacta al responsable del equipo.',
      );
    if (user.get('teamAccess') === true) {
      return { member: member(user.data(), actorUid) };
    }
    const now = Date.now(),
      window = Number(limit.get('window') || 0),
      attempts = window > now - 3600000 ? Number(limit.get('attempts') || 0) : 0;
    if (attempts >= 10)
      throw new HttpsError(
        'resource-exhausted',
        'Demasiados intentos. Espera antes de volver a vincular.',
      );
    const data = invite.data();
    if (
      !parsed.data.token ||
      !data ||
      data.usedBy ||
      !Number.isFinite(Date.parse(data.expiresAt)) ||
      Date.parse(data.expiresAt) <= now
    ) {
      tx.set(limitRef, { window: window > now - 3600000 ? window : now, attempts: attempts + 1 });
      return { error: true };
    }
    const owner = await tx.get(db.doc(`users/${data.createdBy}`));
    if (owner.get('active') !== true || team.get('ownerUid') !== owner.id)
      throw new HttpsError('permission-denied', 'La invitación ya no está autorizada.');
    const m: TeamMember = {
      uid: actorUid,
      nombre,
      createdAt: new Date(now).toISOString(),
      active: true,
      owner: false,
    };
    tx.set(userRef, {
      uid: actorUid,
      nombre,
      email: '',
      role: 'ADMIN',
      createdAt: m.createdAt,
      teamAccess: true,
      teamOwner: false,
      active: true,
    });
    tx.update(inviteRef, { usedBy: actorUid, usedAt: m.createdAt });
    tx.create(db.doc(`teamAudit/${randomUUID()}`), {
      actorUid,
      action: 'JOIN',
      memberUid: actorUid,
      nombre,
      timestamp: m.createdAt,
    });
    return { member: m };
  });
  if ('error' in result)
    throw new HttpsError(
      'permission-denied',
      'La invitación venció, ya fue utilizada o no existe. Solicita otra.',
    );
  return result.member;
});
export const createTeamInvitation = onCall(options, async (req) => {
  const actorUid = uid(req),
    db = getFirestore(),
    token = randomBytes(32).toString('hex'),
    hash = createHash('sha256').update(token).digest('hex'),
    expiresAt = new Date(Date.now() + 86400000).toISOString();
  await db.runTransaction(async (tx) => {
    const [user, team] = await Promise.all([
      tx.get(db.doc(`users/${actorUid}`)),
      tx.get(db.doc('system/team')),
    ]);
    member(user.data(), actorUid);
    if (team.get('ownerUid') !== actorUid)
      throw new HttpsError('permission-denied', 'Solo quien gestiona el equipo puede invitar.');
    tx.create(db.doc(`teamInvitations/${hash}`), {
      createdBy: actorUid,
      createdAt: new Date().toISOString(),
      expiresAt,
    });
    tx.create(db.doc(`teamAudit/${randomUUID()}`), {
      actorUid,
      action: 'INVITE',
      timestamp: new Date().toISOString(),
    });
  });
  return { url: `repartoschema://equipo/unirse?token=${token}`, expiresAt };
});
export const listTeam = onCall(options, async (req) => {
  const actorUid = uid(req),
    db = getFirestore(),
    user = await db.doc(`users/${actorUid}`).get();
  member(user.data(), actorUid);
  const users = await db.collection('users').where('teamAccess', '==', true).limit(100).get();
  return users.docs.map((doc) => ({
    uid: doc.id,
    nombre: doc.get('nombre'),
    createdAt: doc.get('createdAt'),
    active: doc.get('active') === true,
    owner: doc.get('teamOwner') === true,
  }));
});
export const removeTeamMember = onCall(options, async (req) => {
  const actorUid = uid(req),
    parsed = z.object({ uid: uidSchema }).strict().safeParse(req.data);
  if (!parsed.success) throw new HttpsError('invalid-argument', 'Identificador inválido.');
  const db = getFirestore(),
    targetRef = db.doc(`users/${parsed.data.uid}`);
  await db.runTransaction(async (tx) => {
    const [user, team, target] = await Promise.all([
      tx.get(db.doc(`users/${actorUid}`)),
      tx.get(db.doc('system/team')),
      tx.get(targetRef),
    ]);
    member(user.data(), actorUid);
    if (team.get('ownerUid') !== actorUid)
      throw new HttpsError(
        'permission-denied',
        'Solo quien gestiona el equipo puede quitar accesos.',
      );
    if (parsed.data.uid === actorUid || target.get('teamOwner') === true)
      throw new HttpsError('failed-precondition', 'No se puede quitar al responsable del equipo.');
    if (!target.exists || !target.get('teamAccess'))
      throw new HttpsError('not-found', 'La persona no pertenece al equipo.');
    if (target.get('active') === false) return;
    tx.update(targetRef, { active: false, revokedAt: new Date().toISOString() });
    tx.create(db.doc(`teamAudit/${randomUUID()}`), {
      actorUid,
      action: 'REMOVE',
      memberUid: target.id,
      nombre: target.get('nombre'),
      timestamp: new Date().toISOString(),
    });
  });
  return { ok: true };
});
