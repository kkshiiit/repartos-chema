import React, { useContext } from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { beforeEach, expect, it, vi } from 'vitest';
import { SharedInventoryProvider } from '../src/context/SharedInventoryProvider';
import { InventoryDataContext, type InventoryValue } from '../src/context/InventoryState';
import {
  bootstrapShared,
  createCommand,
  prepareCommit,
  type SharedSnapshot,
} from '../src/shared/protocol';
import { demoProfile, emptyState } from '../src/data/seed';
import { SqliteStorage } from '../src/data/sqliteStorage';
import { sqliteDb } from './helpers/sqlite';
import type { ActivityLog } from '../src/types';
const controls = vi.hoisted(() => ({
  shared: {} as Record<string, unknown>,
  storage: null as unknown,
  user: {} as Record<string, unknown>,
}));
vi.mock('../src/context/SharedContext', () => ({ useSharedSession: () => controls.shared }));
vi.mock('../src/context/AuthContext', () => ({ useAuth: () => ({ user: controls.user }) }));
vi.mock('../src/data/localStorage', () => ({
  inventoryStorage: {
    getItem: (k: string) => (controls.storage as SqliteStorage).getItem(k),
    setItem: (k: string, v: string) => (controls.storage as SqliteStorage).setItem(k, v),
    atomicSet: (v: [string, string][]) => (controls.storage as SqliteStorage).atomicSet(v),
  },
}));
vi.mock('../src/services/photoCache', () => ({
  photoBytes: async () => null,
  storePhoto: async () => '',
}));
vi.mock('../src/hooks/useHaptics', () => ({ haptic: () => {} }));
vi.mock('react-native', () => ({
  Platform: { OS: 'android' },
  AppState: { currentState: 'background', addEventListener: () => ({ remove: () => {} }) },
}));
vi.mock('@react-native-community/netinfo', () => ({
  default: { addEventListener: () => () => {} },
}));
let value: InventoryValue;
function Probe() {
  const current = useContext(InventoryDataContext)!;
  React.useEffect(() => {
    value = current;
  }, [current]);
  return null;
}
const render = () => React.createElement(SharedInventoryProvider, null, React.createElement(Probe));
function setup() {
  const actor = demoProfile('ADMIN');
  let snapshot = bootstrapShared('provider_test', emptyState(), 'epoch');
  let total = 200;
  const receipts = new Map();
  const remote = {
    snapshot: async () => snapshot,
    receipt: async (id: string) => receipts.get(id) || null,
    pull: async () => ({ changes: [snapshot], watermark: snapshot.cursor, epoch: snapshot.epoch }),
    commit: async (command: ReturnType<typeof createCommand>) => {
      const result = prepareCommit(snapshot, command, actor);
      if (result.kind === 'CONFIRMED') {
        snapshot = result.snapshot;
        receipts.set(command.operationId, result);
      }
      return result;
    },
    request: async (type: string, args: { before?: number } = {}) =>
      type === 'history'
        ? Array.from({ length: total }, (_, i) => ({
            sequence: i + 1,
            event: {
              id: 'history_' + (i + 1),
              timestamp: new Date(Date.UTC(2026, 0, 1, 0, 0, i)).toISOString(),
              usuarioUid: actor.uid,
              usuarioNombre: 'Persona sintética',
              accion: 'Evento sintético ' + (i + 1),
            } satisfies ActivityLog,
          }))
            .filter((r) => r.sequence < (args.before ?? Number.MAX_SAFE_INTEGER))
            .reverse()
            .slice(0, 100)
        : [],
  };
  controls.user = actor as unknown as Record<string, unknown>;
  controls.storage = new SqliteStorage(sqliteDb());
  controls.shared = { active: true, spaceId: 'provider_test', actor, remote, initial: snapshot };
  return {
    actor,
    remote,
    snapshot,
    grow: () => {
      total = 500;
    },
  };
}
beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
});
it('revalidar misma cuenta mantiene la suscripción y el guardado local visible', async () => {
  setup();
  let tree!: ReactTestRenderer;
  await act(async () => {
    tree = create(render());
  });
  expect(value.ready).toBe(true);
  await act(async () => {
    await value.dispatch({ type: 'RESPONSABLES', nombres: ['Primero'] });
  });
  expect(value.state.responsables).toEqual(['Primero']);
  controls.user = { ...controls.user, nombre: 'Nombre revalidado' };
  controls.shared = {
    ...controls.shared,
    initial: { ...(controls.shared.initial as SharedSnapshot) },
  };
  await act(async () => {
    tree.update(render());
  });
  await act(async () => {
    await value.dispatch({ type: 'RESPONSABLES', nombres: ['Después de revalidar'] });
  });
  expect(value.state.responsables).toEqual(['Después de revalidar']);
  await act(async () => {
    tree.unmount();
  });
});
it('historial tras salto de más de una página no omite el intervalo nuevo intermedio', async () => {
  const server = setup();
  let tree!: ReactTestRenderer;
  await act(async () => {
    tree = create(render());
    await Promise.resolve();
  });
  await act(async () => {
    await value.retry();
  });
  await act(async () => {
    await value.loadMoreHistory!();
  });
  expect(value.state.logs.some((l) => l.id === 'history_1')).toBe(true);
  server.grow();
  await server.remote.commit(
    createCommand(
      server.snapshot,
      { type: 'RESPONSABLES', nombres: ['Cambio remoto'] },
      'changed_remote',
      server.actor.uid,
    ),
  );
  await act(async () => {
    await value.retry();
  });
  expect(value.state.logs.some((l) => l.id === 'history_500')).toBe(true);
  await act(async () => {
    await value.loadMoreHistory!();
  });
  expect(value.state.logs.some((l) => l.id === 'history_350')).toBe(true);
  await act(async () => {
    tree.unmount();
  });
});
