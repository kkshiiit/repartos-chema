/** Remote integration against the authorized Free project, exclusively disposable synthetic identities. */
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { SharedAuth, SharedSessionVault } from '../src/shared/auth';
import { createSharedClient } from '../src/shared/client';
import { createCommand } from '../src/shared/protocol';
import { emptyState } from '../src/data/seed';
import { SHARED_CONFIG } from '../src/services/sharedConfig';
import type { ObraCard } from '../src/types';
const privateFile = process.env.CHEMA_REMOTE_QA_FILE || '/tmp/chema-remote-qa-private.json';
const secret = JSON.parse(readFileSync(privateFile, 'utf8'));
if (
  !/^chema-qa-[a-f0-9]+@example\.invalid$/.test(secret.email) ||
  !/^chema-qa2-[a-f0-9]+@example\.invalid$/.test(secret.email2) ||
  secret.completed
)
  throw new Error(
    'Sólo se permiten identidades sintéticas nuevas; limpiar y revisar la prueba anterior.',
  );
const persist = () => writeFileSync(privateFile, JSON.stringify(secret), { mode: 0o600 });
const makeAuth = () => {
  const values = new Map<string, string>();
  return new SharedAuth(
    SHARED_CONFIG,
    new SharedSessionVault({
      getItem: async (k) => values.get(k) ?? null,
      setItem: async (k, v) => {
        values.set(k, v);
      },
      removeItem: async (k) => {
        values.delete(k);
      },
    }),
  );
};
let passed = 0;
const run = async (name: string, test: () => Promise<void>) => {
  await test();
  passed++;
  console.log('PASS ' + name);
};
const safeCommit = async (
  remote: ReturnType<typeof createSharedClient>,
  command: ReturnType<typeof createCommand>,
) => {
  try {
    return await remote.commit(command);
  } catch (error) {
    if (!(error instanceof Error) || !('code' in error) || error.code !== 'UNCERTAIN') throw error;
    console.log('RECOVERY respuesta incierta: consultar recibo antes de reintentar');
    const receipt = await remote.receipt(command.operationId);
    if (receipt) return receipt;
    return remote.commit(command); // Same ID/payload; bounded to one retry, never duplicate movement.
  }
};
const a = makeAuth(),
  b = makeAuth();
