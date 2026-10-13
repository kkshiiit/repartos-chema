import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { getMessaging } from 'firebase-admin/messaging';
import { onCall, HttpsError, CallableRequest } from 'firebase-functions/v2/https';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { setGlobalOptions } from 'firebase-functions/v2';
import ExcelJS from 'exceljs';
import { createHash, randomUUID } from 'node:crypto';
import { z } from 'zod';
import { applyOperation, clone } from '../../src/domain/engine';
import { commandSchema } from '../../src/domain/schema';
import { obraStatus, validDate } from '../../src/domain/rules';
import type { AppState, UserProfile } from '../../src/types';
import { generateExcel } from './excelGenerator';
import { generateWord } from './wordGenerator';
initializeApp();
const db = getFirestore();
const stateRef = db.doc('system/state');
setGlobalOptions({ region: 'us-central1', maxInstances: 10 });
async function profile(req: CallableRequest): Promise<UserProfile> {
  if (!req.auth?.uid || req.auth.token.email_verified !== true)
    throw new HttpsError('unauthenticated', 'Se requiere correo verificado.');
  const snap = await db.doc(`users/${req.auth.uid}`).get();
  const p = snap.data() as UserProfile | undefined;
  if (!p || !['ADMIN', 'OPERADOR'].includes(p.role))
    throw new HttpsError('permission-denied', 'Perfil no autorizado.');
  return { ...p, uid: req.auth.uid };
}
async function admin(req: CallableRequest) {
  const p = await profile(req);
  if (p.role !== 'ADMIN') throw new HttpsError('permission-denied', 'Solo administración.');
  return p;
}
function compact(state: AppState) {
  const s = clone(state);
  s.logs = s.logs.slice(0, 100).map((l, index) => {
    if (index > 0) delete l.payloadInverso;
    return l;
  });
  s.appliedIds = s.appliedIds.slice(-100);
  s.notificaciones = s.notificaciones.slice(-100);
  for (const o of s.obras) o.syncStatus = 'SYNCED';
  return s;
}
export const applyMovement = onCall({ timeoutSeconds: 60, memory: '512MiB' }, async (req) => {
  const actor = await profile(req);
  const parsed = commandSchema.safeParse(req.data);
  if (!parsed.success) throw new HttpsError('invalid-argument', 'Datos de operación inválidos.');
  const command = parsed.data;
  // Los metadatos y el actor nunca se aceptan del dispositivo.
  const receipt = db.doc(`operations/${command.id}`),
    audit = db.doc(`audit/${command.id}`);
  if (command.action.type === 'PHOTO') {
    const p = command.action.photo,
      expected = `photos/${actor.uid}/${command.action.obraId}/${p.id}.jpg`;
    if (p.storagePath !== expected || p.status !== 'SYNCED' || p.usuarioUid !== actor.uid)
      throw new HttpsError('invalid-argument', 'Referencia de foto inválida.');
    const [meta] = await getStorage().bucket().file(expected).getMetadata();
    if (meta.contentType !== 'image/jpeg' || Number(meta.size) > 2097152)
      throw new HttpsError('invalid-argument', 'Foto inválida.');
    const url = new URL(p.uri);
    if (
      url.protocol !== 'https:' ||
      url.hostname !== 'firebasestorage.googleapis.com' ||
      !decodeURIComponent(url.pathname).endsWith(`/o/${expected}`)
    )
      throw new HttpsError('invalid-argument', 'URL de foto inválida.');
  }
  try {
    return await db.runTransaction(async (tx) => {
      const [prior, doc] = await Promise.all([tx.get(receipt), tx.get(stateRef)]);
      if (!doc.exists) throw new HttpsError('failed-precondition', 'Backend sin inicializar.');
      const before = doc.data() as AppState;
      if (prior.exists) {
        if (
          prior.get('uid') !== actor.uid ||
          prior.get('actionHash') !==
            createHash('sha256').update(JSON.stringify(command.action)).digest('hex')
        )
          throw new HttpsError(
            'permission-denied',
            'Identificador reutilizado para otra operación.',
          );
        return before;
      }
      // Revalidar rol dentro de la transacción, incluso si cambió durante la petición.
      const userDoc = await tx.get(db.doc(`users/${actor.uid}`));
      const currentRole = userDoc.get('role');
      if (!['ADMIN', 'OPERADOR'].includes(currentRole))
        throw new HttpsError('permission-denied', 'Perfil revocado.');
      const now = new Date();
      const next = applyOperation(
        before,
        {
          id: command.id,
          action: command.action,
          actor: { ...actor, role: currentRole },
          createdAt: now.toISOString(),
        },
        now,
      );
      if (next.obras.length > 200 || next.materiales.length > 300)
        throw new HttpsError(
          'resource-exhausted',
          'Se alcanzó el límite del agregado. Requiere partición antes de ampliar.',
        );
      const stored = compact(next);
      if (Buffer.byteLength(JSON.stringify(stored)) > 750000)
        throw new HttpsError(
          'resource-exhausted',
          'El registro alcanzó su límite. Contacta administración para archivar datos.',
        );
      tx.set(stateRef, stored);
      tx.create(receipt, {
        uid: actor.uid,
        actionHash: createHash('sha256').update(JSON.stringify(command.action)).digest('hex'),
        timestamp: now.toISOString(),
      });
      const log = next.logs[0]!;
      tx.create(audit, JSON.parse(JSON.stringify(log)));
      if (
        next.notificaciones.some((n) => n.id === command.id) &&
        !before.notificaciones.some((n) => n.id === command.id)
      )
        tx.create(db.doc(`notifications/${command.id}`), {
          ...next.notificaciones.find((n) => n.id === command.id),
          attempts: 0,
          createdAt: now.toISOString(),
        });
      if (command.action.type === 'DELETE_PHOTO') {
        const a = command.action;
        const p = before.obras
          .find((o) => o.id === a.obraId)
          ?.fotos?.find((p) => p.id === a.photoId);
        if (p?.storagePath) tx.create(db.doc(`fileCleanup/${command.id}`), { path: p.storagePath });
      }
      return stored;
    });
  } catch (e) {
    if (e instanceof HttpsError) throw e;
    throw new HttpsError(
      'failed-precondition',
      e instanceof Error ? e.message : 'Movimiento rechazado.',
    );
  }
});
const exportSchema = z
  .object({
    kind: z.enum(['excel', 'word']),
    obraId: z.string().max(100).optional(),
    from: z.string().max(10).optional(),
    to: z.string().max(10).optional(),
    status: z
      .enum(['TODAS', 'VERDE', 'AMARILLO', 'ROJO', 'PENDIENTE', 'RETIRADO', 'REINGRESADO'])
      .optional(),
  })
  .strict();
