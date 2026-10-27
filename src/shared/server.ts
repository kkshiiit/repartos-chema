import type { AppState, UserProfile } from '../types';
import { parseEnvelope } from '../data/validation';
import { emptyLocalState } from '../data/localInitialState';
import {
  bootstrapShared,
  canonical,
  prepareCommit,
  type CommitResult,
  type SharedSnapshot,
  type SyncCommand,
} from './protocol';

export interface ServerStore {
  snapshot(
    spaceId: string,
    userId: string,
  ): Promise<
    SharedSnapshot & { member?: { uid: string; nombre: string; role: 'ADMIN' | 'OPERADOR' } }
  >;
  receipt(spaceId: string, userId: string, operationId: string): Promise<CommitResult | null>;
  commit(
    spaceId: string,
    userId: string,
    base: SharedSnapshot,
    command: SyncCommand,
    result: CommitResult,
    fulfilled: string[],
  ): Promise<CommitResult>;
  rpc(name: string, args: Record<string, unknown>): Promise<unknown>;
}
export async function commitOnServer(
  store: ServerStore,
  user: { id: string; email?: string },
  command: SyncCommand,
): Promise<CommitResult> {
  if (command.expectedUserId !== user.id) throw new Error('SESSION_CHANGED');
  const old = await store.receipt(command.spaceId, user.id, command.operationId);
  if (old) {
    // Store must verify the original payload before returning an idempotent receipt.
    return (await store.rpc('chema_verify_receipt', {
      p_space: command.spaceId,
      p_user: user.id,
      p_command: command,
    })) as CommitResult;
  }
  for (let attempt = 0; attempt < 3; attempt++) {
    const base = await store.snapshot(command.spaceId, user.id);
    if (!base.member || base.member.uid !== user.id) throw new Error('MEMBERSHIP_REQUIRED');
    const actor: UserProfile = {
      uid: user.id,
      nombre: base.member.nombre,
      email: user.email || '',
      role: base.member.role,
      createdAt: new Date().toISOString(),
    };
    const result = prepareCommit(base, command, actor);
    if (result.kind === 'CONFLICT') return { ...result, snapshot: base };
    const fulfilled = Object.entries(base.tasks)
      .filter(([id, task]) => result.snapshot.tasks[id]?.id !== task.id)
      .map(([, task]) => task.id);
    // Ledger contains every historical event; only the most recent inverse belongs in the aggregate.
    result.snapshot.state.logs = result.snapshot.state.logs.slice(0, 1);
    result.snapshot.state.appliedIds = [command.operationId];
    result.snapshot.state.obras.forEach((obra) => {
      obra.syncStatus = 'SYNCED';
    });
    try {
      return await store.commit(command.spaceId, user.id, base, command, result, fulfilled);
    } catch (error) {
      if (attempt < 2 && String(error).includes('REVISION_CHANGED')) continue;
      throw error;
    }
  }
  throw new Error('No se pudo confirmar el cambio. Tu propuesta sigue pendiente.');
}
export interface ServerConfig {
  url: string;
  serviceKey: string;
  publicKey: string;
}
export function createRestStore(config: ServerConfig): ServerStore {
  const rpc = async (name: string, args: Record<string, unknown>) => {
    const response = await fetch(`${config.url}/rest/v1/rpc/${name}`, {
      method: 'POST',
      headers: {
        apikey: config.serviceKey,
        Authorization: `Bearer ${config.serviceKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(args),
    });
    const data = await response.json();
    if (!response.ok)
      throw new Error(typeof data.message === 'string' ? data.message : 'SERVER_ERROR');
    return data;
  };
  return {
    rpc,
    snapshot: (spaceId, userId) => rpc('chema_snapshot', { p_space: spaceId, p_user: userId }),
    receipt: (spaceId, userId, operationId) =>
      rpc('chema_receipt', { p_space: spaceId, p_user: userId, p_operation: operationId }),
    commit: (spaceId, userId, base, command, result, fulfilled) =>
      rpc('chema_commit', {
        p_space: spaceId,
        p_user: userId,
        p_base: base.cursor,
        p_epoch: base.epoch,
        p_command: command,
        p_result: result,
        p_fulfilled: fulfilled,
      }),
  };
}
const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type',
  'Content-Type': 'application/json',
  'Cache-Control': 'no-store',
};
export function createSharedHandler(config: ServerConfig) {
  const store = createRestStore(config);
  return async (req: Request): Promise<Response> => {
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    const reply = (data: unknown, status = 200) =>
      new Response(JSON.stringify(data), { status, headers: cors });
    if (req.method !== 'POST') return reply({ error: 'Método no permitido.' }, 405);
    try {
      const text = await req.text();
      if (text.length > 2 * 1024 * 1024)
        return reply({ error: 'La operación supera el límite permitido.' }, 413);
      const body = JSON.parse(text) as Record<string, unknown>;
      if (body.type === 'enroll') {
        const token = typeof body.token === 'string' ? body.token : '';
        const email = typeof body.email === 'string' ? body.email.trim() : '';
        const password = typeof body.password === 'string' ? body.password : '';
        const nombre = typeof body.nombre === 'string' ? body.nombre.trim() : '';
        if (
          !/^[a-f0-9]{64}$/.test(token) ||
          !email.includes('@') ||
          email.length > 254 ||
          password.length < 12 ||
          password.length > 128 ||
          !nombre ||
          nombre.length > 80
        )
          return reply(
            {
              error: 'Completá invitación, nombre, correo y una contraseña de 12 a 128 caracteres.',
            },
            400,
          );
        const hash = Array.from(
          new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token))),
        )
          .map((n) => n.toString(16).padStart(2, '0'))
          .join('');
        await store.rpc('chema_enrollment_check', { p_hash: hash });
        // Private invitation is the authorization to provision; this does NOT attest ownership of email.
        // The UI must identify this as an administratively provisioned account, not email verification.
        const created = await fetch(`${config.url}/auth/v1/admin/users`, {
          method: 'POST',
          headers: {
            apikey: config.serviceKey,
            Authorization: `Bearer ${config.serviceKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password, email_confirm: true }),
        });
        const createdValue = (await created.json()) as { id?: string };
        // Existing account also requires its password: invitation possession cannot reset another user.
        const signed = await fetch(`${config.url}/auth/v1/token?grant_type=password`, {
          method: 'POST',
          headers: { apikey: config.publicKey, 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        const session = (await signed.json()) as { user?: { id?: string } };
        if (!signed.ok || !session.user?.id)
          return reply(
            { error: 'No pudimos aprovisionar la cuenta. Revisá los datos con el responsable.' },
            400,
          );
        if (created.ok && createdValue.id !== session.user.id)
          return reply({ error: 'La cuenta requiere revisión del responsable.' }, 400);
        const initial = emptyLocalState();
        // Auth and membership form a retryable saga. An interrupted Auth-only account has zero RLS access.
        const spaceId = await store.rpc('chema_join', {
          p_hash: hash,
          p_user: session.user.id,
          p_name: nombre,
          p_snapshot: bootstrapShared('pending', initial, 'pending'),
          p_fingerprint: null,
        });
        return reply({
          session,
          spaceId,
          identityMethod: 'PRIVATE_INVITATION_NOT_EMAIL_VERIFICATION',
        });
      }
      const auth = req.headers.get('authorization');
      if (!auth?.startsWith('Bearer '))
        return reply({ error: 'Iniciá sesión para usar el equipo.' }, 401);
      // Auth validates the user/token; membership is rechecked in the database transaction.
      const authResponse = await fetch(`${config.url}/auth/v1/user`, {
        headers: { apikey: config.publicKey, Authorization: auth },
      });
      if (!authResponse.ok)
        return reply({ error: 'La sesión venció. Conservamos los cambios pendientes.' }, 401);
      const user = (await authResponse.json()) as { id: string; email?: string };
      if (typeof user.id !== 'string') return reply({ error: 'Sesión inválida.' }, 401);
      const spaceId = typeof body.spaceId === 'string' ? body.spaceId : '';
      switch (body.type) {
        case 'spaces':
          return reply(await store.rpc('chema_spaces_for_user', { p_user: user.id }));
        case 'members':
          return reply(
            await store.rpc('chema_members_for_space', { p_space: spaceId, p_user: user.id }),
          );
        case 'get-route':
          return reply(await store.rpc('chema_get_route', { p_space: spaceId, p_user: user.id }));
        case 'bootstrap': {
          const imported = parseEnvelope(
            JSON.stringify({ schema: 1, confirmed: body.state, state: body.state, queue: [] }),
            { allowLegacyRetirementDate: true },
          ).state;
          const current = await store.snapshot(spaceId, user.id);
          imported.logs.forEach((log) => {
            delete log.payloadInverso;
          });
          const prepared = bootstrapShared(spaceId, imported, current.epoch);
          // Physical photo paths never leave the device: the logical ID is portable, uploads are independent.
          prepared.state.obras.forEach((obra) => {
            obra.fotos?.forEach((photo) => {
              photo.uri = 'chema-photo:' + photo.id;
              photo.status = 'PENDING';
              delete photo.storagePath;
            });
            obra.fotosUrls = obra.fotos?.map((photo) => photo.uri) || [];
          });
          const fingerprint = Array.from(
            new Uint8Array(
              await crypto.subtle.digest('SHA-256', new TextEncoder().encode(canonical(imported))),
            ),
          )
            .map((n) => n.toString(16).padStart(2, '0'))
            .join('');
          return reply(
            await store.rpc('chema_bootstrap', {
              p_space: spaceId,
              p_user: user.id,
              p_snapshot: prepared,
              p_fingerprint: fingerprint,
            }),
          );
        }
        case 'snapshot':
          return reply(await store.snapshot(spaceId, user.id));
        case 'commit':
          return reply(await commitOnServer(store, user, body.command as SyncCommand));
        case 'receipt':
          return reply(await store.receipt(spaceId, user.id, String(body.operationId)));
        case 'pull':
          return reply(
            await store.rpc('chema_pull', {
              p_space: spaceId,
              p_user: user.id,
              p_cursor: Number(body.cursor) || 0,
              p_limit: 100,
            }),
          );
        case 'history':
          return reply(
            await store.rpc('chema_history', {
              p_space: spaceId,
              p_user: user.id,
              p_before: Number(body.before) || Number.MAX_SAFE_INTEGER,
              p_limit: 100,
            }),
          );
        case 'join': {
          if (typeof body.token !== 'string' || body.token.length < 32)
            return reply({ error: 'Invitación inválida.' }, 400);
          const hash = Array.from(
            new Uint8Array(
              await crypto.subtle.digest('SHA-256', new TextEncoder().encode(body.token)),
            ),
          )
            .map((n) => n.toString(16).padStart(2, '0'))
            .join('');
          // Initial account never uploads an automatic local copy. Explicit reviewed bootstrap is separate.
          const initial: AppState = emptyLocalState();
          const snapshot = bootstrapShared('pending', initial, 'pending');
          return reply({
            spaceId: await store.rpc('chema_join', {
              p_hash: hash,
              p_user: user.id,
              p_name: String(body.nombre || ''),
              p_snapshot: snapshot,
              p_fingerprint: null,
            }),
          });
        }
        case 'invite': {
          const token = Array.from(crypto.getRandomValues(new Uint8Array(32)))
            .map((n) => n.toString(16).padStart(2, '0'))
            .join('');
          const hash = Array.from(
            new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token))),
          )
            .map((n) => n.toString(16).padStart(2, '0'))
            .join('');
          await store.rpc('chema_invite', { p_space: spaceId, p_user: user.id, p_hash: hash });
          return reply({ token, expiresInHours: 48 });
        }
        case 'revoke':
          return reply(
            await store.rpc('chema_revoke', {
              p_space: spaceId,
              p_user: user.id,
              p_target: String(body.targetId),
            }),
          );
        case 'route':
          return reply(
            await store.rpc('chema_publish_route', {
              p_space: spaceId,
              p_user: user.id,
              p_expected: Number(body.expected) || 0,
              p_route: body.route,
            }),
          );
        default:
          return reply({ error: 'Operación desconocida.' }, 400);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      const denied = /MEMBERSHIP|INVITATION|PERMISSION|SESSION/.test(message);
      const conflict = /REVISION|EPOCH|OPERATION_ID|ROUTE_CHANGED/.test(message);
      return reply(
        {
          error: denied
            ? 'No tenés acceso a este equipo. Tus cambios locales se conservan.'
            : conflict
              ? 'Hay cambios posteriores. Revisá la operación sin borrar tu propuesta.'
              : 'No se pudo completar la solicitud. Conservamos tus datos.',
          code: denied ? 'ACCESS_DENIED' : conflict ? 'CONFLICT' : 'REQUEST_FAILED',
        },
        denied ? 403 : conflict ? 409 : 400,
      );
    }
  };
}
