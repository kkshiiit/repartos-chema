/* eslint-disable react/no-children-prop -- Sheet requires children in its typed props. */
import React from 'react';
import { act, create } from 'react-test-renderer';
import { beforeEach, expect, it, vi } from 'vitest';
import { Button, Field, Sheet, usePanelChanges } from '../src/components/ui';
import { light } from '../src/theme/tokens';

const mocks = vi.hoisted(() => ({ motion: false, close: vi.fn(), save: vi.fn() }));
vi.mock('../src/context/ThemeContext', () => ({
  useTheme: () => ({ colors: light, mode: 'light', motionEnabled: mocks.motion }),
}));
vi.mock('../src/context/AuthContext', () => ({ useAuth: () => ({}) }));
vi.mock('../src/context/InventoryContext', () => ({ useInventory: () => ({}) }));
vi.mock('../src/services/firebase', () => ({ DATA_MODE: 'demo' }));
vi.mock('../src/services/localMode', () => ({ LOCAL_ONLY: true }));
vi.mock('../src/services/files', () => ({ pickBackup: vi.fn() }));
vi.mock('../src/components/ThemeToggle', () => ({ ThemeToggle: () => null }));
vi.mock('../src/components/AuroraBackground', () => ({ AuroraBackground: () => null }));
vi.mock('expo-router', () => ({ router: {} }));
vi.mock('lucide-react-native', () => ({
  ArrowLeft: 'Icon',
  Check: 'Icon',
  ChevronDown: 'Icon',
  CloudOff: 'Icon',
  Settings: 'Icon',
  Package: 'Icon',
  RefreshCw: 'Icon',
  X: 'Icon',
}));
vi.mock('react-native-safe-area-context', () => ({
  SafeAreaView: 'SafeAreaView',
  useSafeAreaInsets: () => ({ top: 0, bottom: 0 }),
}));
vi.mock('react-native', () => {
  class Value {
    value: number;
    constructor(value: number) {
      this.value = value;
    }
    setValue(value: number) {
      this.value = value;
    }
    stopAnimation() {}
    interpolate() {
      return this.value;
    }
  }
  return {
    View: 'View',
    Text: 'Text',
    Pressable: 'Pressable',
    TextInput: 'TextInput',
    ScrollView: 'ScrollView',
    KeyboardAvoidingView: 'KeyboardAvoidingView',
    ActivityIndicator: 'ActivityIndicator',
    Modal: ({ visible, children, ...props }: React.PropsWithChildren<{ visible: boolean }>) =>
      visible ? React.createElement('Modal', props, children) : null,
    Platform: { OS: 'android' },
    StyleSheet: { create: (s: unknown) => s, flatten: (s: unknown) => s, absoluteFill: {} },
    useWindowDimensions: () => ({ width: 390, height: 844, fontScale: 1 }),
    PanResponder: { create: (handlers: unknown) => ({ panHandlers: handlers }) },
    Easing: { out: () => undefined, cubic: undefined },
    Animated: { Value, View: 'AnimatedView', timing: () => ({ start: () => {}, stop: () => {} }) },
  };
});
beforeEach(() => {
  vi.clearAllMocks();
  mocks.motion = false;
});
function Cancel() {
  const { requestClose } = usePanelChanges();
  return React.createElement(Button, { label: 'Cancelar', onPress: requestClose });
}
async function renderPanel(protectChanges = true, busy = false) {
  let view!: ReturnType<typeof create>;
  await act(async () => {
    view = create(
      React.createElement(Sheet, {
        visible: true,
        title: 'Editar',
        onClose: mocks.close,
        protectChanges,
        busy,
        children: React.createElement(
          React.Fragment,
          null,
          React.createElement(Field, {
            label: 'Nombre',
            value: 'Original',
            onChangeText: () => {},
          }),
          React.createElement(Cancel),
        ),
      }),
    );
  });
  return view;
}
function host(view: ReturnType<typeof create>, label: string) {
  return view.root
    .findAllByType('Pressable' as never)
    .find((node) => node.props.accessibilityLabel === label)!;
}
it('cierra sin cambios por X, Atrás, fondo y arrastre con la misma política', async () => {
  for (const method of ['x', 'back', 'backdrop', 'drag']) {
    mocks.close.mockClear();
    const view = await renderPanel();
    await act(async () => {
      if (method === 'x') host(view, 'Cerrar').props.onPress();
      if (method === 'back') view.root.findByType('Modal' as never).props.onRequestClose();
      if (method === 'backdrop') host(view, 'Cerrar panel').props.onPress();
      if (method === 'drag')
        view.root
          .findByProps({ testID: 'panel-drag-handle' })
          .props.onPanResponderRelease({}, { dy: 80 });
    });
    expect(mocks.close).toHaveBeenCalledOnce();
    await act(async () => view.unmount());
  }
});
it('conserva cambios al cerrar o seguir editando; solo el descarte explícito cierra', async () => {
  const view = await renderPanel();
  await act(async () => view.root.findByType('TextInput' as never).props.onChangeText('Editado'));
  await act(async () => host(view, 'Cancelar').props.onPress());
  expect(mocks.close).not.toHaveBeenCalled();
  expect(host(view, 'Descartar cambios')).toBeDefined();
  await act(async () => host(view, 'Seguir editando').props.onPress());
  expect(mocks.close).not.toHaveBeenCalled();
  await act(async () => host(view, 'Cerrar panel').props.onPress());
  await act(async () => host(view, 'Descartar cambios').props.onPress());
  expect(mocks.close).toHaveBeenCalledOnce();
  await act(async () => view.unmount());
});
it('bloquea cierre mientras guarda y quita Modal inmediatamente cuando visible es falso', async () => {
  const view = await renderPanel(true, true);
  await act(async () => view.root.findByType('Modal' as never).props.onRequestClose());
  expect(mocks.close).not.toHaveBeenCalled();
  await act(async () =>
    view.update(
      React.createElement(Sheet, {
        visible: false,
        title: 'Editar',
        onClose: mocks.close,
        children: 'Contenido',
      }),
    ),
  );
  expect(view.root.findAllByType('Modal' as never)).toHaveLength(0);
  await act(async () => view.unmount());
});
it('una promesa pendiente ejecuta una sola operación ante dos pulsaciones inmediatas', async () => {
  let finish!: () => void;
  mocks.save.mockImplementation(
    () =>
      new Promise<void>((resolve) => {
        finish = resolve;
      }),
  );
  let view!: ReturnType<typeof create>;
  await act(async () => {
    view = create(React.createElement(Button, { label: 'Guardar', onPress: mocks.save }));
  });
  await act(async () => {
    const press = host(view, 'Guardar').props.onPress;
    press();
    press();
  });
  expect(mocks.save).toHaveBeenCalledOnce();
  expect(host(view, 'Guardar').props.accessibilityState.busy).toBe(true);
  await act(async () => finish());
  expect(host(view, 'Guardar').props.disabled).toBe(false);
  await act(async () => view.unmount());
});
it('un guardado iniciado por el contenido bloquea Atrás hasta que termina', async () => {
  function SavingContent() {
    const panel = usePanelChanges();
    return React.createElement(
      React.Fragment,
      null,
      React.createElement(Button, {
        label: 'Empezar guardado',
        onPress: () => panel.setBusy(true),
      }),
      React.createElement(Button, {
        label: 'Terminar guardado',
        onPress: () => panel.setBusy(false),
      }),
    );
  }
  let view!: ReturnType<typeof create>;
  await act(async () => {
    view = create(
      React.createElement(Sheet, {
        visible: true,
        title: 'Guardar',
        onClose: mocks.close,
        children: React.createElement(SavingContent),
      }),
    );
  });
  await act(async () => {
    await host(view, 'Empezar guardado').props.onPress();
  });
  await act(async () => {
    view.root.findByType('Modal' as never).props.onRequestClose();
  });
  expect(mocks.close).not.toHaveBeenCalled();
  await act(async () => {
    await host(view, 'Terminar guardado').props.onPress();
  });
  await act(async () => {
    view.root.findByType('Modal' as never).props.onRequestClose();
  });
  expect(mocks.close).toHaveBeenCalledOnce();
  await act(async () => view.unmount());
});
