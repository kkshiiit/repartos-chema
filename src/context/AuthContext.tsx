import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import type { UserProfile, UserRole } from '../types';
import { DATA_MODE, firebase } from '../services/firebase';
import { cachedProfile, saveProfile } from '../services/profileCache';
import { demoProfile } from '../data/seed';
interface AuthValue {
  user: UserProfile | null;
  loading: boolean;
  error: string;
  demoLogin: (role: UserRole) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  reset: (email: string) => Promise<void>;
}
const Context = createContext<AuthValue | null>(null);
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null),
    [loading, setLoading] = useState(true),
    [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    let unsubscribe: (() => void) | undefined;
    const start = async () => {
      if (DATA_MODE === 'demo') {
        const role = await AsyncStorage.getItem('chema:demo-role');
        if (active) {
          if (role === 'ADMIN' || role === 'OPERADOR') setUser(demoProfile(role));
          setLoading(false);
        }
        return;
      }
      const services = firebase();
      if (!active) return;
      unsubscribe = onAuthStateChanged(services.auth, async (current) => {
        if (!active) return;
        setLoading(true);
        try {
          if (current?.emailVerified) {
            let p: UserProfile | null = null;
            try {
              const d = await getDoc(doc(services.db, 'users', current.uid));
              const data = d.data() as UserProfile | undefined;
              if (!data || !['ADMIN', 'OPERADOR'].includes(data.role))
                throw new Error('Solicita un perfil al administrador.');
              p = { ...data, uid: current.uid };
              await saveProfile(p);
            } catch (e) {
              const code = (e as { code?: string }).code || '';
              if (!/unavailable|network-request-failed/.test(code)) throw e;
              p = await cachedProfile(current.uid);
              if (!p) throw new Error('Conéctate una vez para validar tu perfil.');
            }
            if (active && services.auth.currentUser?.uid === current.uid) setUser(p);
          } else {
            if (active) {
              setUser(null);
              if (current) setError('Verifica tu correo antes de ingresar.');
            }
          }
        } catch (e) {
          if (active) {
            setUser(null);
            setError(e instanceof Error ? e.message : 'No se pudo validar el perfil.');
          }
        } finally {
          if (active) setLoading(false);
        }
      });
    };
    void start().catch((e) => {
      if (active) {
        setError(e instanceof Error ? e.message : 'No se pudo iniciar la sesión.');
        setLoading(false);
      }
    });
    return () => {
      active = false;
      unsubscribe?.();
    };
  }, []);
  const value: AuthValue = {
    user,
    loading,
    error,
    demoLogin: async (role) => {
      await AsyncStorage.setItem('chema:demo-role', role);
      setUser(demoProfile(role));
    },
    login: async (email, password) => {
      setError('');
      try {
        const result = await signInWithEmailAndPassword(firebase().auth, email.trim(), password);
        if (!result.user.emailVerified) throw new Error('Verifica tu correo para ingresar.');
      } catch {
        throw new Error(
          'No se pudo ingresar. Revisa las credenciales y la verificación del correo.',
        );
      }
    },
    logout: async () => {
      if (DATA_MODE === 'demo') await AsyncStorage.removeItem('chema:demo-role');
      else await signOut(firebase().auth);
      setUser(null);
    },
    reset: async (email) => {
      await sendPasswordResetEmail(firebase().auth, email.trim());
    },
  };
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useAuth() {
  const c = useContext(Context);
  if (!c) throw new Error('Falta proveedor de sesión.');
  return c;
}