const owner = await a.enroll(
  secret.invite,
  'Persona QA responsable',
  secret.email,
  secret.password,
);
secret.spaceId = owner.spaceId;
secret.userId = owner.session.userId;
persist();
const remoteA = createSharedClient(
  { ...SHARED_CONFIG, spaceId: owner.spaceId, expectedUserId: secret.userId },
  (uid) => a.accessToken(uid),
);
await run('Auth real aprovisiona por invitación privada y verifica membresía ADMIN', async () => {
  assert.equal((await remoteA.snapshot()).member?.role, 'ADMIN');
});
const invite = await remoteA.request<{ token: string }>('invite');
const second = await b.enroll(invite.token, 'Persona QA operativa', secret.email2, secret.password);
secret.userId2 = second.session.userId;
persist();
assert.equal(second.spaceId, owner.spaceId);
const remoteB = createSharedClient(
  { ...SHARED_CONFIG, spaceId: owner.spaceId, expectedUserId: secret.userId2 },
  (uid) => b.accessToken(uid),
);
await run('segunda identidad real se incorpora como OPERADOR, sin elevar su rol', async () => {
  assert.equal((await remoteB.snapshot()).member?.role, 'OPERADOR');
});
const today = new Intl.DateTimeFormat('sv-SE', {
  timeZone: 'America/Argentina/Buenos_Aires',
}).format(new Date());
const material = {
  id: 'material_qa',
  nombre: 'Pieza sintética QA',
  categoria: 'ANDAMIOS' as const,
  medida: '1.30 m',
  cantidadGalpon: 0,
  cantidadEnObra: 1,
  cantidadEnTaller: 0,
  cantidadPerdido: 0,
};
const rental = (id: string, delivered = false): ObraCard => ({
  id,
  clienteNombre: `Cliente sintético ${id}`,
  clienteTelefono: '',
  direccion: 'Dirección sintética QA',
  localidadBarrio: 'Zona sintética',
  estadoSemaphoro: 'VERDE',
  materialesCargados: [
    { materialId: material.id, nombre: material.nombre, medida: material.medida, cantidad: 1 },
  ],
  fechaEntrega: today,
  fechaRetiroEstimada: '2032-12-31',
  estadoProceso: delivered ? 'ENTREGADO' : 'PENDIENTE_ENTREGA',
  syncStatus: 'PENDING',
  saldosEnObra: delivered ? { material_qa: 1 } : {},
  updatedAt: new Date().toISOString(),
});
await run('bootstrap real una sola vez y dos clientes reciben el mismo inventario', async () => {
  const state = {
    ...emptyState(),
    responsables: ['Responsable sintético'],
    materiales: [material],
    obras: [rental('qa_a', true), rental('qa_b'), rental('qa_c')],
  };
  await remoteA.request('bootstrap', { state });
  assert.equal((await remoteB.snapshot()).state.materiales[0]?.cantidadEnObra, 1);
  await remoteA.request('bootstrap', { state });
  assert.equal((await remoteB.snapshot()).state.materiales[0]?.cantidadEnObra, 1);
});
await run('la misma devolución desde dos JWT/UUID distintos sólo mueve una unidad', async () => {
  const [sa, sb] = await Promise.all([remoteA.snapshot(), remoteB.snapshot()]);
  const action = {
    type: 'RETIRE' as const,
    obraId: 'qa_a',
    responsables: ['Responsable sintético'],
    incidents: [],
  };
  const result = await Promise.all([
    safeCommit(remoteA, createCommand(sa, action, 'qa_retire_a', secret.userId)),
    safeCommit(remoteB, createCommand(sb, action, 'qa_retire_b', secret.userId2)),
  ]);
  assert.equal(result.filter((r) => r.kind === 'CONFIRMED').length, 1);
  assert.equal((await remoteA.snapshot()).state.materiales[0]?.cantidadGalpon, 1);
});
await run('la última unidad no se confirma para dos entregas concurrentes', async () => {
  const [sa, sb] = await Promise.all([remoteA.snapshot(), remoteB.snapshot()]);
  const result = await Promise.all([
    safeCommit(
      remoteA,
      createCommand(
        sa,
        { type: 'DELIVER', obraId: 'qa_b', responsables: ['Responsable sintético'] },
        'qa_deliver_a',
        secret.userId,
      ),
    ),
    safeCommit(
      remoteB,
      createCommand(
        sb,
        { type: 'DELIVER', obraId: 'qa_c', responsables: ['Responsable sintético'] },
        'qa_deliver_b',
        secret.userId2,
      ),
    ),
  ]);
  assert.equal(result.filter((r) => r.kind === 'CONFIRMED').length, 1);
  const state = (await remoteA.snapshot()).state;
  assert.equal(state.materiales[0]?.cantidadGalpon, 0);
  assert.equal(state.materiales[0]?.cantidadEnObra, 1);
});
await run('repetir tras perder el acuse recupera recibo sin duplicar movimiento', async () => {
  const snapshot = await remoteA.snapshot(),
    active = snapshot.state.obras.find((o) => o.estadoProceso === 'ENTREGADO')!;
  const command = createCommand(
    snapshot,
    { type: 'RETIRE', obraId: active.id, responsables: ['Responsable sintético'], incidents: [] },
    'qa_response_lost',
    secret.userId,
  );
  await remoteA.commit(command); // simulate losing this response after the real remote commit
  const cursor = (await remoteA.snapshot()).cursor;
  assert.equal((await remoteA.receipt(command.operationId))?.kind, 'CONFIRMED');
  await remoteA.commit(command);
  const now = await remoteA.snapshot();
  assert.equal(now.cursor, cursor);
  assert.equal(now.state.materiales[0]?.cantidadGalpon, 1);
});
await run('JWT de B no puede atribuirse una cola vinculada a A', async () => {
  const snapshot = await remoteA.snapshot();
  const command = createCommand(
    snapshot,
    { type: 'RESPONSABLES', nombres: ['No aplicar'] },
    'qa_wrong_user',
    secret.userId,
  );
  await assert.rejects(() => remoteB.commit(command));
  assert.equal((await remoteA.snapshot()).cursor, snapshot.cursor);
});
await run('revocar membresía bloquea recepción y envío con el JWT todavía existente', async () => {
  await remoteA.request('revoke', { targetId: secret.userId2 });
  await assert.rejects(
    () => remoteB.snapshot(),
    (e) => e instanceof Error && 'status' in e && e.status === 403,
  );
});
secret.completed = true;
persist();
const report = {
  dateUTC: new Date().toISOString(),
  environment: 'Supabase Free remoto real: Auth/Edge/PostgreSQL, dos JWT reales sintéticos',
  passed,
  failed: 0,
  spaceId: secret.spaceId,
  syntheticUserIds: [secret.userId, secret.userId2],
  responseLoss: 'inyectada después de commit remoto real',
  physicalAndroid: false,
  cleanup: 'PENDIENTE: borrar sólo los datos/usuarios QA conocidos mediante control autorizado',
};
writeFileSync(
  `${process.env.CHEMA_QA_EVIDENCE_DIR || 'docs/evidencias-etapa2'}/backend-remoto-autenticado.json`,
  JSON.stringify(report, null, 2) + '\n',
);
console.log(JSON.stringify({ passed, failed: 0, cleanup: 'pendiente', physicalAndroid: false }));
