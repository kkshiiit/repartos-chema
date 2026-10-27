import React from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { expect, it, vi } from 'vitest';
import { PublishedRoutePanel } from '../src/components/PublishedRoutePanel';
const fixture = vi.hoisted(() => ({
  offline: false,
  values: new Map<string, string>(),
  plan: {
    revision: 1,
    route: { schema: 1, ids: [], tasks: {}, assignments: {} },
    userId: '11111111-1111-4111-8111-111111111111',
    updatedAt: '2026-10-27T12:00:00Z',
  },
}));
const session = vi.hoisted(() => ({
  active: true,
  spaceId: 'space',
  actor: { uid: 'one' },
  remote: {
    request: async (type: string) => {
      if (fixture.offline) throw Error('Sin conexión');
      if (type === 'get-route') return fixture.plan;
      if (type === 'members') return [];
      if (type === 'route-history') return [fixture.plan];
      throw Error('Unexpected request');
    },
    snapshot: async () => {
      if (fixture.offline) throw Error('Sin conexión');
      return { tasks: {} };
    },
  },
}));
vi.mock('react-native', () => ({ View: 'View', Text: 'Text' }));
vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: async (key: string) => fixture.values.get(key) ?? null,
    setItem: async (key: string, value: string) => {
      fixture.values.set(key, value);
    },
  },
}));
vi.mock('../src/context/SharedContext', () => ({ useSharedSession: () => session }));
vi.mock('../src/components/ui', () => ({
  Button: 'Button',
  Notice: 'Notice',
  Select: 'Select',
  Sheet: 'Sheet',
  useUI: () => ({ s: {} }),
}));
it('reopening after connection loss resets online state, confirmation and publish eligibility', async () => {
  let tree!: ReactTestRenderer;
  const props = {
    visible: true,
    stops: [],
    ids: [],
    pending: false,
    ready: true,
    onClose: () => {},
    onLoad: async () => {},
  };
  await act(async () => {
    tree = create(React.createElement(PublishedRoutePanel, props));
  });
  expect(JSON.stringify(tree.toJSON())).toContain('Recibido del equipo');
  expect(JSON.stringify(tree.toJSON())).toContain('Historial de publicaciones');
  expect(JSON.stringify(tree.toJSON())).not.toContain(fixture.plan.userId);
  const button = (label: string) =>
    tree.root.findAllByType('Button' as never).find((node) => node.props.label === label)!;
  await act(async () => {
    button('Cargar plan a mi borrador').props.onPress();
  });
  expect(JSON.stringify(tree.toJSON())).toContain('Confirmar carga al borrador');
  await act(async () => {
    tree.update(React.createElement(PublishedRoutePanel, { ...props, visible: false }));
  });
  fixture.offline = true;
  await act(async () => {
    tree.update(React.createElement(PublishedRoutePanel, props));
  });
  expect(JSON.stringify(tree.toJSON())).not.toContain('Recibido del equipo');
  expect(JSON.stringify(tree.toJSON())).not.toContain('Confirmar carga al borrador');
  expect(JSON.stringify(tree.toJSON())).toContain('Copia local para consulta');
  expect(button('Publicar mi borrador para el equipo').props.disabled).toBe(true);
  await act(async () => tree.unmount());
});
