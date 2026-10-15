import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signInAnonymously, signOut } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import type { UserProfile } from '../types';
import type { TeamMember } from '../domain/team';
import { teamName, invitationToken } from '../domain/team';
import { DATA_MODE, firebase } from '../services/firebase';
import { localSession, clearLocalSession, enterLocalTeam } from '../services/teamService';
import { cachedProfile, saveProfile } from '../services/profileCache';
interface AuthValue {
  user: UserProfile | null;
  membership: TeamMember | null;
  canManageTeam: boolean;
  loading: boolean;
  error: string;
  enterTeam: (nombre: string, invitation?: string) => Promise<void>;
  logout: () => Promise<void>;
}
const Context = createContext<AuthValue | null>(null);
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null),
    [membership, setMember] = useState<TeamMember | null>(null),
    [loading, setLoading] = useState(true),
    [error, setError] = useState('');
  const apply = (m: TeamMember | null) => {
    setMember(m);
    setUser(
      m ? { uid: m.uid, nombre: m.nombre, email: '', role: 'ADMIN', createdAt: m.createdAt } : null,
    );
  };
  useEffect(() => {
    let active = true,
      offProfile: (() => void) | undefined;
    if (DATA_MODE === 'demo') {
      void localSession()
        .then((m) => {
          if (active) apply(m);
        })
        .catch(() => {
          if (active)
            setError('No se pudo recuperar el acceso local. Los alquileres se conservan.');
        })
        .finally(() => {
          if (active) setLoading(false);
        });
      return () => {
        active = false;
      };
    }
    const services = firebase();
    const off = onAuthStateChanged(services.auth, (current) => {
      offProfile?.();
      if (!current) {
        if (active) {
          apply(null);
          setLoading(false);
        }
        return;
      }
      offProfile = onSnapshot(
        doc(services.db, 'users', current.uid),
        (snapshot) => {
          if (!active) return;
          const d = snapshot.data();
          if (d?.teamAccess === true && d.active === true) {
            const m: TeamMember = {
              uid: current.uid,
              nombre: d.nombre,
              createdAt: d.createdAt,
              active: true,
              owner: d.teamOwner === true,
            };
            apply(m);
            void saveProfile({
              uid: m.uid,
              nombre: m.nombre,
              email: '',
              role: 'ADMIN',
              createdAt: m.createdAt,
            }).catch(() => {});
            setError('');
          } else {
            apply(null);
            if (d?.active === false)
              setError('Tu acceso al equipo fue retirado. Contacta al responsable.');
          }
          setLoading(false);
        },
        async (e) => {
          if (!active) return;
          if (/unavailable|network-request-failed/.test(e.code)) {
            const p = await cachedProfile(current.uid);
            if (active && p) {
              setUser(p);
              setMember({
                uid: p.uid,
                nombre: p.nombre,
                createdAt: p.createdAt,
                owner: false,
                active: true,
              });
            }
          } else {
            apply(null);
            setError('No se pudo validar el acceso al equipo.');
          }
          if (active) setLoading(false);
        },
      );
    });
    return () => {
      active = false;
      off();
      offProfile?.();
    };
  }, []);
  const value: AuthValue = {
    user,
    membership,
    canManageTeam: membership?.owner === true,
    loading,
    error,
    enterTeam: async (nombre, input = '') => {
      const name = teamName(nombre);
      setError('');
      if (DATA_MODE === 'demo') {
        apply(await enterLocalTeam(name, input));
        return;
      }
      const token = invitationToken(input),
        services = firebase();
      if (!services.auth.currentUser) await signInAnonymously(services.auth);
      try {
        const response = await httpsCallable<{ nombre: string; token: string }, TeamMember>(
          services.functions,
          'joinTeam',
        )({ nombre: name, token });
        apply(response.data);
      } catch (e) {
        const message = (e as { message?: string }).message || '';
        throw new Error(
          message.includes('invitación') || message.includes('acceso')
            ? message
            : 'No se pudo ingresar al equipo. Revisa la invitación y la conexión.',
        );
      }
    },
    logout: async () => {
      if (DATA_MODE === 'demo') await clearLocalSession();
      else await signOut(firebase().auth);
      apply(null);
      setError('');
    },
  };
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useAuth() {
  const c = useContext(Context);
  if (!c) throw new Error('Falta proveedor de sesión.');
  return c;
}
