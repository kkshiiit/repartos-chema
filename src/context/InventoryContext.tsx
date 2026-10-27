import { SharedInventoryProvider } from './SharedInventoryProvider';
import { useSharedSession } from './SharedContext';
import { userError } from '../services/errors';
import React, { useContext, useEffect, useMemo, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { AppState as NativeState, Platform } from 'react-native';
import * as Crypto from 'expo-crypto';
import type { Envelope } from '../types';
import { Repository } from '../data/repository';
import { inventoryStorage } from '../data/localStorage';
import { seed, emptyState } from '../data/seed';
import { emptyLocalState } from '../data/localInitialState';
import { LOCAL_ONLY } from '../services/localMode';
import { DATA_MODE, cloudAdapter } from '../services/firebase';
import { haptic } from '../hooks/useHaptics';
import { useAuth } from './AuthContext';
import { InventoryDataContext, type InventoryValue } from './InventoryState';
export const makeId = () => Crypto.randomUUID();
export { InventoryDataContext } from './InventoryState';
export type { InventoryValue } from './InventoryState';
const Context = InventoryDataContext;
export function InventoryProvider({ children }: { children: React.ReactNode }) {
  const shared = useSharedSession();
  return shared?.active ? (
    <SharedInventoryProvider key={`${shared.spaceId}:${shared.actor?.uid}`}>
      {children}
    </SharedInventoryProvider>
  ) : (
    <LocalInventoryProvider key={shared?.localKey || 'local'}>{children}</LocalInventoryProvider>
  );
}
function LocalInventoryProvider({ children }: { children: React.ReactNode }) {
  const shared = useSharedSession();
  const { user } = useAuth();
  const [env, setEnv] = useState<Envelope | null>(null),
    [error, setError] = useState(''),
    [online, setOnline] = useState(true),
    [syncing, setSyncing] = useState(false);
  const repo = useMemo(
    () =>
      new Repository(
        LOCAL_ONLY ? inventoryStorage : AsyncStorage,
        DATA_MODE === 'demo'
          ? shared?.localKey || 'chema:demo:v1'
          : `chema:cloud:${process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID}:${user?.uid}:v1`,
        DATA_MODE === 'demo' ? (LOCAL_ONLY ? emptyLocalState : seed) : emptyState,
        DATA_MODE === 'firebase' ? cloudAdapter : undefined,
      ),
    [user?.uid, shared?.localKey],
  );
  const retry = useCallback(async () => {
    setSyncing(true);
    try {
      const loaded = await repo.load();
      setEnv(loaded);
      if (user && DATA_MODE === 'firebase') await repo.sync();
      setError('');
    } catch (e) {
      setError(userError(e));
    } finally {
      setSyncing(false);
    }
  }, [repo, user]);
  useEffect(() => {
    if (!user) return;
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
        if (active) setError(userError(e));
      });
    return () => {
      active = false;
      off();
    };
  }, [repo, retry, user]);
  useEffect(
    () =>
      NetInfo.addEventListener((s) =>
        setOnline(s.isConnected !== false && s.isInternetReachable !== false),
      ),
    [],
  );
  const ready = !!env;
  useEffect(() => {
    if (user && online && ready && DATA_MODE === 'firebase') {
      void Promise.resolve().then(retry);
      const timer = setInterval(() => {
        if (
          NativeState.currentState === 'active' &&
          (Platform.OS !== 'web' || document.visibilityState === 'visible')
        )
          void retry();
      }, 30000);
      const sub = NativeState.addEventListener('change', (s) => {
        if (s === 'active') void retry();
      });
      return () => {
        clearInterval(timer);
        sub.remove();
      };
    }
  }, [online, ready, retry, user]); // Cola serial; también consulta cambios de otros usuarios al volver al frente.
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const refresh = () => {
      if (DATA_MODE === 'firebase') void retry();
      else
        void repo
          .load()
          .then(setEnv)
          .catch((e) => setError(userError(e)));
    };
    globalThis.addEventListener?.('focus', refresh);
    return () => globalThis.removeEventListener?.('focus', refresh);
  }, [retry, repo]);
  const [, setMinute] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setMinute((n) => n + 1), 60000);
    return () => clearInterval(timer);
  }, []);
  const value: InventoryValue = {
    workspaceKey: shared?.localKey || 'local',
    state: env?.state || emptyState(),
    ready: !!env,
    error: env?.queue.find((q) => q.status === 'CONFLICT')?.error || error,
    online,
    syncing,
    queue: env?.queue || [],
    retry,
    backup: async () => {
      if (user?.role !== 'ADMIN') throw new Error('Solo administración.');
      const { downloadBackup } = await import('../services/backupService');
      await downloadBackup(await repo.exportRaw());
    },
    backupToDestination: async () => {
      if (user?.role !== 'ADMIN') throw new Error('Solo administración.');
      const { saveVerifiedBackup } = await import('../services/backupService');
      return saveVerifiedBackup(await repo.exportRaw());
    },
    archives: () => repo.listArchives(),
    recoverArchive: async (key) => {
      if (!user || DATA_MODE !== 'demo') throw new Error('Disponible solo en este dispositivo.');
      await repo.recoverArchive(key, user);
      setError('');
    },
    restore: async (raw) => {
      if (!user || user.role !== 'ADMIN' || DATA_MODE !== 'demo')
        throw new Error('Restauración disponible para administración en demo.');
      const { prepareRestore } = await import('../services/backupService');
      await repo.restoreDemo(await prepareRestore(raw), user);
      setError('');
    },
    undoRestore: async () => {
      if (!user || DATA_MODE !== 'demo') throw new Error('Disponible solo en este dispositivo.');
      await repo.undoRestore(user);
      setError('');
    },
    startEmpty: async () => {
      if (!user || DATA_MODE !== 'demo') throw new Error('Disponible solo en este dispositivo.');
      await repo.startEmpty(user);
      setError('');
    },
    recoverPrevious: async () => {
      if (!user || DATA_MODE !== 'demo') throw new Error('Disponible solo en este dispositivo.');
      await repo.recoverPrevious(user);
      setError('');
    },
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
      haptic();
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
