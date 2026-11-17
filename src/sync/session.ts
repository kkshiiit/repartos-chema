import { kv } from './kv';
export interface TeamSession {
  code: string;
  teamId: string;
  teamName: string;
  member?: { id: string; name: string };
}
const KEY = 'chema2:session';
export async function readSession(): Promise<TeamSession | null> {
  const raw = await kv.getItem(KEY);
  if (!raw) return null;
  try {
    const s = JSON.parse(raw) as TeamSession;
    return s && typeof s.code === 'string' && typeof s.teamId === 'string' ? s : null;
  } catch {
    return null;
  }
}
export async function writeSession(s: TeamSession | null) {
  if (s) await kv.setItem(KEY, JSON.stringify(s));
  else await kv.removeItem(KEY);
}
