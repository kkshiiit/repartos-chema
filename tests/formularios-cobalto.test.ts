import React from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { beforeEach, expect, it, vi } from 'vitest';
import { LoadEditor } from '../src/components/LoadEditor';
import { ObraForm } from '../src/components/ObraForm';
import { OperationForm } from '../src/components/OperationForm';
import { seed } from '../src/data/seed';
import { light } from '../src/theme/tokens';

const mocks = vi.hoisted(() => ({
  dispatch: vi.fn(),
  notifySuccess: vi.fn(),
  replace: vi.fn(),
  navigate: vi.fn(),
  prevent: vi.fn(),
  state: {},
}));
vi.mock('../src/context/FeedbackContext', () => ({
  useFeedback: () => ({ notifyError: vi.fn(), notifySuccess: mocks.notifySuccess }),
}));
vi.mock('react-native', () => ({ View: 'View', Text: 'Text', Pressable: 'Pressable' }));
vi.mock('lucide-react-native', () => ({
  Layers: 'Layers',
  ChevronDown: 'ChevronDown',
  ChevronUp: 'ChevronUp',
}));
vi.mock('expo-router', () => ({
  router: { replace: mocks.replace },
  useNavigation: () => ({ dispatch: mocks.navigate }),
}));
vi.mock('expo-router/react-navigation', () => ({ usePreventRemove: mocks.prevent }));
vi.mock('../src/context/AuthContext', () => ({ useAuth: () => ({ user: { role: 'ADMIN' } }) }));
vi.mock('../src/context/InventoryContext', () => ({
  makeId: () => 'new_form',
  useInventory: () => ({ state: mocks.state, dispatch: mocks.dispatch }),
}));
vi.mock('../src/components/SmartCounter', () => ({
  SmartCounter: (props: object) => React.createElement('Counter', props),
}));
vi.mock('../src/components/ui', () => {
  const host = (name: string) => {
    function Host(props: { children?: React.ReactNode }) {
      return React.createElement(name, props, props.children);
    }
    return Host;
  };
  return {
    Button: host('Button'),
    Chip: host('Chip'),
    Field: host('Field'),
    Notice: host('Notice'),
    Select: host('Select'),
    Screen: ({ children, footer }: { children: React.ReactNode; footer?: React.ReactNode }) =>
      React.createElement('Screen', {}, children, footer),
    Sheet: ({ visible, children }: { visible: boolean; children: React.ReactNode }) =>
      visible ? React.createElement('Sheet', {}, children) : null,
    useUI: () => ({
      C: light,
      s: {
        divider: {},
        wrap: {},
        row: {},
        card: {},
        body: {},
        muted: {},
        h2: {},
        label: {},
        grow: {},
        title: {},
      },
    }),
    usePanelChanges: () => ({ markDirty: () => {} }),
  };
});
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
let view: ReactTestRenderer;
const control = (label: string) =>
  view.root.findAll((n) => typeof n.type === 'string' && n.props.label === label)[0]!;
