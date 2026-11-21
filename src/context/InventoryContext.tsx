import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { AppState as NativeState } from 'react-native';
import * as Crypto from 'expo-crypto';
import { Buffer } from 'buffer';
import type { Action } from '../types';
import { emptyLocalState } from '../data/localInitialState';
import type { DomainSnapshot } from '../types';
import { stateBefore } from '../sync/restore';
import { snapshot } from '../domain/engine';
import { haptic } from '../hooks/useHaptics';
import { userError } from '../services/errors';
import { photoBytes, storePhoto } from '../services/photoCache';
import { api, SyncError } from '../sync/api';
import { kv } from '../sync/kv';
import { applySync, type SyncAction } from '../sync/ops';
import { SyncStore, type View } from '../sync/store';
import { useAuth } from './AuthContext';
import { usePin } from './PinContext';
import { InventoryDataContext, type InventoryValue } from './InventoryState';

export const makeId = () => Crypto.randomUUID();
export { InventoryDataContext } from './InventoryState';
export type { InventoryValue } from './InventoryState';
const Context = InventoryDataContext;

/** Descarga una foto de otro teléfono la primera vez que se ve. */
export async function fetchTeamPhoto(code: string, id: string) {
  const local = await photoBytes(id);
  if (local) return local;
  const data = await api.photoGet(code, id);
  if (!data) return null;
  const bytes = new Uint8Array(Buffer.from(data, 'base64'));
  await storePhoto(id, bytes);
  return bytes;
}

function serialize(state: InventoryValue['state']) {
  return JSON.stringify({ schema: 1, confirmed: state, state, queue: [] });
}