export const exportDocument = onCall(
  { timeoutSeconds: 120, memory: '1GiB', maxInstances: 3 },
  async (req) => {
    const actor = await admin(req);
    const parsed = exportSchema.safeParse(req.data);
    if (!parsed.success) throw new HttpsError('invalid-argument', 'Filtros inválidos.');
    const p = parsed.data;
    try {
      if (p.from) validDate(p.from);
      if (p.to) validDate(p.to);
      if (p.from && p.to && p.from > p.to) throw new Error('Rango inválido.');
    } catch {
      throw new HttpsError('invalid-argument', 'Fechas inválidas.');
    }
    const state = (await stateRef.get()).data() as AppState | undefined;
    if (!state) throw new HttpsError('failed-precondition', 'Backend sin inicializar.');
    const obras = state.obras.filter((o) =>
      p.kind === 'word'
        ? o.id === p.obraId
        : (!p.from || o.fechaEntrega >= p.from) &&
          (!p.to || o.fechaEntrega <= p.to) &&
          (!p.status || p.status === 'TODAS' || obraStatus(o).key === p.status),
    );
    if (!obras.length) throw new HttpsError('not-found', 'Sin obras para exportar.');
    if (obras.length > 200)
      throw new HttpsError('resource-exhausted', 'Máximo 200 obras por reporte.');
    const buffer =
      p.kind === 'word'
        ? await generateWord(obras[0]!)
        : Buffer.from(await generateExcel(obras, ExcelJS.Workbook));
    if (buffer.length > 12 * 1024 * 1024)
      throw new HttpsError('resource-exhausted', 'Documento demasiado grande.');
    const path = `exports/${actor.uid}/${randomUUID()}.${p.kind === 'word' ? 'docx' : 'xlsx'}`;
    await getStorage()
      .bucket()
      .file(path)
      .save(buffer, {
        resumable: false,
        contentType:
          p.kind === 'word'
            ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        metadata: {
          cacheControl: 'private, max-age=0',
          metadata: { expiresAt: String(Date.now() + 3600000) },
        },
      });
    await db
      .collection('exports')
      .add({
        uid: actor.uid,
        path,
        createdAt: new Date().toISOString(),
        expiresAt: Date.now() + 3600000,
        kind: p.kind,
        count: obras.length,
      });
    return { path };
  },
);
export const registerPushToken = onCall(async (req) => {
  const actor = await admin(req);
  const p = z
    .object({ token: z.string().min(20).max(4096) })
    .strict()
    .parse(req.data);
  const id = createHash('sha256').update(p.token).digest('hex');
  await db
    .doc(`pushTokens/${id}`)
    .set({ uid: actor.uid, token: p.token, updatedAt: new Date().toISOString() });
  return { registered: true };
});
async function sendNotification(id: string) {
  const ref = db.doc(`notifications/${id}`);
  const claimed = await db.runTransaction(async (tx) => {
    const doc = await tx.get(ref),
      n = doc.data();
    if (!n || n.status === 'SENT' || (n.leaseUntil || 0) > Date.now() || (n.attempts || 0) >= 5)
      return null;
    tx.update(ref, { leaseUntil: Date.now() + 120000, attempts: (n.attempts || 0) + 1 });
    return n;
  });
  if (!claimed) return;
  let status: 'SENT' | 'FAILED' = 'FAILED',
    error = 'No hay tokens de administradores registrados.';
  try {
    const entries = await db.collection('pushTokens').limit(500).get();
    const allowed: string[] = [];
    for (const token of entries.docs) {
      const user = await db.doc(`users/${token.get('uid')}`).get();
      if (user.get('role') === 'ADMIN') allowed.push(token.get('token'));
    }
    if (allowed.length) {
      const result = await getMessaging().sendEachForMulticast({
        tokens: allowed,
        notification: { title: 'Repartos Chema', body: String(claimed.message) },
        data: { eventId: id, obraId: String(claimed.obraId) },
        android: { collapseKey: id },
        webpush: { notification: { tag: id } },
      });
      if (result.failureCount === 0) {
        status = 'SENT';
        error = '';
      } else error = `${result.failureCount} destinatarios rechazados; se reintentará.`;
    }
  } catch (e) {
    error = e instanceof Error ? e.message : 'Error FCM';
  }
  await db.runTransaction(async (tx) => {
    const state = await tx.get(stateRef);
    tx.update(ref, { status, error, leaseUntil: 0 });
    if (state.exists) {
      const s = state.data() as AppState;
      const n = s.notificaciones.find((n) => n.id === id);
      if (n) {
        n.status = status;
        if (error) n.error = error;
        else delete n.error;
        tx.update(stateRef, { notificaciones: s.notificaciones });
      }
    }
  });
}
export const notifyAdmins = onDocumentCreated(
  { document: 'notifications/{id}', retry: true },
  (event) => sendNotification(event.params.id),
);
export const retryNotifications = onSchedule('every 15 minutes', async () => {
  const pending = await db
    .collection('notifications')
    .where('status', 'in', ['PENDING', 'FAILED'])
    .limit(100)
    .get();
  for (const n of pending.docs) await sendNotification(n.id);
});
export const cleanPhoto = onDocumentCreated(
  { document: 'fileCleanup/{id}', retry: true },
  async (event) => {
    const path = event.data?.get('path');
    if (typeof path === 'string' && path.startsWith('photos/'))
      await getStorage().bucket().file(path).delete({ ignoreNotFound: true });
    await event.data?.ref.delete();
  },
);
export const cleanDocuments = onSchedule('every 60 minutes', async () => {
  const expired = await db
    .collection('exports')
    .where('expiresAt', '<', Date.now())
    .limit(100)
    .get();
  for (const d of expired.docs) {
    await getStorage().bucket().file(d.get('path')).delete({ ignoreNotFound: true });
    await d.ref.delete();
  }
});
