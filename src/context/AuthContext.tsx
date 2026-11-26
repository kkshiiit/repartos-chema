import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as Crypto from 'expo-crypto';
import type { UserProfile } from '../types';
import { api, newTeamCode, normalizeCode, SyncError, type Member } from '../sync/api';
import { kv } from '../sync/kv';
import { readSession, writeSession, type TeamSession } from '../sync/session';
import { actorFor } from '../sync/ops';

interface AuthValue {
  user: UserProfile | null;
  session: TeamSession | null;
  members: Member[];
  loading: boolean;
  error: string;
  /** Compatibilidad: todos los integrantes pueden administrar; la auditoría registra quién hizo qué. */
  canManageTeam: boolean;
  membership: null;
  createTeam: (teamName: string) => Promise<TeamSession>;
  joinTeam: (code: string) => Promise<TeamSession>;
  enterAs: (name: string) => Promise<void>;
  refreshMembers: () => Promise<Member[]>;
  removeMember: (id: string, pin?: string) => Promise<void>;
  switchUser: () => Promise<void>;
  leaveTeam: () => Promise<void>;
  /** Genera un código nuevo; el anterior deja de funcionar en todos los teléfonos. */
  rotateCode: (pin?: string) => Promise<string>;
  /** El servidor ya no reconoce el código guardado (otra persona lo cambió). */
  codeLost: () => Promise<void>;
  notice: string;
  clearNotice: () => void;
  logout: () => Promise<void>;
  enterTeam: (name: string) => Promise<void>;
}
const Context = createContext<AuthValue | null>(null);
const NOTICE_KEY = 'chema2:notice';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<TeamSession | null>(null),
    [members, setMembers] = useState<Member[]>([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(''),
    [notice, setNotice] = useState('');
  useEffect(() => {
    kv.getItem(NOTICE_KEY)
      .then((n) => n && setNotice(n))
      .catch(() => undefined);
    readSession()
      .then(setSession)
      .catch(() => setError('No se pudo leer la sesión guardada.'))
      .finally(() => setLoading(false));
  }, []);
  const save = useCallback(async (s: TeamSession | null) => {
    await writeSession(s);
    setSession(s);
  }, []);
  const membersKey = session ? `chema2:members:${session.teamId}` : '';
  const refreshMembers = useCallback(async () => {
    if (!session) return [];
    try {
      const list = await api.members(session.code);
      setMembers(list);
      await kv.setItem(membersKey, JSON.stringify(list)).catch(() => undefined);
      return list;
    } catch (e) {
      // Sin señal: usar la última lista guardada en el teléfono.
      const cached = JSON.parse((await kv.getItem(membersKey)) || 'null') as Member[] | null;
      if (cached) {
        setMembers(cached);
        return cached;
      }
      throw e;
    }
  }, [session, membersKey]);
  useEffect(() => {
    if (session) void Promise.resolve().then(refreshMembers).catch(() => undefined);
  }, [session, refreshMembers]);
  const value = useMemo<AuthValue>(
    () => ({
      user: session?.member ? actorFor(session.member) : null,
      session,
      members,
      loading,
      error,
      canManageTeam: true,
      membership: null,
      async createTeam(teamName) {
        const name = teamName.trim();
        if (!name) throw new Error('Escribí el nombre del negocio o equipo.');
        const code = newTeamCode((n) => Crypto.getRandomBytes(n));
        const info = await api.createTeam(code, name);
        const s = { code, teamId: info.teamId, teamName: info.name };
        await save(s);
        setMembers([]);
        return s;
      },
      async joinTeam(raw) {
        const code = normalizeCode(raw);
        if (code.replace(/-/g, '').length < 8) throw new Error('El código tiene 12 letras y números.');
        const info = await api.join(code);
        const s = { code, teamId: info.teamId, teamName: info.name };
        await save(s);
        setMembers(info.members);
        return s;
      },
      async enterAs(name) {
        if (!session) throw new Error('Primero entrá a un equipo.');
        const clean = name.trim().replace(/\s+/g, ' ');
        if (clean.length < 2) throw new Error('Escribí tu nombre (al menos 2 letras).');
        let member: Member;
        try {
          member = await api.addMember(session.code, clean);
        } catch (e) {
          const known = members.find((m) => m.name.toLowerCase() === clean.toLowerCase());
          if (!(e instanceof SyncError && e.kind === 'offline') || !known) throw e;
          member = known; // sin señal, una persona ya registrada puede volver a entrar
        }
        await save({ ...session, member: { id: member.id, name: member.name } });
        refreshMembers().catch(() => undefined);
      },
      refreshMembers,
      async removeMember(id, pin) {
        if (!session) return;
        setMembers(await api.removeMember(session.code, id, pin));
      },
      async switchUser() {
        if (session) await save({ ...session, member: undefined });
      },
      async rotateCode(pin) {
        if (!session) throw new Error('Primero entrá a un equipo.');
        const code = newTeamCode((n) => Crypto.getRandomBytes(n));
        await api.rotateCode(session.code, code, pin);
        await save({ ...session, code });
        return code;
      },
      async codeLost() {
        // Releer el código guardado: si este teléfono acaba de cambiarlo, sigue siendo válido.
        const current = await readSession();
        if (!current) return;
        try {
          await api.join(current.code);
          if (current.code !== session?.code) setSession(current);
          return;
        } catch (e) {
          if (!(e instanceof SyncError && e.kind === 'not-found')) return;
        }
        const text =
          'El código del equipo cambió. Pedile el código nuevo a tu equipo y volvé a entrar: tus cambios guardados en este teléfono no se pierden.';
        await kv.setItem(NOTICE_KEY, text);
        setNotice(text);
        await save(null);
      },
      notice,
      clearNotice: () => {
        setNotice('');
        void kv.removeItem(NOTICE_KEY).catch(() => undefined);
      },
      async leaveTeam() {
        await save(null);
        setMembers([]);
      },
      async logout() {
        if (session) await save({ ...session, member: undefined });
      },
      async enterTeam(name) {
        await value.enterAs(name);
      },
    }),
     
    [session, members, loading, error, notice, save, refreshMembers],
  );
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useAuth() {
  const c = useContext(Context);
  if (!c) throw new Error('Falta AuthProvider.');
  return c;
}
