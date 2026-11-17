import { SHARED_CONFIG } from '../services/sharedConfig';

export class SyncError extends Error {
  constructor(
    message: string,
    readonly kind: 'offline' | 'not-found' | 'invalid' | 'server',
  ) {
    super(message);
  }
}

const messages: Record<string, string> = {
  EQUIPO_NO_ENCONTRADO: 'No existe un equipo con ese código. Revisalo letra por letra.',
  CODIGO_CORTO: 'El código del equipo es demasiado corto.',
  NOMBRE_VACIO: 'Escribí tu nombre.',
  LOTE_INVALIDO: 'No se pudieron enviar los cambios. Se reintentará.',
  OPERACION_GRANDE: 'El cambio es demasiado grande para enviarlo.',
};

export async function rpc<T>(name: string, body: Record<string, unknown>, timeoutMs = 20000): Promise<T> {
  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timer = setTimeout(() => controller?.abort(), timeoutMs);
  let response: Response;
  try {
    response = await fetch(`${SHARED_CONFIG.url}/rest/v1/rpc/${name}`, {
      method: 'POST',
      headers: {
        apikey: SHARED_CONFIG.publicKey,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(body),
      signal: controller?.signal,
    });
  } catch {
    throw new SyncError('Sin conexión. Los cambios quedan guardados en el teléfono.', 'offline');
  } finally {
    clearTimeout(timer);
  }
  const text = await response.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }
  if (!response.ok) {
    const code = (data as { message?: string } | null)?.message || '';
    if (code === 'EQUIPO_NO_ENCONTRADO') throw new SyncError(messages[code]!, 'not-found');
    if (messages[code]) throw new SyncError(messages[code]!, 'invalid');
    if (response.status === 409 || /duplicate/.test(text))
      throw new SyncError('Ese código ya está en uso. Generá otro.', 'invalid');
    throw new SyncError('El servidor no respondió bien. Se reintentará solo.', 'server');
  }
  return data as T;
}

export interface TeamInfo {
  teamId: string;
  name: string;
  members: Member[];
  lastSeq: number;
}
export interface Member {
  id: string;
  name: string;
  lastSeen?: string | null;
}
export interface RemoteOp {
  seq: number;
  op: unknown;
  serverAt: string;
}

export const api = {
  createTeam: (code: string, name: string) =>
    rpc<TeamInfo>('c2_create_team', { p_code: code, p_name: name }),
  join: (code: string) => rpc<TeamInfo>('c2_join', { p_code: code }),
  addMember: (code: string, name: string) =>
    rpc<Member>('c2_member_add', { p_code: code, p_name: name }),
  removeMember: (code: string, id: string) =>
    rpc<Member[]>('c2_member_remove', { p_code: code, p_member: id }),
  members: (code: string) => rpc<Member[]>('c2_members', { p_code: code }),
  push: (code: string, ops: unknown[]) =>
    rpc<{ opId: string; seq: number }[]>('c2_push', { p_code: code, p_ops: ops }, 45000),
  pull: (code: string, after: number, limit = 300) =>
    rpc<{ ops: RemoteOp[]; lastSeq: number }>('c2_pull', { p_code: code, p_after: after, p_limit: limit }, 45000),
  photoPut: (code: string, id: string, data: string) =>
    rpc<boolean>('c2_photo_put', { p_code: code, p_id: id, p_data: data }, 60000),
  photoGet: (code: string, id: string) =>
    rpc<string | null>('c2_photo_get', { p_code: code, p_id: id }, 60000),
};

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
/** Código legible de 12 caracteres, sin letras confusas (O/0, I/1). */
export function newTeamCode(random: (n: number) => Uint8Array): string {
  const bytes = random(12);
  let out = '';
  for (let i = 0; i < 12; i++) out += ALPHABET[bytes[i]! % ALPHABET.length];
  return `${out.slice(0, 4)}-${out.slice(4, 8)}-${out.slice(8)}`;
}
export function normalizeCode(code: string) {
  const clean = code.toUpperCase().replace(/[^A-Z0-9]/g, '');
  return clean.length === 12 ? `${clean.slice(0, 4)}-${clean.slice(4, 8)}-${clean.slice(8)}` : clean;
}
