import { beforeAll, afterAll, it } from 'vitest';
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
  RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getMetadata } from 'firebase/storage';
import { readFileSync } from 'node:fs';
let env: RulesTestEnvironment;
beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-repartos-chema',
    firestore: { host: '127.0.0.1', port: 8080, rules: readFileSync('firestore.rules', 'utf8') },
    storage: { host: '127.0.0.1', port: 9199, rules: readFileSync('storage.rules', 'utf8') },
  });
  await env.withSecurityRulesDisabled(async (c) => {
    await setDoc(doc(c.firestore(), 'users', 'admin'), { role: 'ADMIN' });
    await setDoc(doc(c.firestore(), 'users', 'operator'), { role: 'OPERADOR' });
    await setDoc(doc(c.firestore(), 'system', 'state'), { revision: 0 });
    await setDoc(doc(c.firestore(), 'audit', 'one'), { accion: 'Entrega' });
  });
}, 30000);
afterAll(async () => {
  await env?.cleanup();
});
it('bloquea lectura anónima y correo no verificado', async () => {
  await assertFails(getDoc(doc(env.unauthenticatedContext().firestore(), 'system', 'state')));
  await assertFails(
    getDoc(
      doc(
        env.authenticatedContext('operator', { email_verified: false }).firestore(),
        'system',
        'state',
      ),
    ),
  );
});
it('permite lectura de inventario a miembros verificados', async () => {
  await assertSucceeds(
    getDoc(
      doc(
        env.authenticatedContext('operator', { email_verified: true }).firestore(),
        'system',
        'state',
      ),
    ),
  );
});
it('ningún cliente escribe directamente inventario o roles', async () => {
  for (const uid of ['admin', 'operator']) {
    const db = env.authenticatedContext(uid, { email_verified: true }).firestore();
    await assertFails(setDoc(doc(db, 'system', 'state'), { revision: 99 }));
    await assertFails(setDoc(doc(db, 'users', uid), { role: 'ADMIN' }));
  }
});
it('auditoría completa solo para administración', async () => {
  await assertSucceeds(
    getDoc(
      doc(env.authenticatedContext('admin', { email_verified: true }).firestore(), 'audit', 'one'),
    ),
  );
  await assertFails(
    getDoc(
      doc(
        env.authenticatedContext('operator', { email_verified: true }).firestore(),
        'audit',
        'one',
      ),
    ),
  );
});
it('fotos propias JPEG y límites de autor', async () => {
  const storage = env.authenticatedContext('operator', { email_verified: true }).storage();
  await assertSucceeds(
    uploadBytes(
      ref(storage, 'photos/operator/obra/photo.jpg'),
      new Uint8Array([255, 216, 255, 217]),
      { contentType: 'image/jpeg' },
    ),
  );
  await assertFails(
    uploadBytes(ref(storage, 'photos/admin/obra/photo.jpg'), new Uint8Array([1]), {
      contentType: 'image/jpeg',
    }),
  );
  await assertFails(
    uploadBytes(ref(storage, 'photos/operator/obra/unsafe.html'), new Uint8Array([1]), {
      contentType: 'text/html',
    }),
  );
  await assertFails(
    uploadBytes(ref(storage, 'photos/operator/obra/photo.jpg'), new Uint8Array([1]), {
      contentType: 'image/jpeg',
    }),
  );
});
it('documentos privados no admiten escrituras de cliente', async () => {
  const storage = env.authenticatedContext('admin', { email_verified: true }).storage();
  await assertFails(uploadBytes(ref(storage, 'exports/admin/private.xlsx'), new Uint8Array([1])));
  await assertFails(
    getMetadata(ref(env.unauthenticatedContext().storage(), 'exports/admin/private.xlsx')),
  );
});

it('documento existente solo es legible por ADMIN propietario antes de vencer', async () => {
  await env.withSecurityRulesDisabled(async (c) => {
    await uploadBytes(ref(c.storage(), 'exports/admin/valid.docx'), new Uint8Array([1, 2]), {
      customMetadata: { expiresAt: String(Date.now() + 3600000) },
    });
    await uploadBytes(ref(c.storage(), 'exports/admin/expired.docx'), new Uint8Array([1, 2]), {
      customMetadata: { expiresAt: String(Date.now() - 60000) },
    });
    await setDoc(doc(c.firestore(), 'users', 'other_admin'), { role: 'ADMIN' });
  });
  const own = env.authenticatedContext('admin', { email_verified: true }).storage();
  await assertSucceeds(getMetadata(ref(own, 'exports/admin/valid.docx')));
  await assertFails(getMetadata(ref(own, 'exports/admin/expired.docx')));
  for (const uid of ['other_admin', 'operator'])
    await assertFails(
      getMetadata(
        ref(
          env.authenticatedContext(uid, { email_verified: true }).storage(),
          'exports/admin/valid.docx',
        ),
      ),
    );
  await assertFails(
    getMetadata(ref(env.unauthenticatedContext().storage(), 'exports/admin/valid.docx')),
  );
});
