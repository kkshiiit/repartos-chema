import React from 'react';
import { readFileSync } from 'node:fs';
import { beforeEach, expect, it, vi } from 'vitest';
import { create, act } from 'react-test-renderer';
import Settings from '../app/configuracion';
const mocks = vi.hoisted(() => ({ pick: vi.fn(), restore: vi.fn(), undoRestore: vi.fn() }));
vi.mock('../src/components/FeedbackSettings', () => ({ FeedbackSettings: () => null }));
vi.mock('react-native', () => ({ View: 'View', Text: 'Text', Pressable: 'Pressable' }));
vi.mock('lucide-react-native', () =>
  Object.fromEntries(
    [
      'Bell',
      'BookOpen',
      'FileClock',
      'FileText',
      'Info',
      'Layers',
      'MapPin',
      'Move',
      'Sun',
      'UserRound',
      'UsersRound',
      'ChevronRight',
    ].map((name) => [name, 'Icon']),
  ),
);
vi.mock('../src/services/depotSettings', () => ({
  loadDepot: vi.fn(async () => ({
    nombre: 'Depósito de prueba',
    direccion: 'Dirección de prueba',
  })),
}));
vi.mock('expo-router', () => ({ router: { push: vi.fn() } }));
vi.mock('../src/components/DepotSettings', () => ({ DepotSettings: () => null }));
vi.mock('../src/components/TeamSettings', () => ({ TeamSettings: () => null }));
vi.mock('../src/components/WelcomeProvider', () => ({
  useWelcome: () => ({ openWelcome: vi.fn() }),
}));
vi.mock('../src/context/ThemeContext', () => ({
  useTheme: () => ({ preference: 'system', setPreference: vi.fn() }),
}));
vi.mock('../src/context/AuthContext', () => ({ useAuth: () => ({ user: { role: 'ADMIN' } }) }));
vi.mock('../src/context/InventoryContext', () => ({
  useInventory: () => ({
    state: { obras: [], materiales: [], responsables: [] },
    restore: mocks.restore,
    undoRestore: mocks.undoRestore,
  }),
}));
vi.mock('../src/services/firebase', () => ({ DATA_MODE: 'demo' }));
vi.mock('../src/services/localMode', () => ({ LOCAL_ONLY: true }));
vi.mock('../src/services/files', () => ({ pickBackup: mocks.pick }));
vi.mock('../src/services/photoCache', () => ({ photoBytes: vi.fn(), storePhoto: vi.fn() }));
vi.mock('../src/services/notifications', () => ({ enableNotifications: vi.fn() }));
vi.mock('../src/components/ui', () => ({
  Screen: 'Screen',
  Button: 'Button',
  Chip: 'Chip',
  ConfirmButton: 'ConfirmButton',
  Field: 'Field',
  Notice: 'Notice',
  Sheet: ({ visible, children }: { visible: boolean; children: React.ReactNode }) =>
    visible ? children : null,
  useUI: () => ({ s: {}, C: { panel: '#fff', hairline: '#ddd', muted: '#555' } }),
  usePanelChanges: () => ({ resetDirty: vi.fn() }),
}));
const raw = readFileSync(new URL('./fixtures/whatsapp-five.json', import.meta.url), 'utf8');
beforeEach(() => {
  vi.clearAllMocks();
  mocks.pick.mockResolvedValue(raw);
  mocks.restore.mockResolvedValue(undefined);
});
it('al elegir copia abre revisión con cinco alquileres, sin anunciar guardado ni restaurar antes de confirmar', async () => {
  let view: ReturnType<typeof create>;
  await act(async () => {
    view = create(React.createElement(Settings));
  });
  const button = (name: string) =>
    view!.root.findAllByType('Button' as never).find((b) => b.props.label === name)!;
  expect(button('Elegir copia')).toBeUndefined();
  await act(async () => {
    view!.root.findByProps({ accessibilityLabel: 'Copias y restauración' }).props.onPress();
  });
  await act(async () => {
    await button('Elegir copia').props.onPress();
  });
  expect(view!.root.findAllByType('Notice' as never).map((n) => n.props.text)).toContain(
    'Archivo validado: 5 alquileres y 10 materiales.',
  );
  expect(mocks.restore).not.toHaveBeenCalled();
  expect(button('Confirmar importación')).toBeDefined();
  await act(async () => {
    await button('Confirmar importación').props.onPress();
  });
  expect(mocks.restore).toHaveBeenCalledOnce();
  expect(mocks.restore).toHaveBeenCalledWith(raw);
  expect(view!.root.findAllByType('Notice' as never).map((n) => n.props.text)).toContain(
    'Importación completada: 5 alquileres guardados en este celular.',
  );
  await act(async () => view!.unmount());
});
it('cancelar no restaura; una selección inválida posterior no permite importar la copia anterior', async () => {
  let view: ReturnType<typeof create>;
  await act(async () => {
    view = create(React.createElement(Settings));
  });
  const button = (name: string) =>
    view!.root.findAllByType('Button' as never).find((b) => b.props.label === name);
  expect(button('Elegir copia')).toBeUndefined();
  await act(async () => {
    view!.root.findByProps({ accessibilityLabel: 'Copias y restauración' }).props.onPress();
  });
  await act(async () => {
    await button('Elegir copia')!.props.onPress();
  });
  expect(button('Cancelar importación')).toBeDefined();
  await act(async () => {
    await button('Cancelar importación')!.props.onPress();
  });
  expect(button('Confirmar importación')).toBeUndefined();
  expect(mocks.restore).not.toHaveBeenCalled();
  mocks.pick.mockResolvedValue('{"format":');
  await act(async () => {
    await button('Elegir copia')!.props.onPress();
  });
  expect(button('Confirmar importación')).toBeUndefined();
  expect(mocks.restore).not.toHaveBeenCalled();
  expect(
    view!.root
      .findAllByType('Notice' as never)
      .some((n) => /JSON está incompleto/.test(n.props.text)),
  ).toBe(true);
  await act(async () => view!.unmount());
});
