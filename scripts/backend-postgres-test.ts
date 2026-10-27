import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { seed, demoProfile, emptyState } from '../src/data/seed';
import {
  bootstrapShared,
  createCommand as makeCommand,
  prepareCommit,
  type SharedSnapshot,
  type SharedRemote,
} from '../src/shared/protocol';
import { commitOnServer, type ServerStore } from '../src/shared/server';
import { SharedRepository } from '../src/shared/repository';
import { SqliteStorage } from '../src/data/sqliteStorage';
import { sqliteDb } from '../tests/helpers/sqlite';
const container = process.env.CHEMA_PG_TEST_CONTAINER || 'chema-pg-test';
const database = 'chema_test_' + Date.now();
execFileSync(
  'docker',
  [
    '--host=unix:///var/run/docker.sock',
    'exec',
    '-i',
    container,
    'psql',
    '-X',
    '-v',
    'ON_ERROR_STOP=1',
    '-qAt',
    '-U',
    'postgres',
  ],
  { input: `create database ${database};`, stdio: ['pipe', 'pipe', 'pipe'] },
);
const sql = (query: string, role?: string) =>
  execFileSync(
    'docker',
    [
      '--host=unix:///var/run/docker.sock',
      'exec',
      '-i',
      container,
      'psql',
      '-X',
      '-v',
      'ON_ERROR_STOP=1',
      '-qAt',
      '-U',
      'postgres',
      '-d',
      database,
    ],
    {
      input: (role ? `set role ${role};\n` : '') + query,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
    },
  ).trim();
const lit = (value: unknown): string =>
  value === null
    ? 'null'
    : typeof value === 'number'
      ? String(value)
      : typeof value === 'string'
        ? "'" + value.replaceAll("'", "''") + "'"
        : Array.isArray(value) && value.every((x) => typeof x === 'string')
          ? 'array[' + value.map(lit).join(',') + ']::text[]'
          : `convert_from(decode('${Buffer.from(JSON.stringify(value)).toString('base64')}','base64'),'utf8')::jsonb`;
const rpc = async (name: string, args: Record<string, unknown>) => {
  const text = sql(
    `select to_jsonb(public.${name}(${Object.entries(args)
      .map(([k, v]) => `${k} => ${lit(v)}`)
      .join(',')}));`,
    'service_role',
  );
  return text ? JSON.parse(text) : null;
};
const store: ServerStore = {
  rpc,
  snapshot: (space, user) => rpc('chema_snapshot', { p_space: space, p_user: user }),
  receipt: (space, user, id) =>
    rpc('chema_receipt', { p_space: space, p_user: user, p_operation: id }),
  commit: (space, user, base, command, result, fulfilled) =>
    rpc('chema_commit', {
      p_space: space,
      p_user: user,
      p_base: base.cursor,
      p_epoch: base.epoch,
      p_command: command,
      p_result: result,
      p_fulfilled: fulfilled,
    }),
};
const uid = '11111111-1111-4111-8111-111111111111',
  uid2 = '22222222-2222-4222-8222-222222222222',
  outsider = '33333333-3333-4333-8333-333333333333';
const createCommand = (
  base: SharedSnapshot,
  action: import('../src/types').Action,
  id: string,
  expectedUserId = uid,
) => makeCommand(base, action, id, expectedUserId);
const now = new Date('2026-10-27T12:00:00Z');
process.once('exit', () => {
  // This database was uniquely created above for this test; never target a commercial database.
  if (/^chema_test_\d+$/.test(database)) {
    try {
      execFileSync(
        'docker',
        [
          '--host=unix:///var/run/docker.sock',
          'exec',
          '-i',
          container,
          'psql',
          '-X',
          '-U',
          'postgres',
        ],
        { input: `drop database if exists ${database};`, stdio: 'ignore' },
      );
    } catch {
      /* failure is limited to a disposable local test database */
    }
  }
});
let passed = 0;
async function test(name: string, fn: () => Promise<void>) {
  await fn();
  console.log('PASS ' + name);
  passed++;
}
sql(`create schema if not exists auth; create table if not exists auth.users(id uuid primary key); create or replace function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
 do $$begin if not exists(select 1 from pg_roles where rolname='anon')then create role anon nologin; end if; if not exists(select 1 from pg_roles where rolname='authenticated')then create role authenticated nologin; end if; if not exists(select 1 from pg_roles where rolname='service_role')then create role service_role nologin bypassrls; end if; end$$;
 grant usage on schema auth to authenticated; insert into auth.users values('${uid}'),('${uid2}'),('${outsider}') on conflict do nothing;`);
