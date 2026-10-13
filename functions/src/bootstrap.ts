import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { emptyState } from '../../src/data/seed';
async function main() {
  const uid = process.argv[2],
    role = process.argv[3] || 'ADMIN',
    nombre = process.argv[4];
  if (!uid || !nombre || !['ADMIN', 'OPERADOR'].includes(role))
    throw new Error(
      'Uso: npm run bootstrap -- UID ADMIN|OPERADOR "Nombre verificado". Usa credenciales administrativas de tu proyecto.',
    );
  initializeApp();
  const authUser = await getAuth().getUser(uid);
  if (!authUser.emailVerified) throw new Error('El correo debe estar verificado.');
  const db = getFirestore();
  await db.runTransaction(async (tx) => {
    const state = await tx.get(db.doc('system/state'));
    if (!state.exists) tx.create(db.doc('system/state'), emptyState());
    tx.set(db.doc(`users/${uid}`), {
      uid,
      nombre,
      email: authUser.email || '',
      role,
      createdAt: new Date().toISOString(),
    });
  });
  console.log('Perfil guardado. El inventario existente se conserva.');
}
main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