const press = async (label: string) => {
  await act(async () => {
    await view.root
      .findAll(
        (n) =>
          typeof n.type === 'string' &&
          n.props.label === label &&
          typeof n.props.onPress === 'function',
      )[0]!
      .props.onPress();
  });
};
const fill = async (label: string, value: string) => {
  await act(async () => control(label).props.onChangeText(value));
};
async function client() {
  await fill('Nombre del cliente', 'Cliente de prueba');
  await fill('Dirección', 'Calle sintética 123');
  await fill('Barrio / localidad', 'Zona sintética');
  await fill('Observaciones', 'Conservar esta nota');
}
beforeEach(() => {
  vi.resetAllMocks();
  mocks.state = seed();
  mocks.dispatch.mockResolvedValue(undefined);
});
it('Cliente/Carga/Revisar conserva valores y no persiste ni mueve stock al avanzar o volver', async () => {
  await act(async () => {
    view = create(React.createElement(ObraForm));
  });
  await client();
  await press('Continuar a carga');
  await press('Agregar material');
  await press('Volver a cliente');
  expect(control('Nombre del cliente').props.value).toBe('Cliente de prueba');
  expect(control('Observaciones').props.value).toBe('Conservar esta nota');
  await press('Continuar a carga');
  expect(view.root.findAllByType('Counter' as React.ElementType)[0]!.props.value).toBe(1);
  await press('Revisar alquiler');
  expect(mocks.dispatch).not.toHaveBeenCalled();
  expect(mocks.notifySuccess).not.toHaveBeenCalled();
  await press('Guardar alquiler');
  expect(mocks.dispatch.mock.calls.map(([a]) => a.type)).toEqual(['CREATE_OBRA', 'SET_LOAD']);
  expect(mocks.replace).toHaveBeenCalledWith('/obra/new_form');
  expect(mocks.notifySuccess).toHaveBeenCalledExactlyOnceWith('Alquiler guardado.');
  await act(async () => view.unmount());
});
it('un doble toque guarda una sola vez y espera persistencia para navegar', async () => {
  let resolve!: () => void;
  mocks.dispatch.mockImplementationOnce(
    () =>
      new Promise<void>((done) => {
        resolve = done;
      }),
  );
  await act(async () => {
    view = create(React.createElement(ObraForm));
  });
  await client();
  await press('Continuar a carga');
  await press('Revisar alquiler');
  const save = control('Guardar alquiler').props.onPress;
  let first!: Promise<void>;
  await act(async () => {
    first = save();
    await save();
  });
  expect(mocks.dispatch).toHaveBeenCalledTimes(1);
  expect(mocks.replace).not.toHaveBeenCalled();
  expect(mocks.notifySuccess).not.toHaveBeenCalled();
  await act(async () => {
    resolve();
    await first;
  });
  expect(mocks.replace).toHaveBeenCalledOnce();
  await act(async () => view.unmount());
});
it('error de carga conserva borrador e identidad; reintenta sin crear ni guardar datos otra vez', async () => {
  mocks.dispatch
    .mockResolvedValueOnce(undefined)
    .mockRejectedValueOnce(new Error('Disco sin espacio'))
    .mockResolvedValueOnce(undefined);
  await act(async () => {
    view = create(React.createElement(ObraForm));
  });
  await client();
  await press('Continuar a carga');
  await press('Agregar material');
  await press('Revisar alquiler');
  await press('Guardar alquiler');
  expect(mocks.replace).not.toHaveBeenCalled();
  expect(mocks.notifySuccess).not.toHaveBeenCalled();
  expect(
    view.root.findAll(
      (n) => typeof n.type === 'string' && n.props.text?.includes('Disco sin espacio'),
    ).length,
  ).toBe(1);
  await press('Guardar alquiler');
  expect(mocks.dispatch.mock.calls.map(([a]) => a.type)).toEqual([
    'CREATE_OBRA',
    'SET_LOAD',
    'SET_LOAD',
  ]);
  expect(mocks.dispatch.mock.calls[2]![0].expectedVersion).toBe(1);
  await act(async () => view.unmount());
});
it('operación conserva responsable y evita dos retiros mientras persiste', async () => {
  const state = seed();
  mocks.state = state;
  let resolve!: () => void;
  mocks.dispatch.mockImplementationOnce(
    () =>
      new Promise<void>((done) => {
        resolve = done;
      }),
  );
  const done = vi.fn();
  await act(async () => {
    view = create(
      React.createElement(OperationForm, { obra: state.obras[0]!, mode: 'retiro', onDone: done }),
    );
  });
  await press(state.responsables[0]!);
  const confirm = control('Confirmar retiro').props.onPress;
  let first!: Promise<void>;
  await act(async () => {
    first = confirm();
    await confirm();
  });
  expect(mocks.dispatch).toHaveBeenCalledTimes(1);
  expect(mocks.dispatch.mock.calls[0]![0].responsables).toEqual([state.responsables[0]]);
  expect(done).not.toHaveBeenCalled();
  expect(mocks.notifySuccess).not.toHaveBeenCalled();
  await act(async () => {
    resolve();
    await first;
  });
  expect(done).toHaveBeenCalledOnce();
  expect(mocks.notifySuccess).toHaveBeenCalledExactlyOnceWith('Retiro registrado.');
  await act(async () => view.unmount());
});

