import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import { httpsCallable } from 'firebase/functions';
import { DATA_MODE, firebase } from './firebase';
import {
  teamName,
  invitationToken,
  invitationUrl,
  assertInvite,
  assertRemoval,
  assertOwner,
  type TeamMember,
  type TeamInvite,
} from '../domain/team';
const KEY = 'chema:team-demo:v1',
  SESSION = 'chema:named-session:v1';
interface LocalTeam {
  schema: 1;
  members: TeamMember[];
  invites: TeamInvite[];
}
let serial: Promise<unknown> = Promise.resolve();
async function read(): Promise<LocalTeam> {
  const raw = await AsyncStorage.getItem(KEY);
  if (raw === null) return { schema: 1, members: [], invites: [] };
  let d: LocalTeam;
  try {
    d = JSON.parse(raw);
    if (
      d.schema !== 1 ||
      !Array.isArray(d.members) ||
      !Array.isArray(d.invites) ||
      d.members.some(
        (m) => !m.uid || typeof m.active !== 'boolean' || typeof m.owner !== 'boolean' || !m.nombre,
      )
    )
      throw new Error();
  } catch {
    throw new Error('No se pudo leer el equipo local. Se conserva el original.');
  }
  return d;
}
function mutate<T>(fn: (d: LocalTeam) => Promise<T> | T): Promise<T> {
  const run = async () => {
    const d = await read();
    const result = await fn(d);
    await AsyncStorage.setItem(KEY, JSON.stringify(d));
    return result;
  };
  const next = serial.then(() =>
    typeof navigator !== 'undefined' && navigator.locks ? navigator.locks.request(KEY, run) : run(),
  );
  serial = next.catch(() => {});
  return next;
}
async function digest(token: string) {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, token);
}
async function call<T>(endpoint: string, data: unknown) {
  return (await httpsCallable<unknown, T>(firebase().functions, endpoint)(data)).data;
}
export async function localSession() {
  const uid = await AsyncStorage.getItem(SESSION);
  if (!uid) return null;
  return (await read()).members.find((m) => m.uid === uid && m.active) || null;
}
export async function clearLocalSession() {
  await AsyncStorage.removeItem(SESSION);
}
export async function enterLocalTeam(name: string, input = '') {
  const nombre = teamName(name),
    token = invitationToken(input);
  const member = await mutate(async (d) => {
    const existing = d.members.find(
      (m) => m.nombre.toLocaleLowerCase('es') === nombre.toLocaleLowerCase('es'),
    );
    if (existing && !existing.active)
      throw new Error(
        'Este nombre fue quitado del equipo local. Solicita una nueva incorporación.',
      );
    if (existing) return existing;
    if (d.members.length && token) {
      const hash = await digest(token),
        invite = d.invites.find((i) => i.tokenHash === hash);
      assertInvite(invite);
    }
    // La demo no autentica personas. El nombre solo identifica movimientos de este dispositivo.
    const m: TeamMember = {
      uid: `demo_${Crypto.randomUUID()}`,
      nombre,
      active: true,
      owner: d.members.length === 0,
      createdAt: new Date().toISOString(),
    };
    if (token) {
      const hash = await digest(token);
      const valid = d.invites.find((i) => i.tokenHash === hash);
      assertInvite(valid);
      valid!.usedBy = m.uid;
    }
    d.members.push(m);
    return m;
  });
  await AsyncStorage.setItem(SESSION, member.uid);
  return member;
}
export async function listTeam(_actor: TeamMember): Promise<TeamMember[]> {
  if (DATA_MODE === 'demo') return (await read()).members;
  return call('listTeam', {});
}
export async function createInvitation(actor: TeamMember) {
  if (DATA_MODE !== 'demo')
    return call<{ url: string; expiresAt: string }>('createTeamInvitation', {});
  return mutate(async (d) => {
    assertOwner(d.members.find((m) => m.uid === actor.uid));
    const bytes = Crypto.getRandomBytes(32);
    const token = Array.from(bytes, (n) => n.toString(16).padStart(2, '0')).join('');
    const expiresAt = new Date(Date.now() + 86400000).toISOString();
    d.invites = d.invites
      .filter((i) => !i.usedBy && Date.parse(i.expiresAt) > Date.now())
      .slice(-19);
    d.invites.push({ tokenHash: await digest(token), expiresAt });
    return { url: invitationUrl(token), expiresAt };
  });
}
export async function removeMember(actor: TeamMember, uid: string) {
  if (DATA_MODE !== 'demo') {
    await call('removeTeamMember', { uid });
    return;
  }
  await mutate((d) => {
    const target = d.members.find((m) => m.uid === uid);
    assertRemoval(
      d.members.find((m) => m.uid === actor.uid),
      target,
    );
    target!.active = false;
  });
}
