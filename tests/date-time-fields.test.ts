/* eslint-disable import/no-duplicates -- Both platform implementations are intentionally exercised. */
import React, { useState } from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { CalendarField, TimeField } from '../src/components/DateTimeFields';
import {
  CalendarField as NativeCalendarField,
  TimeField as NativeTimeField,
} from '../src/components/DateTimeFields.native';
import { light } from '../src/theme/tokens';

const mocks = vi.hoisted(() => ({ open: vi.fn(), markDirty: vi.fn(), os: 'android' }));
vi.mock('react-native', () => ({
  View: 'View',
  Text: 'Text',
  Pressable: 'Pressable',
  TextInput: 'TextInput',
  Platform: {
    get OS() {
      return mocks.os;
    },
  },
}));
vi.mock('@react-native-community/datetimepicker', () => ({
  default: 'DateTimePicker',
  DateTimePickerAndroid: { open: mocks.open, dismiss: vi.fn() },
}));
vi.mock('../src/components/ui', () => ({
  useUI: () => ({ C: light, s: { label: {}, input: {}, muted: {}, error: {}, row: {} } }),
  usePanelChanges: () => ({ markDirty: mocks.markDirty }),
  Button: 'Button',
  Sheet: ({ visible, children }: { visible: boolean; children?: React.ReactNode }) =>
    visible ? React.createElement('Sheet', {}, children) : null,
}));
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
let view: ReactTestRenderer | undefined;
beforeEach(() => {
  vi.clearAllMocks();
  mocks.os = 'android';
});
afterEach(async () => {
  if (view) await act(async () => view!.unmount());
  view = undefined;
});

async function render(component: React.ReactElement) {
  await act(async () => {
    view = create(component);
  });
  return view!;
}

it('web expone calendario asociado a su etiqueta y conserva la fecha civil ISO', async () => {
  const onChange = vi.fn();
  const tree = await render(
    React.createElement(CalendarField, {
      label: 'Alquilado hasta',
      value: '2028-02-29',
      onChange,
    }),
  );
  const input = tree.root.findByType('input');
  expect(input.props.type).toBe('date');
  expect(input.props.defaultValue).toBe('2028-02-29');
  expect(tree.root.findByType('label').props.htmlFor).toBe(input.props.id);
  await act(async () =>
    input.props.onChange({
      currentTarget: {
        value: '2028-03-01',
        validity: { badInput: false },
      },
    }),
  );
  expect(onChange).toHaveBeenCalledExactlyOnceWith('2028-03-01');
});

it('web conserva el input sin controlar e invalida la fecha al editar un segmento incompleto', async () => {
  const onChange = vi.fn();
  const tree = await render(
    React.createElement(CalendarField, {
      label: 'Entrega',
      value: '2028-02-29',
      onChange,
    }),
  );
  const input = tree.root.findByType('input');
  expect(input.props.value).toBeUndefined();
  await act(async () =>
    input.props.onChange({
      currentTarget: {
        value: '',
        validity: { badInput: true },
      },
    }),
  );
  expect(onChange).toHaveBeenCalledExactlyOnceWith('');
});

it('web no reemplaza los segmentos parciales cuando el padre recibe el borrador vacío', async () => {
  const assignments: string[] = [];
  const browser = {
    type: 'date',
    get value() {
      return '';
    },
    set value(next: string) {
      assignments.push(next);
    },
    validity: { badInput: true },
  };
  function Harness() {
    const [value, onChange] = useState('2028-02-29');
    return React.createElement(CalendarField, { label: 'Entrega', value, onChange });
  }
  await act(async () => {
    view = create(React.createElement(Harness), {
      createNodeMock: (element) => (element.type === 'input' ? browser : null),
    });
  });
  assignments.length = 0;
  await act(async () => view!.root.findByType('input').props.onChange({ currentTarget: browser }));
  expect(assignments).toEqual([]);
});

