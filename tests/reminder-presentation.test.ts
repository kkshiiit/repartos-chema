import React from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { seed } from '../src/data/seed';
import {
  initialFeedbackState,
  type FeedbackState,
  type Reminder,
} from '../src/services/feedback/reminders';
import { RentalReminderPanel } from '../src/components/RentalReminderPanel';
import {
  ReminderStatusList,
  RetirementReminderSettings,
} from '../src/components/RetirementReminderSettings';
import { light } from '../src/theme/tokens';

const mocks = vi.hoisted(() => ({
  state: null as FeedbackState | null,
  error: '',
  supported: true,
  retry: vi.fn(),
  markDirty: vi.fn(),
  resetDirty: vi.fn(),
}));
vi.mock('react-native', () => ({ View: 'View', Text: 'Text', Pressable: 'Pressable' }));
vi.mock('lucide-react-native', () => ({ Check: 'Check' }));
vi.mock('../src/context/FeedbackContext', () => ({
  useFeedback: () => ({
    state: mocks.state!,
    error: mocks.error,
    supported: mocks.supported,
    ready: true,
    busy: false,
    retry: mocks.retry,
  }),
}));
vi.mock('../src/components/ui', () => ({
  useUI: () => ({ C: light, s: {} }),
  usePanelChanges: () => ({ markDirty: mocks.markDirty, resetDirty: mocks.resetDirty }),
  Button: 'Button',
  Notice: 'Notice',
  Sheet: ({ visible, children }: { visible: boolean; children?: React.ReactNode }) =>
    visible ? React.createElement('Sheet', {}, children) : null,
}));
vi.mock('../src/components/DateTimeFields', () => ({ TimeField: 'TimeField' }));
vi.mock('../src/components/FeedbackSettings', () => ({ FeedbackToggle: 'FeedbackToggle' }));
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
let view: ReactTestRenderer | undefined;
const obra = seed(new Date('2026-10-23T15:00:00Z')).obras[3];

beforeEach(() => {
  vi.clearAllMocks();
  mocks.error = '';
  mocks.supported = true;
  mocks.state = initialFeedbackState();
  mocks.state.globalPolicy.enabled = true;
  for (const offset of [3, 2, 1, 0])
    mocks.state.reminders[`${obra.id}:d${offset}`] = {
      obraId: obra.id,
      title: 'Cliente sintético',
      retirementDate: '2026-10-28',
      at: `2026-10-${28 - offset}T11:00:00.000Z`,
      offset,
      sound: false,
      vibrate: false,
      status: 'scheduled',
    };
});
afterEach(async () => {
  if (view) await act(async () => view!.unmount());
  view = undefined;
});

async function render(element: React.ReactElement) {
  await act(async () => {
    view = create(element);
  });
  return view!;
}
function textContent(tree: ReactTestRenderer) {
  return tree.root
    .findAllByType('Text')
    .map((node) =>
      node.children
        .filter((child) => typeof child === 'string' || typeof child === 'number')
        .join(''),
    )
    .join('\n');
}

it.each(['general', 'alquiler'] as const)(
  '%s no confirma programación conservada cuando falló la actualización',
  async (kind) => {
    // Storage failure can preserve an old scheduled snapshot after its native alarms
    // were cancelled. Those records must not imply that the old alarms still exist.
    mocks.error = 'No se pudo guardar el cambio. Revisá el almacenamiento y reintentá.';
    const tree = await render(
      kind === 'general'
        ? React.createElement(RetirementReminderSettings)
        : React.createElement(RentalReminderPanel, { obra }),
    );
    const text = textContent(tree);
    expect(text).not.toMatch(/4 avisos programados|Programado ·/);
    expect(text).toContain('Programación por verificar');
    expect(tree.root.findAllByType('Notice').some((node) => node.props.text === mocks.error)).toBe(
      true,
    );
    const retry = tree.root
      .findAllByType('Button')
      .find((node) => /^Reintentar/.test(node.props.label));
    expect(retry).toBeDefined();
    await act(async () => retry!.props.onPress());
    expect(mocks.retry).toHaveBeenCalledOnce();
  },
);

it('un fallo parcial no presenta los scheduled como un éxito completo', async () => {
  mocks.error = 'Falló la cancelación de uno de los avisos.';
  mocks.state!.reminders[`${obra.id}:d0`].status = 'pending';
  const tree = await render(React.createElement(RentalReminderPanel, { obra }));
  expect(textContent(tree)).not.toMatch(/3 avisos programados|Programado ·/);
  expect(textContent(tree)).toContain('Programación por verificar');
  expect(textContent(tree)).toContain('Pendiente de programación');
});

it('al verificar sin errores vuelve a confirmar los registros programados', async () => {
  const tree = await render(React.createElement(RentalReminderPanel, { obra }));
  expect(textContent(tree)).toContain('4 avisos programados');
  expect(textContent(tree).match(/Programado ·/g)).toHaveLength(4);
});

it('una cancelación pendiente conserva prioridad sobre la programación por verificar', async () => {
  const reminder: Reminder = {
    ...Object.values(mocks.state!.reminders)[0],
    status: 'cancelled',
    cancellationPending: true,
  };
  const tree = await render(
    React.createElement(ReminderStatusList, {
      reminders: [reminder],
      supported: true,
      verificationError: true,
    }),
  );
  expect(textContent(tree)).toContain('Cancelación pendiente');
  expect(textContent(tree)).not.toMatch(/Cancelado ·|Programado ·/);
});
