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
import { matchesStatusFilter, validDate, DomainError } from '../../src/domain/rules';
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
  const hash = createHash('sha256').update(JSON.stringify(command.action)).digest('hex');
  try {
    // Reintentar un comando confirmado no depende de que su foto siga existiendo.
    const prior = await receipt.get();
    if (prior.exists) {
      if (prior.get('uid') !== actor.uid || prior.get('actionHash') !== hash)
        throw new HttpsError('permission-denied', 'Identificador reutilizado.');
      const current = await stateRef.get();
      if (!current.exists) throw new HttpsError('failed-precondition', 'Backend sin inicializar.');
      return current.data();
    }
    if (command.action.type === 'PHOTO') {
      const p = command.action.photo,
        expected = `photos/${actor.uid}/${command.action.obraId}/${p.id}.jpg`;
      if (p.storagePath !== expected || p.status !== 'SYNCED' || p.usuarioUid !== actor.uid)
        throw new HttpsError('invalid-argument', 'Referencia de foto inválida.');
      const [meta] = await getStorage().bucket().file(expected).getMetadata();
      if (meta.contentType !== 'image/jpeg' || Number(meta.size) > 2097152)
        throw new HttpsError('invalid-argument', 'Foto inválida.');
      const [bytes] = await getStorage().bucket().file(expected).download();
      if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8 || bytes[2] !== 0xff)
        throw new HttpsError('invalid-argument', 'El archivo no contiene una imagen JPEG.');
      const url = new URL(p.uri);
      if (
        url.protocol !== 'https:' ||
        url.hostname !== 'firebasestorage.googleapis.com' ||
        decodeURIComponent(url.pathname) !== `/v0/b/${getStorage().bucket().name}/o/${expected}`
      )
        throw new HttpsError('invalid-argument', 'URL de foto inválida.');
    }
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
      const undoAudit =
        command.action.type === 'UNDO'
          ? await tx.get(db.doc(`audit/${command.action.logId}`))
          : null;
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
      if (undoAudit?.exists) tx.update(undoAudit.ref, { undoneBy: command.id });
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
    if (e instanceof DomainError) throw new HttpsError('failed-precondition', e.message);
    const code = (e as { code?: string | number }).code;
    if (code === 404)
      throw new HttpsError('not-found', 'La foto no está disponible. Revisa el archivo.');
    throw new HttpsError(
      'unavailable',
      'No se pudo confirmar con el servidor. Se conservará el intento para reintentar.',
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
          (!p.status || matchesStatusFilter(o, p.status)),
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
    await db.collection('exports').add({
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
    if (!n || n.status === 'SENT' || n.status === 'EXHAUSTED' || (n.leaseUntil || 0) > Date.now())
      return null;
    if ((n.attempts || 0) >= 5) {
      tx.update(ref, { status: 'EXHAUSTED', leaseUntil: 0 });
      return null;
    }
    tx.update(ref, { leaseUntil: Date.now() + 120000, attempts: (n.attempts || 0) + 1 });
    return n;
  });
  if (!claimed) return;
  let status: 'SENT' | 'FAILED' | 'EXHAUSTED' = 'FAILED',
    error = 'No hay tokens de administradores registrados.';
  try {
    const entries = await db.collection('pushTokens').limit(500).get();
    const uids = [...new Set(entries.docs.map((t) => String(t.get('uid'))))];
    const profiles = uids.length
      ? await db.getAll(...uids.map((uid) => db.doc(`users/${uid}`)))
      : [];
    const admins = new Set(profiles.filter((p) => p.get('role') === 'ADMIN').map((p) => p.id));
    const accepted = new Set<string>(claimed.acceptedTokenIds || []);
    const allowed = entries.docs.filter(
      (token) => admins.has(token.get('uid')) && !accepted.has(token.id),
    );
    if (allowed.length) {
      const result = await getMessaging().sendEachForMulticast({
        tokens: allowed.map((t) => String(t.get('token'))),
        // No mostrar datos de clientes en la pantalla bloqueada del dispositivo.
        notification: {
          title: 'Repartos Chema',
          body: 'Hay un faltante registrado. Abre la aplicación para revisarlo.',
        },
        data: { eventId: id, obraId: String(claimed.obraId) },
        android: { collapseKey: id },
        webpush: { notification: { tag: id } },
      });
      let failed = 0;
      for (const [index, response] of result.responses.entries()) {
        const token = allowed[index]!;
        if (response.success) accepted.add(token.id);
        else if (
          [
            'messaging/registration-token-not-registered',
            'messaging/invalid-registration-token',
          ].includes(response.error?.code || '')
        )
          await token.ref.delete();
        else failed++;
      }
      // Persistir destinatarios aceptados evita reenviarles un fallo parcial posterior.
      await ref.update({ acceptedTokenIds: [...accepted] });
      if (failed === 0 && accepted.size > 0) {
        status = 'SENT';
        error = '';
      } else
        error = failed
          ? `${failed} destinatarios pendientes; se reintentará.`
          : 'No quedan tokens válidos. Activa los avisos otra vez.';
    } else if (accepted.size > 0) {
      status = 'SENT';
      error = '';
    }
  } catch (e) {
    error = e instanceof Error ? e.message : 'Error FCM';
  }
  if (status === 'FAILED' && (claimed.attempts || 0) + 1 >= 5) status = 'EXHAUSTED';
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
