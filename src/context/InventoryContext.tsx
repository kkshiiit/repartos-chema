import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { AppState as NativeState, Platform } from 'react-native';
import * as Crypto from 'expo-crypto';
import type { Action, AppState, Envelope } from '../types';
import { Repository } from '../data/repository';
import { seed, emptyState } from '../data/seed';
import { DATA_MODE, cloudAdapter } from '../services/firebase';
import { useAuth } from './AuthContext';
export const makeId = () => Crypto.randomUUID();
interface Value {
  state: AppState;
  ready: boolean;
  error: string;
  online: boolean;
  syncing: boolean;
  queue: Envelope['queue'];
  dispatch: (a: Action) => Promise<void>;
  retry: () => Promise<void>;
  discard: () => Promise<void>;
}
const Context = createContext<Value | null>(null);
export function InventoryProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [env, setEnv] = useState<Envelope | null>(null),
    [error, setError] = useState(''),
    [online, setOnline] = useState(true),
    [syncing, setSyncing] = useState(false);
  const repo = useMemo(
    () =>
      new Repository(
        AsyncStorage,
        DATA_MODE === 'demo'
          ? 'chema:demo:v1'
          : `chema:cloud:${process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID}:${user?.uid}:v1`,
        DATA_MODE === 'demo' ? seed : emptyState,
        DATA_MODE === 'firebase' ? cloudAdapter : undefined,
      ),
    [user?.uid],
  );
  const retry = useCallback(async () => {
    setSyncing(true);
    try {
      await repo.sync();
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo sincronizar.');
    } finally {
      setSyncing(false);
    }
  }, [repo]);
  useEffect(() => {
    let active = true;
    const off = repo.subscribe((e) => {
      if (active) setEnv(e);
    });
    repo
      .load()
      .then((e) => {
        if (active) {
          setEnv(e);
        }
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
      off();
    };
  }, [repo, retry]);
  useEffect(
    () =>
      NetInfo.addEventListener((s) =>
        setOnline(s.isConnected !== false && s.isInternetReachable !== false),
      ),
    [],
  );
  const ready = !!env;
  useEffect(() => {
    if (online && ready && DATA_MODE === 'firebase') {
      void Promise.resolve().then(retry);
      const timer = setInterval(() => void retry(), 30000);
      const sub = NativeState.addEventListener('change', (s) => {
        if (s === 'active') void retry();
      });
      return () => {
        clearInterval(timer);
        sub.remove();
      };
    }
  }, [online, ready, retry]); // Cola serial; también consulta cambios de otros usuarios al volver al frente.
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const refresh = () => {
      if (DATA_MODE === 'firebase') void retry();
      else
        void repo
          .load()
          .then(setEnv)
          .catch((e) => setError(e.message));
    };
    globalThis.addEventListener?.('focus', refresh);
    return () => globalThis.removeEventListener?.('focus', refresh);
  }, [retry, repo]);
  const [, setMinute] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setMinute((n) => n + 1), 60000);
    return () => clearInterval(timer);
  }, []);
  const value: Value = {
    state: env?.state || emptyState(),
    ready: !!env,
    error,
    online,
    syncing,
    queue: env?.queue || [],
    retry,
    discard: async () => {
      await repo.discardConflict();
      setError('');
    },
    dispatch: async (action) => {
      if (!user) throw new Error('Inicia sesión.');
      await repo.dispatch({
        id: makeId(),
        createdAt: new Date().toISOString(),
        actor: user,
        action,
      });
      setError('');
      if (online && DATA_MODE === 'firebase') void retry();
    },
  };
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useInventory() {
  const c = useContext(Context);
  if (!c) throw new Error('Falta proveedor de inventario.');
  return c;
}
