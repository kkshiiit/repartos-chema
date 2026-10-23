import React from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { beforeEach, afterEach, expect, it, vi } from 'vitest';
import { FeedbackProvider, useFeedback } from '../src/context/FeedbackContext';
import type { ReminderOpen } from '../src/services/feedback/reminderNavigation';

const f = vi.hoisted(() => ({
  data: new Map<string, string>(),
  opens: undefined as undefined | ((value: ReminderOpen) => void),
  auth: { user: null as unknown, loading: false },
  inventory: {
    state: {
      obras: [
        {
          id: 'rental_a',
          clienteNombre: 'Cliente',
          direccion: 'Dirección',
          estadoProceso: 'ENTREGADO',
          fechaRetiroEstimada: '2030-01-05',
        },
      ],
    },
    ready: false,
  },
  navigation: undefined as undefined | { key: string },
  push: vi.fn(),
  ack: vi.fn(async () => undefined),
  native: {
    supported: true,
    permission: vi.fn(async () => true),
    scheduled: vi.fn(async () => [] as string[]),
    schedule: vi.fn(async () => undefined),
    cancel: vi.fn(async () => undefined),
  },
}));
vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: async (key: string) => f.data.get(key) ?? null,
    setItem: async (key: string, value: string) => {
      f.data.set(key, value);
    },
  },
}));
vi.mock('react-native', () => ({
  View: 'View',
  Text: 'Text',
  AppState: { addEventListener: () => ({ remove() {} }) },
}));
vi.mock('expo-router', () => ({
  router: { push: f.push },
  useRootNavigationState: () => f.navigation,
}));
vi.mock('../src/context/AuthContext', () => ({ useAuth: () => f.auth }));
vi.mock('../src/context/InventoryContext', () => ({ useInventory: () => f.inventory }));
vi.mock('../src/context/ThemeContext', () => ({ useTheme: () => ({ colors: {} }) }));
vi.mock('../src/components/ui', () => ({ Button: 'Button' }));
vi.mock('../src/services/feedback/notification-adapter', () => ({
  notificationAdapter: f.native,
  requestFeedbackPermission: async () => true,
  confirmationFeedback: async () => undefined,
  watchReminderOpens: (callback: typeof f.opens) => {
    f.opens = callback;
    return () => {
      f.opens = undefined;
    };
  },
  acknowledgeReminderOpen: f.ack,
}));
let view: ReactTestRenderer;
let feedback: ReturnType<typeof useFeedback>;
function Probe() {
  const value = useFeedback();
  React.useEffect(() => {
    feedback = value;
  }, [value]);
  return null;
}
async function render() {
  await act(async () => {
    view = create(React.createElement(FeedbackProvider, null, React.createElement(Probe)));
  });
}
async function refresh() {
  await act(async () => {
    view.update(React.createElement(FeedbackProvider, null, React.createElement(Probe)));
  });
}
beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  vi.clearAllMocks();
  f.data.clear();
  f.opens = undefined;
  f.auth = { user: null, loading: false };
  f.inventory.ready = false;
  f.navigation = undefined;
  f.native.permission.mockResolvedValue(true);
});
afterEach(async () => {
  if (view) await act(async () => view.unmount());
});
it('conserva el tap de arranque hasta sesión, inventario y navegación listos; no modifica inventario', async () => {
  await render();
  const original = JSON.stringify(f.inventory.state);
  await act(async () => f.opens!({ obraId: 'rental_a', responseKey: 'cold-1' }));
  expect(f.push).not.toHaveBeenCalled();
  expect(f.ack).not.toHaveBeenCalled();
  f.auth = { user: { uid: 'local' }, loading: false };
  await refresh();
  expect(f.push).not.toHaveBeenCalled();
  f.inventory.ready = true;
  await refresh();
  expect(f.push).not.toHaveBeenCalled();
  f.navigation = { key: 'ready' };
  await refresh();
  expect(f.push).toHaveBeenCalledExactlyOnceWith({
    pathname: '/obra/[id]',
    params: { id: 'rental_a' },
  });
  expect(f.ack).toHaveBeenCalledExactlyOnceWith('cold-1');
  expect(JSON.stringify(f.inventory.state)).toBe(original);
  await act(async () => f.opens!({ obraId: 'rental_a', responseKey: 'cold-1' }));
  expect(f.push).toHaveBeenCalledOnce();
});
it('abre una respuesta nueva en primer plano y explica un alquiler eliminado sin navegar', async () => {
  f.auth.user = { uid: 'local' };
  f.inventory.ready = true;
  f.navigation = { key: 'ready' };
  await render();
  await act(async () => f.opens!({ obraId: 'deleted', responseKey: 'missing-1' }));
  expect(f.push).not.toHaveBeenCalled();
  expect(JSON.stringify(view.toJSON())).toContain('ya no está');
  expect(f.ack).toHaveBeenCalledWith('missing-1');
  await act(async () => f.opens!({ obraId: 'rental_a', responseKey: 'live-2' }));
  expect(f.push).toHaveBeenCalledOnce();
});
it('persiste intención general al denegar permiso, informa error y no toca alquiler ni inventario', async () => {
  f.auth.user = { uid: 'local' };
  f.inventory.ready = true;
  f.navigation = { key: 'ready' };
  f.native.permission.mockResolvedValue(false);
  await render();
  const original = JSON.stringify(f.inventory.state);
  let result: boolean | undefined;
  await act(async () => {
    result = await feedback.configureGeneral({
      enabled: true,
      time: '08:00',
      offsets: [3, 2, 1, 0],
    });
  });
  expect(result).toBe(false);
  expect(feedback.state.globalPolicy.enabled).toBe(true);
  expect(feedback.error).toContain('permiso');
  expect(Object.values(feedback.state.reminders)).toHaveLength(4);
  expect(Object.values(feedback.state.reminders).every((r) => r.status === 'pending')).toBe(true);
  expect(f.native.schedule).not.toHaveBeenCalled();
  expect(JSON.stringify(f.inventory.state)).toBe(original);
});

it('el aviso de un tap frío eliminado no se borra al terminar la reconciliación automática', async () => {
  await render();
  await act(async () => f.opens!({ obraId: 'deleted', responseKey: 'cold-missing' }));
  let finish!: () => void;
  const pending = new Promise<string[]>((resolve) => {
    finish = () => resolve([]);
  });
  f.native.scheduled.mockImplementationOnce(() => pending);
  f.auth.user = { uid: 'local' };
  f.inventory.ready = true;
  f.navigation = { key: 'ready' };
  await refresh();
  expect(JSON.stringify(view.toJSON())).toContain('ya no está');
  await act(async () => {
    finish();
  });
  expect(JSON.stringify(view.toJSON())).toContain('ya no está');
  expect(f.push).not.toHaveBeenCalled();
});
