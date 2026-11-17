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
  removeMember: (id: string) => Promise<void>;
  switchUser: () => Promise<void>;
  leaveTeam: () => Promise<void>;
  logout: () => Promise<void>;
  enterTeam: (name: string) => Promise<void>;
}
const Context = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<TeamSession | null>(null),
    [members, setMembers] = useState<Member[]>([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState('');
  useEffect(() => {
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
      async removeMember(id) {
        if (!session) return;
        setMembers(await api.removeMember(session.code, id));
      },
      async switchUser() {
        if (session) await save({ ...session, member: undefined });
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [session, members, loading, error, save, refreshMembers],
  );
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useAuth() {
  const c = useContext(Context);
  if (!c) throw new Error('Falta AuthProvider.');
  return c;
}
