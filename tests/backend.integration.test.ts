// Ejecuta el handler callable con contexto Auth controlado y Firestore Emulator real.
// No acredita transporte HTTP, emisión de tokens ni FCM productivo.
import { beforeEach, expect, it } from 'vitest';
import { createRequire } from 'node:module';
import { seed, demoProfile } from '../src/data/seed';
const require = createRequire(new URL('../functions/package.json', import.meta.url));
const { applyMovement, exportDocument } = require('./lib/functions/src/index.js');
const { getFirestore } = require('firebase-admin/firestore');
if (process.env.GCLOUD_PROJECT !== 'demo-repartos-chema' || !process.env.FIRESTORE_EMULATOR_HOST)
  throw new Error('Estas pruebas exigen el proyecto demo y Firestore Emulator.');
const db = getFirestore();
let prefix = '';
const request = (id: string, action: unknown, uid = 'demo_admin', verified = true) => ({
  data: { id: `${prefix}_${id}`, action },
  auth: { uid, token: { email_verified: verified } },
});
beforeEach(async () => {
  prefix = `test_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  await db.doc('system/state').set(seed());
  await db.doc('users/demo_admin').set(demoProfile('ADMIN'));
  await db.doc('users/demo_operador').set(demoProfile('OPERADOR'));
});
it('backend rechaza sesión ausente, correo no verificado y operación ADMIN desde operador', async () => {
  await expect(applyMovement.run({ data: {} })).rejects.toMatchObject({ code: 'unauthenticated' });
  await expect(
    applyMovement.run(request('a', { type: 'REENTER', obraId: 'obra_1' }, 'demo_admin', false)),
  ).rejects.toMatchObject({ code: 'unauthenticated' });
  await expect(
    applyMovement.run(request('b', { type: 'DELETE_OBRA', obraId: 'obra_5' }, 'demo_operador')),
  ).rejects.toMatchObject({ code: 'failed-precondition' });
  await expect(
    exportDocument.run({
      auth: { uid: 'demo_operador', token: { email_verified: true } },
      data: { kind: 'excel' },
    }),
  ).rejects.toMatchObject({ code: 'permission-denied' });
});
it('dos entregas concurrentes dejan un solo movimiento y un solo recibo válido', async () => {
  const action = { type: 'DELIVER', obraId: 'obra_5', responsables: ['Fabián'] };
  const results = await Promise.allSettled([
    applyMovement.run(request('one', action)),
    applyMovement.run(request('two', action)),
  ]);
  expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
  const state = (await db.doc('system/state').get()).data();
  expect(state.revision).toBe(1);
  expect(state.obras.find((o: { id: string }) => o.id === 'obra_5').estadoProceso).toBe(
    'ENTREGADO',
  );
  for (const m of state.materiales) {
    const original = seed().materiales.find((item) => item.id === m.id)!;
    expect(m.cantidadGalpon + m.cantidadEnObra).toBe(
      original.cantidadGalpon + original.cantidadEnObra,
    );
  }
});
it('respuesta perdida y reintento concurrente del mismo comando no duplican stock ni auditoría', async () => {
  const req = request('same', { type: 'DELIVER', obraId: 'obra_5', responsables: ['Fabián'] });
  await Promise.all([applyMovement.run(req), applyMovement.run(req)]);
  await applyMovement.run(req);
  expect((await db.doc('system/state').get()).get('revision')).toBe(1);
  expect((await db.doc(`audit/${req.data.id}`).get()).exists).toBe(true);
  await expect(
    applyMovement.run({
      ...req,
      data: { ...req.data, action: { type: 'REENTER', obraId: 'obra_5' } },
    }),
  ).rejects.toMatchObject({ code: 'permission-denied' });
});
it('una edición obsoleta es rechazada y no pisa la versión confirmada', async () => {
  const old = seed().obras[4]!;
  const obra = Object.fromEntries(
    [
      'id',
      'clienteNombre',
      'clienteTelefono',
      'direccion',
      'localidadBarrio',
      'fechaEntrega',
      'fechaRetiroEstimada',
    ].map((key) => [key, old[key as keyof typeof old]]),
  );
  await applyMovement.run(
    request('edit1', {
      type: 'UPDATE_OBRA',
      obra: { ...obra, clienteNombre: 'Nombre confirmado' },
      expectedVersion: 0,
    }),
  );
  await expect(
    applyMovement.run(
      request('edit2', {
        type: 'UPDATE_OBRA',
        obra: { ...obra, clienteNombre: 'Nombre obsoleto' },
        expectedVersion: 0,
      }),
    ),
  ).rejects.toMatchObject({ code: 'failed-precondition' });
  const state = (await db.doc('system/state').get()).data();
  expect(state.obras.find((o: { id: string }) => o.id === old.id).clienteNombre).toBe(
    'Nombre confirmado',
  );
});