export function InventoryProvider({ children }: { children: React.ReactNode }) {
  const { session, user, codeLost } = useAuth();
  const { withPin } = usePin();
  const code = session?.code || '';
  const teamId = session?.teamId || '';
  const store = useMemo(
    () =>
      teamId
        ? new SyncStore(kv, teamId, {
            push: (ops) => api.push(code, ops),
            pull: (after) => api.pull(code, after),
            async uploadPhoto(id) {
              const bytes = await photoBytes(id);
              if (!bytes) throw new Error('Foto ausente');
              await api.photoPut(code, id, Buffer.from(bytes).toString('base64'));
            },
          })
        : null,
    [teamId, code],
  );
  const [view, setView] = useState<View | null>(null),
    [error, setError] = useState(''),
    [online, setOnline] = useState(true),
    [syncing, setSyncing] = useState(false);
  const running = useRef(false);

  const retry = useCallback(async () => {
    if (!store || running.current) return;
    running.current = true;
    setSyncing(true);
    try {
      await store.sync();
      setError('');
      setOnline(true);
    } catch (e) {
      if (e instanceof SyncError && e.kind === 'offline') setOnline(false);
      else if (e instanceof SyncError && e.kind === 'not-found') void codeLost();
      else setError(userError(e));
    } finally {
      running.current = false;
      setSyncing(false);
    }
  }, [store, codeLost]);

  useEffect(() => {
    if (!store) return;
    let active = true;
    const off = store.subscribe((v) => active && setView(v));
    store
      .load()
      .then(() => {
        if (active) void retry();
      })
      .catch((e) => active && setError(userError(e)));
    return () => {
      active = false;
      off();
    };
  }, [store, retry]);

  useEffect(
    () =>
      NetInfo.addEventListener((s) => {
        const up = s.isConnected !== false && s.isInternetReachable !== false;
        setOnline(up);
        if (up) void retry();
      }),
    [retry],
  );
  useEffect(() => {
    if (!store) return;
    const timer = setInterval(() => {
      if (NativeState.currentState === 'active') void retry();
    }, 15000);
    const sub = NativeState.addEventListener('change', (s) => {
      if (s === 'active') void retry();
    });
    return () => {
      clearInterval(timer);
      sub.remove();
    };
  }, [store, retry]);

  const dispatchSync = useCallback(
    async (action: SyncAction) => {
      if (!store || !user) throw new Error('Ingresá con tu nombre.');
      const op = { id: makeId(), createdAt: new Date().toISOString(), actor: user, action };
      if (action.type === 'IMPORT_SNAPSHOT') {
        // Reemplaza los datos de todo el equipo: va directo al servidor y, si el equipo tiene
        // responsable, con su PIN. Necesita conexión.
        const now = store.current();
        if (!now) throw new Error('Los datos todavía se están cargando.');
        applySync(now.state, op);
        await withPin('Esto reemplaza los datos de todo el equipo.', (pin) =>
          api.protectedPush(code, pin, {
            opId: op.id,
            actorId: user.uid,
            actorName: user.nombre,
            clientAt: op.createdAt,
            op,
          }),
        );
        await store.sync();
      } else await store.dispatch(op);
      setError('');
      haptic();
      void retry();
    },
    [store, user, retry, withPin, code],
  );

  // Registro de ingreso (una vez por persona y teléfono) y alta automática como responsable.
  useEffect(() => {
    if (!store || !user || !view || !teamId) return;
    const key = `chema2:announced:${teamId}:${user.uid}`;
    let cancelled = false;
    void (async () => {
      if (await kv.getItem(key)) return;
      if (cancelled) return;
      await kv.setItem(key, '1');
      await dispatchSync({ type: 'NOTE', accion: `${user.nombre} ingresó desde un teléfono` });
      const current = store.current()?.state;
      if (current && !current.responsables.includes(user.nombre))
        await dispatchSync({ type: 'RESPONSABLES', nombres: [...current.responsables, user.nombre] });
    })().catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [store, user, view, teamId, dispatchSync]);

  // Copia automática semanal: el primer teléfono que sincroniza en la semana la sube (el servidor
  // ignora las repetidas). Se revisa como máximo una vez por día y por teléfono.
  useEffect(() => {
    if (!store || !view?.lastSyncAt || !code || !teamId) return;
    const key = `chema2:backup-check:${teamId}`;
    void (async () => {
      const last = Number((await kv.getItem(key)) || 0);
      if (Date.now() - last < 24 * 60 * 60 * 1000) return;
      const confirmed = store.current();
      if (!confirmed || (!confirmed.state.obras.length && !confirmed.state.materiales.length)) return;
      await api.backupPut(code, confirmed.lastSeq, snapshot(confirmed.state), 'auto', user?.nombre);
      await kv.setItem(key, String(Date.now()));
    })().catch(() => undefined);
  }, [store, view?.lastSyncAt, code, teamId, user?.nombre]);

  /** Guarda el estado actual como copia y lo reemplaza por `snap`, dejando constancia en la Auditoría. */
  const restoreTo = useCallback(
    async (snap: DomainSnapshot, accion: string) => {
      const now = store?.current();
      if (!now) throw new Error('Los datos todavía se están cargando.');
      await api.backupPut(code, now.lastSeq, snapshot(now.state), 'antes-de-restaurar', user?.nombre);
      await dispatchSync({ type: 'IMPORT_SNAPSHOT', origen: 'restauración', accion, snapshot: snap });
    },
    [store, code, user?.nombre, dispatchSync],
  );

  const current = store ? view : null;
  const state = current?.state || emptyLocalState();
  const value: InventoryValue = {
    workspaceKey: teamId || 'local',
    workspaceId: teamId,
    state,
    ready: !!current,
    error,
    online,
    syncing,
    lastSyncedAt: current?.lastSyncAt,
    syncSummary: current
      ? current.pending.length
        ? `${current.pending.length} cambio${current.pending.length === 1 ? '' : 's'} por enviar`
        : 'Todo sincronizado'
      : 'Cargando…',
    queue: (current?.pending || []).map((operation) => ({
      operation: operation as never,
      status: 'PENDING' as const,
    })),
    rejected: current?.rejected || [],
    dismissRejected: async (id) => {
      await store?.dismissRejected(id);
    },
    note: (accion, obraId) => dispatchSync({ type: 'NOTE', accion, obraId }),
    importSnapshot: (snap, origen) => dispatchSync({ type: 'IMPORT_SNAPSHOT', origen, snapshot: snap }),
    backups: () => api.backupList(code),
    previewBackup: async (id) => {
      const data = (await api.backupGet(code, id)) as DomainSnapshot | null;
      if (!data) throw new Error('No se encontró esa copia.');
      return data;
    },
    restoreSnapshot: restoreTo,
    previewBefore: async (opId) => {
      const found = await stateBefore(opId, (after) => api.pull(code, after, 500));
      if (!found)
        throw new Error('Ese cambio todavía no llegó al servidor. Sincronizá y probá de nuevo.');
      return snapshot(found.state);
    },
    dispatch: (action: Action) => dispatchSync(action),
    retry,
    discard: async () => {
      await store?.dismissRejected();
    },
    backup: async () => {
      const { downloadBackup } = await import('../services/backupService');
      await downloadBackup(serialize(state));
      await dispatchSync({ type: 'NOTE', accion: 'Exportó una copia completa (JSON)' });
    },
    backupToDestination: async () => {
      const { saveVerifiedBackup } = await import('../services/backupService');
      const result = await saveVerifiedBackup(serialize(state));
      if (result.saved || result.prepared)
        await dispatchSync({ type: 'NOTE', accion: 'Exportó una copia completa (JSON)' });
      return result;
    },
    archives: async () => [],
    recoverArchive: async () => {
      throw new Error('Usá Importar copia para recuperar datos.');
    },
    restore: async (raw: string) => {
      const { prepareRestore } = await import('../services/backupService');
      const prepared = JSON.parse(await prepareRestore(raw)) as { state: InventoryValue['state'] };
      await dispatchSync({
        type: 'IMPORT_SNAPSHOT',
        origen: 'archivo JSON',
        snapshot: snapshot(prepared.state),
      });
    },
    undoRestore: async () => {
      throw new Error('Para deshacer una importación, importá la copia anterior.');
    },
    startEmpty: async () => {
      await dispatchSync({
        type: 'IMPORT_SNAPSHOT',
        origen: 'empezar vacío',
        snapshot: { obras: [], materiales: [], combos: [], responsables: state.responsables, notificaciones: [] },
      });
    },
    recoverPrevious: async () => {
      throw new Error('Usá Importar copia para recuperar datos.');
    },
  };
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useInventory() {
  const c = useContext(Context);
  if (!c) throw new Error('Falta proveedor de inventario.');
  return c;
}