it('editar conserva coordenadas y medidas históricas sin volver a escribir una carga entregada', async () => {
  const obra = { ...seed().obras[0]!, coordenadas: { lat: -34.6, lng: -58.4 } };
  await act(async () => {
    view = create(React.createElement(ObraForm, { obra }));
  });
  await fill('Observaciones', 'Nota editada');
  await press('Continuar a carga');
  await press('Revisar alquiler');
  await press('Guardar alquiler');
  expect(mocks.dispatch).toHaveBeenCalledTimes(1);
  expect(mocks.dispatch.mock.calls[0]![0]).toMatchObject({
    type: 'UPDATE_OBRA',
    obra: { coordenadas: obra.coordenadas, observaciones: 'Nota editada' },
    expectedVersion: obra.version || 0,
  });
  await act(async () => view.unmount());
});
it('salir con cambios permite seguir editando o descartarlos explícitamente', async () => {
  await act(async () => {
    view = create(React.createElement(ObraForm));
  });
  await fill('Nombre del cliente', 'Borrador conservado');
  const [dirty, callback] = mocks.prevent.mock.calls.at(-1)!;
  expect(dirty).toBe(true);
  const action = { type: 'GO_BACK' };
  await act(async () => callback({ data: { action } }));
  await press('Seguir editando');
  expect(control('Nombre del cliente').props.value).toBe('Borrador conservado');
  expect(mocks.navigate).not.toHaveBeenCalled();
  await act(async () => callback({ data: { action } }));
  await press('Descartar cambios');
  expect(mocks.navigate).toHaveBeenCalledWith(action);
  expect(mocks.dispatch).not.toHaveBeenCalled();
  expect(mocks.notifySuccess).not.toHaveBeenCalled();
  await act(async () => view.unmount());
});

it('carga avisa éxito una vez después de persistir y conserva el editor ante fallo', async () => {
  const obra = seed().obras[4]!;
  const done = vi.fn();
  mocks.dispatch
    .mockRejectedValueOnce(new Error('No se pudo escribir'))
    .mockResolvedValueOnce(undefined);
  await act(async () => {
    view = create(React.createElement(LoadEditor, { obra, onDone: done }));
  });
  const saveLabel = view.root.findAll(
    (n) => typeof n.type === 'string' && ['Guardar carga', 'Cargar igual'].includes(n.props.label),
  )[0]!.props.label;
  await press(saveLabel);
  expect(done).not.toHaveBeenCalled();
  expect(mocks.notifySuccess).not.toHaveBeenCalled();
  await press(saveLabel);
  expect(done).toHaveBeenCalledOnce();
  expect(mocks.notifySuccess).toHaveBeenCalledExactlyOnceWith(
    'Carga guardada. Las existencias se mueven al entregar.',
  );
  await act(async () => view.unmount());
});

it.each([undefined, null, ''])(
  'editar una fecha ausente (%s) pide completarla y no inventa hoy',
  async (date) => {
    const obra = { ...seed().obras[0]! };
    Reflect.set(obra, 'fechaRetiroEstimada', date);
    await act(async () => {
      view = create(React.createElement(ObraForm, { obra }));
    });
    const input = view.root.findAll(
      (node) => node.type === 'input' && node.props['aria-label'] === 'Alquilado hasta',
    )[0]!;
    expect(input.props.defaultValue).toBe('');
    await press('Continuar a carga');
    expect(mocks.dispatch).not.toHaveBeenCalled();
    expect(input.props['aria-invalid']).toBe(true);
    expect(view.root.findAll((node) => node.props.role === 'alert').length).toBeGreaterThan(0);
    await act(async () => view.unmount());
  },
);