sql(readFileSync('supabase/migrations/20261027015319_chema_shared.sql', 'utf8'));
sql(readFileSync('supabase/migrations/20261027020847_chema_shared_bootstrap_media.sql', 'utf8'));
async function createSpace(id: string, snapshot: SharedSnapshot) {
  sql(
    `insert into public.chema_spaces(id,nombre,epoch,snapshot) values(${lit(id)},'Sintético',${lit(snapshot.epoch)},${lit(snapshot)});insert into public.chema_members(space_id,user_id,nombre,role) values(${lit(id)},'${uid}','Prueba 1','ADMIN'),(${lit(id)},'${uid2}','Prueba 2','ADMIN');`,
  );
}
const user = { id: uid, email: 'synthetic@example.invalid' },
  user2 = { id: uid2, email: 'other@example.invalid' };
await test('misma devolución con UUID distintos aplica una sola vez y conserva evento', async () => {
  const base = bootstrapShared('return_test', seed(now), 'epoch_return');
  await createSpace(base.spaceId, base);
  const a = createCommand(
      base,
      { type: 'RETIRE', obraId: 'obra_1', responsables: ['Fabián'], incidents: [] },
      'withdraw_a',
    ),
    b = createCommand(base, a.action, 'withdraw_b', uid2);
  const results = await Promise.all([
    commitOnServer(store, user, a),
    commitOnServer(store, user2, b),
  ]);
  assert.equal(results.filter((r) => r.kind === 'CONFIRMED').length, 1);
  assert.equal(results.filter((r) => r.kind === 'CONFLICT').length, 1);
  assert.equal(sql("select count(*) from public.chema_changes where space_id='return_test'"), '1');
  assert.equal(
    sql("select count(*) from public.chema_task_fulfillments where space_id='return_test'"),
    '1',
  );
});
await test('el servidor rechaza una cola de A presentada con la identidad de B', async () => {
  const base = await store.snapshot('return_test', uid);
  const command = createCommand(
    base,
    { type: 'RESPONSABLES', nombres: ['No reasignar'] },
    'wrong_user',
    uid,
  );
  await assert.rejects(() => commitOnServer(store, user2, command), /SESSION_CHANGED/);
  assert.equal(
    sql("select count(*) from public.chema_receipts where operation_id='wrong_user'"),
    '0',
  );
});
await test('última unidad sólo confirma una entrega entre dos clientes', async () => {
  const s = seed(now),
    pending = s.obras.find((o) => o.estadoProceso === 'PENDIENTE_ENTREGA')!,
    m = {
      ...s.materiales[0]!,
      cantidadGalpon: 1,
      cantidadEnObra: 0,
      cantidadEnTaller: 0,
      cantidadPerdido: 0,
    };
  const state = {
    ...emptyState(),
    responsables: ['Fabián'],
    materiales: [m],
    obras: ['rental_a', 'rental_b'].map((id) => ({
      ...pending,
      id,
      materialesCargados: [{ materialId: m.id, nombre: m.nombre, medida: m.medida, cantidad: 1 }],
      saldosEnObra: {},
      fechaRetiroEstimada: '2026-11-10',
    })),
  };
  const base = bootstrapShared('last_test', state, 'epoch_last');
  await createSpace(base.spaceId, base);
  const results = await Promise.all(
    ['rental_a', 'rental_b'].map((obraId, i) =>
      commitOnServer(
        store,
        i ? user2 : user,
        createCommand(
          base,
          { type: 'DELIVER', obraId, responsables: ['Fabián'] },
          `deliver_${i}`,
          i ? uid2 : uid,
        ),
      ),
    ),
  );
  assert.equal(results.filter((r) => r.kind === 'CONFIRMED').length, 1);
  const final = await store.snapshot(base.spaceId, uid);
  assert.equal(final.state.materiales[0]?.cantidadGalpon, 0);
  assert.equal(final.state.materiales[0]?.cantidadEnObra, 1);
});
await test('cambiar ADMIN a OPERADOR entre preparar y commit rechaza ajuste', async () => {
  const initial = bootstrapShared('role_test', seed(now), 'epoch_role');
  await createSpace(initial.spaceId, initial);
  const base = await store.snapshot(initial.spaceId, uid);
  const command = createCommand(
    base,
    {
      type: 'ADJUST',
      materialId: 'marco130',
      bucket: 'cantidadGalpon',
      delta: 1,
      motivo: 'Prueba',
      procedencia: 'Compra',
    },
    'role_change',
  );
  const result = prepareCommit(base, command, { ...demoProfile('ADMIN'), uid }, now);
  if (result.kind !== 'CONFIRMED') throw new Error(result.message);
  sql(
    `update public.chema_members set role='OPERADOR' where space_id='role_test' and user_id='${uid}';`,
  );
  await assert.rejects(
    () => store.commit(initial.spaceId, uid, base, command, result, []),
    /PERMISSION_CHANGED/,
  );
  assert.equal(sql("select count(*) from public.chema_changes where space_id='role_test'"), '0');
});
await test('timeout tras commit, cierre SQLite y reintento consultan recibo sin duplicar', async () => {
  const base = bootstrapShared('timeout_test', seed(now), 'epoch_timeout');
  await createSpace(base.spaceId, base);
  let cut = true;
  const remote: SharedRemote = {
    snapshot: () => store.snapshot(base.spaceId, uid),
    receipt: (id) => store.receipt(base.spaceId, uid, id),
    pull: async () => ({ changes: [], watermark: 0, epoch: base.epoch }),
    commit: async (command) => {
      const result = await commitOnServer(store, user, command);
      if (cut) {
        cut = false;
        throw new Error('Respuesta perdida');
      }
      return result;
    },
  };
  const storage = new SqliteStorage(sqliteDb()),
    actor = { ...demoProfile('ADMIN'), uid };
  const first = new SharedRepository(storage, base.spaceId, actor, base, remote);
  await first.init();
  await first.dispatch(
    { type: 'RETIRE', obraId: 'obra_1', responsables: ['Fabián'], incidents: [] },
    'timeout_one',
  );
  await first.sync();
  assert.equal(first.current().outbox[0]?.status, 'ERROR');
  const reopened = new SharedRepository(storage, base.spaceId, actor, base, remote);
  await reopened.init();
  await reopened.sync();
  assert.equal(reopened.current().outbox.length, 0);
  assert.equal(sql("select count(*) from public.chema_changes where space_id='timeout_test'"), '1');
});
await test('deshacer crea nueva tarea y permite otro retiro legítimo', async () => {
  const base = await store.snapshot('return_test', uid);
  const undo = await commitOnServer(
    store,
    user,
    createCommand(base, { type: 'UNDO', logId: 'withdraw_a' }, 'undo_a'),
  );
  assert.equal(undo.kind, 'CONFIRMED');
  const fresh = await store.snapshot('return_test', uid),
    command = createCommand(
      fresh,
      { type: 'RETIRE', obraId: 'obra_1', responsables: ['Fabián'], incidents: [] },
      'withdraw_again',
    );
  const result = await commitOnServer(store, user, command);
  assert.equal(result.kind, 'CONFIRMED');
  assert.equal(
    sql("select count(*) from public.chema_task_fulfillments where space_id='return_test'"),
    '2',
  );
});
await test('mismo operationId con contenido cambiado rechaza sin modificar stock', async () => {
  const base = await store.snapshot('return_test', uid),
    command = createCommand(base, { type: 'RESPONSABLES', nombres: ['Flete'] }, 'withdraw_a');
  await assert.rejects(() => commitOnServer(store, user, command), /OPERATION_ID_REUSED/);
});
await test('cliente público no ejecuta RPC ni escribe tabla; ajeno y revocado no leen', async () => {
  assert.throws(
    () => sql(`select public.chema_snapshot('return_test','${uid}');`, 'authenticated'),
    /permission denied/,
  );
  assert.throws(
    () =>
      sql("update public.chema_spaces set revision=999 where id='return_test';", 'authenticated'),
    /permission denied/,
  );
  await assert.rejects(() => store.snapshot('return_test', outsider), /MEMBERSHIP_REQUIRED/);
  sql(
    `update public.chema_members set active=false where space_id='return_test' and user_id='${uid2}';`,
  );
  await assert.rejects(() => store.snapshot('return_test', uid2), /MEMBERSHIP_REQUIRED/);
});
await test('historial paginado sin snapshots inversos y cursor secuencial', async () => {
  const result = (await rpc('chema_pull', {
    p_space: 'return_test',
    p_user: uid,
    p_cursor: 0,
    p_limit: 2,
  })) as { events: { sequence: number; event: Record<string, unknown> }[]; watermark: number };
  assert.deepEqual(
    result.events.map((e) => e.sequence),
    [1, 2],
  );
  assert.equal(result.watermark, 3);
  assert(result.events.every((e) => !('payloadInverso' in e.event)));
});
await test('bootstrap de copia común se aplica una vez, segundo celular sólo se incorpora', async () => {
  const initial = bootstrapShared('bootstrap_test', emptyState(), 'epoch_bootstrap');
  await createSpace(initial.spaceId, initial);
  const source = bootstrapShared(initial.spaceId, seed(now), initial.epoch);
  await rpc('chema_bootstrap', {
    p_space: initial.spaceId,
    p_user: uid,
    p_snapshot: source,
    p_fingerprint: 'same-source-hash',
  });
  const twice = (await rpc('chema_bootstrap', {
    p_space: initial.spaceId,
    p_user: uid,
    p_snapshot: source,
    p_fingerprint: 'same-source-hash',
  })) as SharedSnapshot;
  assert.equal(
    twice.state.materiales[0]?.cantidadGalpon,
    source.state.materiales[0]?.cantidadGalpon,
  );
  await assert.rejects(
    () =>
      rpc('chema_bootstrap', {
        p_space: initial.spaceId,
        p_user: uid,
        p_snapshot: source,
        p_fingerprint: 'different-copy',
      }),
    /BOOTSTRAP_NOT_EMPTY/,
  );
  const second = await store.snapshot(initial.spaceId, uid2);
  assert.equal(
    second.state.materiales[0]?.cantidadGalpon,
    source.state.materiales[0]?.cantidadGalpon,
  );
});
await test('invitación de un uso conserva rol y no habilita otra identidad', async () => {
  sql(
    `insert into public.chema_invitations(token_hash,space_id,role,expires_at) values('synthetic_invitation','bootstrap_test','OPERADOR',now()+interval '1 hour');`,
  );
  const args = {
    p_hash: 'synthetic_invitation',
    p_user: outsider,
    p_name: 'Invitado sintético',
    p_snapshot: null,
    p_fingerprint: null,
  };
  const space = await rpc('chema_join', args);
  assert.equal(space, 'bootstrap_test');
  assert.equal(await rpc('chema_join', args), 'bootstrap_test');
  await assert.rejects(() => rpc('chema_join', { ...args, p_user: uid2 }), /INVITATION_USED/);
  const snapshot = await store.snapshot('bootstrap_test', outsider);
  assert.equal(snapshot.member?.role, 'OPERADOR');
});
console.log(
  JSON.stringify({
    passed,
    failed: 0,
    environment: 'PostgreSQL17 real Docker + SQLite real Node; auth.users fixture, no GoTrue login',
    container,
  }),
);