it('web actualiza el calendario oculto después de escribir otra fecha completa', async () => {
  const browser = { type: 'date', value: '2028-02-29' };
  function Harness() {
    const [value, onChange] = useState('2028-02-29');
    return React.createElement(CalendarField, { label: 'Entrega', value, onChange });
  }
  await act(async () => {
    view = create(React.createElement(Harness), {
      createNodeMock: (element) =>
        element.type === 'input' && element.props.type === 'date' ? browser : null,
    });
  });
  await act(async () => view!.root.findByType('button').props.onClick());
  const manual = view!.root.findAllByType('input').find((node) => node.props.type === 'text')!;
  await act(async () => manual.props.onChange({ currentTarget: { value: '01/03/2028' } }));
  await act(async () => view!.root.findByType('button').props.onClick());
  expect(browser.value).toBe('2028-03-01');
});

it('web permite vaciar explícitamente y descarta fechas inexistentes del picker', async () => {
  const onChange = vi.fn();
  const tree = await render(
    React.createElement(CalendarField, {
      label: 'Entrega',
      value: '2028-02-29',
      onChange,
    }),
  );
  const input = tree.root.findByType('input');
  await act(async () =>
    input.props.onChange({
      currentTarget: {
        value: '2028-02-31',
        validity: { badInput: false },
      },
    }),
  );
  expect(onChange).not.toHaveBeenCalled();
  await act(async () =>
    input.props.onChange({
      currentTarget: {
        value: '',
        validity: { badInput: false },
      },
    }),
  );
  expect(onChange).toHaveBeenCalledExactlyOnceWith('');
});

it('web conserva un borrador inválido sin convertirlo a otra fecha', async () => {
  const onChange = vi.fn();
  const tree = await render(
    React.createElement(CalendarField, {
      label: 'Entrega',
      value: '2028-02-31',
      onChange,
    }),
  );
  const input = tree.root.findAllByType('input').find((node) => node.props.type === 'text')!;
  expect(input.props.type).toBe('text');
  expect(input.props.value).toBe('31/02/2028');
  await act(async () => input.props.onChange({ currentTarget: { value: '31/02/2029' } }));
  expect(onChange).toHaveBeenCalledExactlyOnceWith('2029-02-31');
});

it('web hora usa minutos enteros HH:mm y rechaza valores fuera del reloj', async () => {
  const onChange = vi.fn();
  const tree = await render(
    React.createElement(TimeField, {
      label: 'Hora',
      value: '09:30',
      onChange,
    }),
  );
  const input = tree.root.findByType('input');
  expect(input.props.type).toBe('time');
  expect(input.props.step).toBe(60);
  await act(async () =>
    input.props.onChange({
      currentTarget: {
        value: '24:00',
        validity: { badInput: false },
      },
    }),
  );
  expect(onChange).not.toHaveBeenCalled();
  await act(async () =>
    input.props.onChange({
      currentTarget: {
        value: '23:59',
        validity: { badInput: false },
      },
    }),
  );
  expect(onChange).toHaveBeenCalledExactlyOnceWith('23:59');
});

it('Android abre calendario anclado a mediodía UTC y devuelve fecha del negocio', async () => {
  const onChange = vi.fn();
  const tree = await render(
    React.createElement(NativeCalendarField, {
      label: 'Alquilado hasta',
      value: '2028-02-29',
      onChange,
    }),
  );
  await act(async () =>
    tree.root.findAllByType('Pressable' as React.ElementType)[0]!.props.onPress(),
  );
  const props = mocks.open.mock.calls[0]![0];
  expect(props.timeZoneName).toBe('America/Argentina/Buenos_Aires');
  expect(props.value.toISOString()).toBe('2028-02-29T12:00:00.000Z');
  await act(async () => props.onValueChange({}, new Date('2028-03-01T02:00:00Z')));
  expect(onChange).toHaveBeenCalledExactlyOnceWith('2028-02-29');
});

