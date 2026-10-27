import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { AppState as NativeState, Platform } from 'react-native';
import { SharedMediaQueue, sharedPhotoCacheId, downloadSharedPhoto } from '../shared/media';
import { photoBytes, storePhoto } from '../services/photoCache';
import { SharedRepository, type SharedEnvelope } from '../shared/repository';
import type { SharedSnapshot } from '../shared/protocol';
import { inventoryStorage } from '../data/localStorage';
import { emptyState } from '../data/seed';
import { localId } from '../services/localId';
import { userError } from '../services/errors';
import { haptic } from '../hooks/useHaptics';
import { useSharedSession } from './SharedContext';
import { useAuth } from './AuthContext';
import { InventoryDataContext, type InventoryValue } from './InventoryState';
import type { ActivityLog, Envelope } from '../types';

export function SharedInventoryProvider({ children }: { children: React.ReactNode }) {
  const shared = useSharedSession(),
    { user } = useAuth();
  const [env, setEnv] = useState<SharedEnvelope | null>(null),
    [error, setError] = useState('');
  const [online, setOnline] = useState(true),
    [syncing, setSyncing] = useState(false);
  const [history, setHistory] = useState<ActivityLog[]>([]);
  const historyCursor = useRef(Number.MAX_SAFE_INTEGER);
  const repoRef = useRef<SharedRepository | null>(null);
  const initFlight = useRef<Promise<SharedRepository> | null>(null);
  const syncFlight = useRef<Promise<void> | null>(null);
  const unsubscribe = useRef<(() => void) | null>(null);
  const mounted = useRef(true);
  const remote = shared?.remote,
    initialSnapshot = shared?.initial;
  const spaceId = shared?.spaceId || '',
    actor = user;
  const key = `chema:shared:v1:${encodeURIComponent(spaceId)}:${encodeURIComponent(actor?.uid || '')}`;
  const media = useMemo(
    () =>
      actor && remote && spaceId
        ? new SharedMediaQueue(inventoryStorage, spaceId, actor.uid, remote, (id) =>
            photoBytes(sharedPhotoCacheId(spaceId, actor.uid, id)),
          )
        : null,
    [actor, remote, spaceId],
  );
  const [photoPending, setPhotoPending] = useState(0);
  const [mediaError, setMediaError] = useState('');
  const getRepo = useCallback((): Promise<SharedRepository> => {
    if (repoRef.current) return Promise.resolve(repoRef.current);
    if (initFlight.current) return initFlight.current;
    initFlight.current = (async () => {
      if (!actor || !remote || !spaceId)
        throw new Error('El equipo todavía no está listo. Tus datos locales se conservan.');
      const raw = await inventoryStorage.getItem(key);
      // Never initialize a missing cache with an empty team while offline.
      const initial: SharedSnapshot =
        initialSnapshot || (raw ? JSON.parse(raw).confirmed : await remote.snapshot());
      const repo = new SharedRepository(inventoryStorage, spaceId, actor, initial, remote);
      const loaded = await repo.init();
      if (mounted.current) {
        repoRef.current = repo;
        setEnv(loaded);
        unsubscribe.current = repo.subscribe((value) => {
          if (mounted.current) setEnv(value);
        });
      }
      return repo;
    })().catch((e) => {
      initFlight.current = null;
      throw e;
    });
    return initFlight.current;
  }, [actor, remote, initialSnapshot, spaceId, key]);
  const loadHistory = useCallback(
    async (before = Number.MAX_SAFE_INTEGER): Promise<boolean> => {
      if (!remote) return false;
      const cacheKey = `${key}:history:${before}`;
      let page: { sequence: number; event: ActivityLog }[];
      if (online) {
        page = await remote.request<typeof page>('history', { before });
        if (
          !Array.isArray(page) ||
          page.some(
            (row) => !Number.isSafeInteger(row.sequence) || typeof row.event?.id !== 'string',
          )
        )
          throw new Error(
            'No pudimos validar el historial recibido. La copia anterior se conserva.',
          );
        await inventoryStorage.setItem(cacheKey, JSON.stringify(page));
      } else {
        const raw = await inventoryStorage.getItem(cacheKey);
        if (!raw)
          throw new Error(
            'Conectate para consultar movimientos que todavía no están en este teléfono.',
          );
        page = JSON.parse(raw);
        if (!Array.isArray(page))
          throw new Error('La copia local del historial requiere revisión.');
      }
      if (mounted.current) {
        setHistory((prev) => [
          ...new Map(
            [...prev, ...page.map((row) => row.event)].map((log) => [log.id, log]),
          ).values(),
        ]);
        if (page.length)
          historyCursor.current = Math.min(
            historyCursor.current,
            ...page.map((row) => row.sequence),
          );
      }
      return page.length >= 100;
    },
    [remote, key, online],
  );
  const retry = useCallback(() => {
    if (syncFlight.current) return syncFlight.current;
    const run = (async () => {
      if (mounted.current) setSyncing(true);
      try {
        const repo = await getRepo();
        const before = repo.current().confirmed.cursor;
        const result = await repo.sync();
        if (media && actor) {
          for (const obra of result.confirmed.state.obras)
            for (const photo of obra.fotos || []) {
              if (photo.usuarioUid !== actor.uid && actor.role !== 'ADMIN') continue;
              const id = sharedPhotoCacheId(spaceId, actor.uid, photo.id);
              if (!(await photoBytes(id))) continue;
              await media.enqueue(obra.id, photo.id);
            }
          const pending = await media.sync();
          if (mounted.current) {
            setPhotoPending(pending.length);
            setMediaError(pending.find((row) => row.error)?.error || '');
          }
        }
        if (mounted.current) {
          setEnv(result);
          setError('');
        }
        if (
          !result.accessBlocked &&
          !result.error &&
          (before !== result.confirmed.cursor ||
            !historyCursor.current ||
            historyCursor.current === Number.MAX_SAFE_INTEGER)
        ) {
          try {
            await loadHistory();
          } catch (e) {
            if (mounted.current) setError(userError(e));
          }
        }
      } catch (e) {
        if (mounted.current) setError(userError(e));
      } finally {
        if (mounted.current) setSyncing(false);
      }
    })().finally(() => {
      syncFlight.current = null;
    });
    syncFlight.current = run;
    return run;
  }, [getRepo, loadHistory, media, actor, spaceId]);
  useEffect(() => {
    mounted.current = true;
    void media
      ?.pending()
      .then((rows) => {
        if (mounted.current) {
          setPhotoPending(rows.length);
          setMediaError(rows.find((row) => row.error)?.error || '');
        }
      })
      .catch((e) => {
        if (mounted.current) setMediaError(userError(e));
      });
    void getRepo().catch((e) => {
      if (mounted.current) setError(userError(e));
    });
    return () => {
      mounted.current = false;
      unsubscribe.current?.();
    };
  }, [getRepo, media]);
  useEffect(
    () =>
      NetInfo.addEventListener((s) =>
        setOnline(s.isConnected !== false && s.isInternetReachable !== false),
      ),
    [],
  );
  const ready = env !== null;
  useEffect(() => {
    if (!online || !ready) return;
    let timer: ReturnType<typeof setInterval> | undefined;
    const active = () =>
      NativeState.currentState === 'active' &&
      (Platform.OS !== 'web' || document.visibilityState === 'visible');
    const update = () => {
      if (timer) {
        clearInterval(timer);
        timer = undefined;
      }
      if (active()) {
        void retry();
        timer = setInterval(() => {
          if (active()) void retry();
        }, 30000);
      }
    };
    update();
    const sub = NativeState.addEventListener('change', update);
    if (Platform.OS === 'web') document.addEventListener('visibilitychange', update);
    return () => {
      if (timer) clearInterval(timer);
      sub.remove();
      if (Platform.OS === 'web') document.removeEventListener('visibilitychange', update);
    };
  }, [online, ready, retry]);
  const state = useMemo(() => {
    const current = env?.state || emptyState();
    return {
      ...current,
      logs: [...new Map([...history, ...current.logs].map((log) => [log.id, log])).values()].sort(
        (a, b) => b.timestamp.localeCompare(a.timestamp),
      ),
    };
  }, [env?.state, history]);
  const exportBackup = async () => {
    if (!actor || actor.role !== 'ADMIN')
      throw new Error('Sólo administración puede exportar una copia.');
    const repo = await getRepo(),
      value = repo.current();
    const { backupData } = await import('../services/backupService');
    const result = await backupData(
      JSON.stringify({ schema: 1, state, confirmed: state, queue: [] }),
      async (id) => {
        const scoped = sharedPhotoCacheId(spaceId, actor.uid, id);
        let bytes = await photoBytes(scoped);
        if (!bytes && remote) {
          const obra = state.obras.find((o) => o.fotos?.some((p) => p.id === id));
          if (obra) {
            bytes = await downloadSharedPhoto(remote, obra.id, id);
            await storePhoto(scoped, bytes);
          }
        }
        return bytes;
      },
    );
    const parsed = JSON.parse(new TextDecoder().decode(result.bytes));
    parsed.teamRecovery = {
      ...value,
      warning:
        'La copia contiene una proyección local y sus propuestas. Restaurarla abre un espacio individual; no reemplaza al equipo ni reenvía operaciones.',
    };
    return new TextEncoder().encode(JSON.stringify(parsed));
  };
  const queue: Envelope['queue'] = (env?.outbox || []).map((row) => ({
    operation: {
      id: row.command.operationId,
      action: row.command.action,
      actor: actor!,
      createdAt: row.command.clientTimestamp,
    },
    status: row.status === 'CONFLICT' ? 'CONFLICT' : 'PENDING',
    error: row.error,
  }));
  const unavailable = async (): Promise<never> => {
    throw new Error(
      'Esta acción no reemplaza datos del equipo. Volvé al uso individual o abrí una copia local aislada.',
    );
  };
  const value: InventoryValue = {
    state,
    workspaceId: spaceId,
    workspaceKey: spaceId,
    ready: !!env,
    accessBlocked: !!env?.accessBlocked,
    online,
    syncing,
    queue,
    lastSyncedAt: env?.lastSyncedAt,
    syncSummary: photoPending
      ? `${photoPending} fotos pendientes · Inventario guardado`
      : env?.accessBlocked
        ? 'Acceso pendiente de revisión'
        : env?.outbox.some((row) => row.status === 'CONFLICT')
          ? 'Conflicto pendiente'
          : syncing
            ? 'Sincronizando…'
            : !online
              ? 'Sin conexión · Guardado en este teléfono'
              : env?.outbox.length
                ? `${env.outbox.length} cambios pendientes`
                : env?.lastSyncedAt
                  ? 'Confirmado por el equipo'
                  : 'Copia local · Aún sin confirmar',
    error: env?.outbox.find((row) => row.error)?.error || env?.error || mediaError || error,
    retry,
    dispatch: async (action) => {
      const repo = await getRepo();
      if (action.type === 'PHOTO' && actor && media) {
        const bytes = await photoBytes(action.photo.id);
        if (bytes) await storePhoto(sharedPhotoCacheId(spaceId, actor.uid, action.photo.id), bytes);
        await media.enqueue(action.obraId, action.photo.id);
        setPhotoPending((await media.pending()).length);
      }
      await repo.dispatch(action, localId());
      haptic();
      if (online && NativeState.currentState === 'active') void retry();
    },
    backup: async () => {
      const { saveFile } = await import('../services/files');
      await saveFile('chema-equipo-copia.json', await exportBackup(), 'application/json');
    },
    backupToDestination: async () => {
      const { saveBackupToDestination } = await import('../services/files');
      return saveBackupToDestination(await exportBackup(), 'chema-equipo-copia.json');
    },
    archives: async () => [],
    recoverArchive: unavailable,
    recoverPrevious: unavailable,
    startEmpty: unavailable,
    undoRestore: unavailable,
    restore: async (raw) => {
      if (!actor || !shared) throw new Error('Iniciá sesión.');
      const { restoreSharedCopyLocally } = await import('../services/sharedRecovery');
      const localKey = `chema:recovery:${localId()}:v1`;
      await restoreSharedCopyLocally(inventoryStorage, raw, actor, localKey);
      await shared.useRecoveredLocal(localKey);
    },
    discard: async () => {
      const repo = await getRepo(),
        row = repo.current().outbox.find((item) => item.status === 'CONFLICT');
      if (!row)
        throw new Error(
          'No hay un rechazo confirmado para archivar. Reintentá para verificar los envíos inciertos.',
        );
      await repo.dismissConflict(row.command.operationId);
    },
    loadMoreHistory: () => loadHistory(historyCursor.current),
  };
  return <InventoryDataContext.Provider value={value}>{children}</InventoryDataContext.Provider>;
}
