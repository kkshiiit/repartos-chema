import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { emptyState } from '../../src/data/seed';
async function main() {
  const uid = process.argv[2],
    role = process.argv[3] || 'ADMIN',
    nombre = process.argv[4];
  const teamOwner = process.argv[5] === '--team-owner';
  if (!uid || !nombre || !['ADMIN', 'OPERADOR'].includes(role))
    throw new Error(
      'Uso: npm run bootstrap -- UID ADMIN|OPERADOR "Nombre verificado". Usa credenciales administrativas de tu proyecto.',
    );
  initializeApp();
  const authUser = await getAuth().getUser(uid);
  if (!authUser.emailVerified && !teamOwner) throw new Error('El correo debe estar verificado.');
  const db = getFirestore();
  await db.runTransaction(async (tx) => {
    const [state, prior, team] = await Promise.all([
      tx.get(db.doc('system/state')),
      tx.get(db.doc(`users/${uid}`)),
      tx.get(db.doc('system/team')),
    ]);
    if (!state.exists) tx.create(db.doc('system/state'), emptyState());
    if (teamOwner && role !== 'ADMIN')
      throw new Error('El responsable inicial debe gestionar el equipo.');
    if (teamOwner && team.exists && team.get('ownerUid') !== uid)
      throw new Error('El equipo ya tiene responsable. No se reemplazó.');
    const owner = !team.exists && role === 'ADMIN';
    if (owner)
      tx.create(db.doc('system/team'), { ownerUid: uid, createdAt: new Date().toISOString() });
    tx.set(db.doc(`users/${uid}`), {
      uid,
      nombre,
      email: authUser.email || '',
      role,
      active: true,
      teamAccess: true,
      teamOwner: owner || team.get('ownerUid') === uid,
      createdAt: prior.get('createdAt') || new Date().toISOString(),
    });
  });
  console.log('Perfil guardado. El inventario existente se conserva.');
}
main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
