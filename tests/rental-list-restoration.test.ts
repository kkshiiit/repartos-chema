import React from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { beforeEach, expect, it, vi } from 'vitest';
import Home from '../app/(tabs)/alquileres';
import { rememberedRentalList, rememberRentalList } from '../src/services/rentalListPreferences';
import { emptyState } from '../src/data/seed';
const mocks = vi.hoisted(() => ({
  uid: '',
  data: new Map<string, string>(),
  scrollTo: vi.fn(),
}));
vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: async (key: string) => mocks.data.get(key) ?? null,
    setItem: async (key: string, value: string) => {
      mocks.data.set(key, value);
    },
  },
}));
vi.mock('react-native', () => ({ View: 'View', ActivityIndicator: 'ActivityIndicator', Pressable: 'Pressable', Text: 'Text' }));
vi.mock('lucide-react-native', () => new Proxy({}, { get: (_t, k) => (k === '__esModule' ? false : k === 'then' ? undefined : String(k)), has: () => true }));
vi.mock('expo-router', () => ({ router: { push: vi.fn() } }));
vi.mock('../src/context/InventoryContext', () => ({
  useInventory: () => ({
    state: emptyState(),
    workspaceKey: 'local',
    ready: true,
    queue: [],
  }),
}));
vi.mock('../src/context/AuthContext', () => ({
  useAuth: () => ({ user: { uid: mocks.uid, role: 'ADMIN' } }),
}));
vi.mock('../src/components/ui', () => ({
  useUI: () => ({ C: { text: '#000' }, s: {} }),
  Button: 'Button',
  Empty: 'Empty',
  Notice: 'Notice',
  Select: 'Select',
  Sheet: 'Sheet',
  Screen: 'Screen',
}));
vi.mock('../src/components/CardObra', () => ({ CardObra: 'CardObra' }));
vi.mock('../src/components/ListStructure', () => ({
  SearchToolbar: 'SearchToolbar',
  SectionHeading: 'SectionHeading',
  Segmented: 'Segmented',
}));
vi.mock('../src/hooks/useBusinessClock', () => ({
  useBusinessClock: () => new Date('2026-10-27T15:00:00Z'),
}));
vi.mock('../src/components/DataList', () => ({
  DataList: (props: { ref: React.Ref<unknown> }) => {
    React.useImperativeHandle(props.ref, () => ({ scrollToOffset: mocks.scrollTo }));
    return React.createElement('DataList', { ...props, ref: undefined });
  },
}));
let tree: ReactTestRenderer;
const scroll = (y: number, contentHeight = 3000) => ({
  nativeEvent: {
    contentOffset: { x: 0, y },
    contentSize: { width: 390, height: contentHeight },
    layoutMeasurement: { width: 390, height: 400 },
  },
});
beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  mocks.data.clear();
  mocks.scrollTo.mockReset();
  mocks.uid = crypto.randomUUID();
  rememberRentalList(`local:${mocks.uid}`, {
    schema: 1,
    query: '',
    status: 'TODAS',
    zone: 'TODAS',
    scroll: 600,
  });
});
it('un evento inicial cero no reemplaza el desplazamiento pendiente; sólo se guarda el confirmado', async () => {
  await act(async () => {
    tree = create(React.createElement(Home));
  });
  const props = tree.root.findByType('DataList').props;
  mocks.scrollTo.mockImplementation(() => props.onScroll(scroll(0)));
  await act(async () => props.onLoad());
  expect(rememberedRentalList(`local:${mocks.uid}`)?.preferences.scroll).toBe(600);
  await act(async () => props.onScroll(scroll(598)));
  expect(rememberedRentalList(`local:${mocks.uid}`)?.preferences.scroll).toBe(598);
  await act(async () => tree.unmount());
  expect(JSON.parse([...mocks.data.values()][0]).scroll).toBe(598);
});
it('restauración acepta el límite real cuando la lista volvió con menos contenido', async () => {
  await act(async () => {
    tree = create(React.createElement(Home));
  });
  const props = tree.root.findByType('DataList').props;
  await act(async () => props.onLoad());
  await act(async () => props.onScroll(scroll(0, 700)));
  expect(rememberedRentalList(`local:${mocks.uid}`)?.preferences.scroll).toBe(600);
  await act(async () => props.onScroll(scroll(300, 700)));
  expect(rememberedRentalList(`local:${mocks.uid}`)?.preferences.scroll).toBe(300);
  await act(async () => tree.unmount());
});
it('cambiar filtros cancela la restauración anterior y permite guardar el nuevo inicio', async () => {
  await act(async () => {
    tree = create(React.createElement(Home));
  });
  const props = tree.root.findByType('DataList').props;
  await act(async () => props.onLoad());
  await act(async () => tree.root.findByType('SearchToolbar').props.onChange('Otra zona'));
  await act(async () => props.onScroll(scroll(0)));
  expect(rememberedRentalList(`local:${mocks.uid}`)?.preferences).toMatchObject({
    query: 'Otra zona',
    scroll: 0,
  });
  await act(async () => tree.unmount());
});