it('cancelar Android mantiene el borrador sin guardarlo y un error ofrece escritura', async () => {
  const onChange = vi.fn();
  const tree = await render(
    React.createElement(NativeCalendarField, {
      label: 'Alquilado hasta',
      value: '2028-02-31',
      onChange,
    }),
  );
  await act(async () =>
    tree.root.findAllByType('Pressable' as React.ElementType)[0]!.props.onPress(),
  );
  const props = mocks.open.mock.calls[0]![0];
  await act(async () => props.onDismiss());
  expect(onChange).not.toHaveBeenCalled();
  await act(async () => props.onError(new Error('No activity')));
  expect(tree.root.findByType('TextInput' as React.ElementType).props.value).toBe('31/02/2028');
});

it('Android devuelve la hora de Argentina y no la zona del teléfono', async () => {
  const onChange = vi.fn();
  const tree = await render(
    React.createElement(NativeTimeField, {
      label: 'Hora',
      value: '09:30',
      onChange,
    }),
  );
  await act(async () =>
    tree.root.findAllByType('Pressable' as React.ElementType)[0]!.props.onPress(),
  );
  const props = mocks.open.mock.calls[0]![0];
  expect(props.is24Hour).toBe(true);
  await act(async () => props.onValueChange({}, new Date('2028-03-01T03:05:00Z')));
  expect(onChange).toHaveBeenCalledExactlyOnceWith('00:05');
});

it('un campo nativo deshabilitado no abre el selector', async () => {
  const tree = await render(
    React.createElement(NativeTimeField, {
      label: 'Hora',
      value: '09:30',
      onChange: vi.fn(),
      disabled: true,
    }),
  );
  const opener = tree.root.findAllByType('Pressable' as React.ElementType)[0]!;
  expect(opener.props.disabled).toBe(true);
  await act(async () => opener.props.onPress());
  expect(mocks.open).not.toHaveBeenCalled();
});

it('iOS conserva el valor mientras gira el selector y solo aplica al elegir', async () => {
  mocks.os = 'ios';
  const onChange = vi.fn();
  const tree = await render(
    React.createElement(NativeCalendarField, {
      label: 'Alquilado hasta',
      value: '2028-02-29',
      onChange,
    }),
  );
  await act(async () =>
    tree.root.findAllByType('Pressable' as React.ElementType)[0]!.props.onPress(),
  );
  const picker = tree.root.findByType('DateTimePicker' as React.ElementType);
  expect(picker.props.timeZoneName).toBe('America/Argentina/Buenos_Aires');
  await act(async () => picker.props.onValueChange({}, new Date('2028-03-02T12:00:00Z')));
  expect(onChange).not.toHaveBeenCalled();
  const choose = tree.root
    .findAllByType('Button' as React.ElementType)
    .find((node) => node.props.label === 'Elegir')!;
  await act(async () => choose.props.onPress());
  expect(onChange).toHaveBeenCalledExactlyOnceWith('2028-03-02');
});

it('cancelar iOS descarta solo la selección temporal y conserva un borrador inválido', async () => {
  mocks.os = 'ios';
  const onChange = vi.fn();
  const tree = await render(
    React.createElement(NativeCalendarField, {
      label: 'Alquilado hasta',
      value: '2028-02-31',
      onChange,
    }),
  );
  await act(async () =>
    tree.root.findAllByType('Pressable' as React.ElementType)[0]!.props.onPress(),
  );
  await act(async () =>
    tree.root
      .findByType('DateTimePicker' as React.ElementType)
      .props.onValueChange({}, new Date('2028-03-02T12:00:00Z')),
  );
  const cancel = tree.root
    .findAllByType('Button' as React.ElementType)
    .find((node) => node.props.label === 'Cancelar')!;
  await act(async () => cancel.props.onPress());
  expect(onChange).not.toHaveBeenCalled();
  expect(
    tree.root.findAllByType('Pressable' as React.ElementType)[0]!.props.accessibilityLabel,
  ).toContain('31/02/2028');
  expect(tree.root.findAllByType('DateTimePicker' as React.ElementType)).toHaveLength(0);
});
