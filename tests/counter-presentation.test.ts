import React from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CardObra } from '../src/components/CardObra';
import { seed } from '../src/data/seed';
import { light } from '../src/theme/tokens';
import { validDate } from '../src/domain/rules';
import Detail from '../app/obra/[id]';
import Home from '../app/(tabs)/index';
import { formatDate } from '../src/utils/formatters';
import type { DomainSnapshot } from '../src/types';

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  dispatch: vi.fn(),
  state: {} as DomainSnapshot,
  role: 'ADMIN',
  id: 'obra_1',
  listeners: new Set<(state: string) => void>(),
}));
vi.mock('expo-router', () => ({
  router: { push: mocks.push },
  useLocalSearchParams: () => ({ id: mocks.id }),
}));
vi.mock('react-native', () => ({
  View: 'View',
  Text: 'Text',
  Pressable: 'Pressable',
  useWindowDimensions: () => ({ fontScale: 1 }),
  AppState: {
    currentState: 'active',
    addEventListener: (_: string, listener: (state: string) => void) => {
      mocks.listeners.add(listener);
      return { remove: () => mocks.listeners.delete(listener) };
    },
  },
}));
vi.mock('lucide-react-native', () => ({
  Building2: 'Building2',
  ChevronRight: 'ChevronRight',
  CheckCircle2: 'CheckCircle2',
  Clock: 'Clock',
  CircleAlert: 'CircleAlert',
  Archive: 'Archive',
  Camera: 'Camera',
  ImagePlus: 'ImagePlus',
  MapPin: 'MapPin',
  Navigation: 'Navigation',
  MessageCircle: 'MessageCircle',
  Pencil: 'Pencil',
  Package: 'Package',
  Truck: 'Truck',
  ArrowRightLeft: 'ArrowRightLeft',
  Download: 'Download',
  CalendarDays: 'CalendarDays',
  MoreHorizontal: 'MoreHorizontal',
  Plus: 'Plus',
  ChevronDown: 'ChevronDown',
  ChevronUp: 'ChevronUp',
}));
vi.mock('../src/components/ui', () => {
  const host = (name: string) => {
    function Host(props: { children?: React.ReactNode }) {
      return React.createElement(name, props, props.children);
    }
    return Host;
  };
  return {
    useUI: () => ({
      C: light,
      s: {
        grow: {},
        label: {},
        muted: {},
        body: {},
        title: {},
        row: {},
        h2: {},
        card: {},
        wrap: {},
      },
    }),
    Button: host('Button'),
    ConfirmButton: host('ConfirmButton'),
    Empty: host('Empty'),
    Field: host('Field'),
    Notice: host('Notice'),
    Select: host('Select'),
    Screen: ({ children, footer }: { children: React.ReactNode; footer?: React.ReactNode }) =>
      React.createElement('Screen', {}, children, footer),
    Sheet: ({ visible, children }: { visible: boolean; children: React.ReactNode }) =>
      visible ? React.createElement('Sheet', {}, children) : null,
  };
});
vi.mock('../src/components/DataList', () => ({
  DataList: (props: {
    data: { id: string }[];
    renderItem: (value: { item: { id: string }; index: number }) => React.ReactNode;
  }) =>
    React.createElement(
      'DataList',
      {},
      props.data.map((item, index) =>
        React.createElement(React.Fragment, { key: item.id }, props.renderItem({ item, index })),
      ),
    ),
}));
vi.mock('../src/components/ListStructure', () => ({
  SearchToolbar: () => null,
  Segmented: () => null,
  SectionHeading: ({ title }: { title: string }) => React.createElement('Text', {}, title),
}));
vi.mock('../src/context/InventoryContext', () => ({
  useInventory: () => ({ state: mocks.state, dispatch: mocks.dispatch }),
  makeId: () => 'unused_id',
}));
vi.mock('../src/context/AuthContext', () => ({
  useAuth: () => ({ user: { uid: 'test_admin', role: mocks.role } }),
}));
vi.mock('../src/context/ThemeContext', () => ({ useTheme: () => ({ colors: light }) }));
vi.mock('expo-location', () => ({}));
vi.mock('../src/components/RentalReminderPanel', () => ({ RentalReminderPanel: () => null }));
vi.mock('../src/components/PhotoImage', () => ({ PhotoImage: () => null }));
vi.mock('../src/components/SmartCounter', () => ({ SmartCounter: () => null }));
vi.mock('../src/components/LoadEditor', () => ({ LoadEditor: () => null }));
vi.mock('../src/components/OperationForm', () => ({ OperationForm: () => null }));
vi.mock('../src/services/photoCache', () => ({ deleteLocalPhoto: vi.fn() }));
vi.mock('../src/services/storageService', () => ({ selectPhoto: vi.fn() }));
vi.mock('../src/services/links', () => ({ openLink: vi.fn() }));
vi.mock('../src/services/localMode', () => ({ LOCAL_ONLY: true }));
vi.mock('../src/services/firebase', () => ({ DATA_MODE: 'demo' }));
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

let view: ReactTestRenderer | undefined;
const textContent = () =>
  view!.root
    .findAll((node) => node.type === 'Text')
    .map((node) => node.children.join(''))
    .join('\n');

beforeEach(() => {
  mocks.push.mockClear();
  mocks.dispatch.mockClear();
  mocks.state = seed(new Date('2026-10-18T15:00:00Z'));
  mocks.role = 'ADMIN';
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-10-18T15:00:00Z'));
});
afterEach(async () => {
  if (view) await act(async () => view!.unmount());
  view = undefined;
  vi.useRealTimers();
  mocks.listeners.clear();
});

describe('contador visible en la fila de alquiler', () => {
  it('muestra mañana, hoy y vencido con el mismo reloj que el estado y conserva los datos', async () => {
    const obra = seed(new Date('2026-10-18T15:00:00Z')).obras[0];
    obra.fechaRetiroEstimada = '2026-10-19';
    const before = JSON.stringify(obra);
    await act(async () => {
      view = create(React.createElement(CardObra, { obra, now: new Date('2026-10-19T02:59:59Z') }));
    });
    expect(textContent()).toContain('Retirar mañana');
    expect(textContent()).toContain('Al día');
    await act(async () => {
      view!.update(React.createElement(CardObra, { obra, now: new Date('2026-10-19T03:00:00Z') }));
    });
    expect(textContent()).toContain('Retirar hoy');
    expect(textContent()).toContain('Retiro hoy');
    await act(async () => {
      view!.update(React.createElement(CardObra, { obra, now: new Date('2026-10-20T03:00:00Z') }));
    });
    expect(textContent()).toContain('Retiro vencido hace 1 día');
    expect(textContent()).toContain('Vencido');
    expect(JSON.stringify(obra)).toBe(before);
    await act(async () => view!.root.findByType('Pressable').props.onPress());
    expect(mocks.push).toHaveBeenCalledWith(`/obra/${obra.id}`);
  });

  it.each(['RETIRADO', 'REINGRESADO'] as const)(
    'suprime el contador del estado final %s aunque la fecha estimada haya vencido',
    async (estadoProceso) => {
      const obra = { ...seed().obras[0], estadoProceso, fechaRetiroEstimada: '2026-10-01' };
      await act(async () => {
        view = create(
          React.createElement(CardObra, { obra, now: new Date('2026-10-23T12:00:00Z') }),
        );
      });
      expect(textContent()).toContain(estadoProceso === 'RETIRADO' ? 'Retirado' : 'Reingresado');
      expect(textContent()).not.toMatch(/Retirar|vencido hace|Sin fecha de retiro/);
    },
  );

  it.each([undefined, null, '', '2026-02-30'])(
    'permite abrir la fila con fecha legacy inválida %s sin relajar validDate',
    async (date) => {
      const obra = { ...seed().obras[0], fechaRetiroEstimada: date as unknown as string };
      await act(async () => {
        view = create(
          React.createElement(CardObra, { obra, now: new Date('2026-10-23T12:00:00Z') }),
        );
      });
      expect(textContent()).toContain('Sin fecha de retiro');
      expect(textContent()).not.toMatch(/Al día|NaN|Invalid Date|vencido hace/);
      await act(async () => view!.root.findByType('Pressable').props.onPress());
      expect(mocks.push).toHaveBeenCalledWith(`/obra/${obra.id}`);
      expect(() => validDate(date as unknown as string)).toThrow();
    },
  );

  it('la fila pendiente conserva su estado y avisa que falta la fecha de retiro', async () => {
    const obra = {
      ...seed().obras[0],
      estadoProceso: 'PENDIENTE_ENTREGA' as const,
      fechaEntrega: null as unknown as string,
      fechaRetiroEstimada: null as unknown as string,
    };
    await act(async () => {
      view = create(React.createElement(CardObra, { obra }));
    });
    expect(textContent()).toContain('Por entregar');
    expect(textContent()).toContain('Sin fecha de retiro');
    expect(textContent()).not.toContain('NaN');
  });
});

describe('consulta de detalle y listado con reloj empresarial', () => {
  it('actualiza el contador y las agrupaciones al cruzar medianoche argentina sin persistir', async () => {
    mocks.state.obras = [{ ...mocks.state.obras[0], fechaRetiroEstimada: '2026-10-19' }];
    const before = JSON.stringify(mocks.state);
    vi.setSystemTime(new Date('2026-10-19T02:59:59Z'));
    await act(async () => {
      view = create(React.createElement(Home));
    });
    expect(textContent()).toContain('Próximos retiros');
    expect(textContent()).toContain('Retirar mañana');
    expect(mocks.listeners.size).toBe(1);
    await act(async () => vi.advanceTimersByTime(1001));
    expect(textContent()).toContain('Retiros de hoy');
    expect(textContent()).toContain('Retirar hoy');
    vi.setSystemTime(new Date('2026-10-20T12:00:00Z'));
    await act(async () => {
      for (const listener of mocks.listeners) listener('active');
    });
    expect(textContent()).toContain('Vencidos');
    expect(textContent()).toContain('Retiro vencido hace 1 día');
    expect(mocks.dispatch).not.toHaveBeenCalled();
    expect(JSON.stringify(mocks.state)).toBe(before);
  });

  it('el detalle distingue la fecha comercial de la efectiva y actualiza su contador', async () => {
    mocks.state.obras[0].fechaRetiroEstimada = '2026-10-19';
    mocks.state.obras[0].fechaRetiroEfectiva = '2026-10-20';
    vi.setSystemTime(new Date('2026-10-19T02:59:59Z'));
    await act(async () => {
      view = create(React.createElement(Detail));
    });
    expect(textContent()).toContain('Alquilado hasta\n19/10/2026');
    expect(textContent()).toContain('Retiro efectivo: 20/10/2026');
    expect(textContent()).toContain('Retirar mañana');
    await act(async () => vi.advanceTimersByTime(1001));
    expect(textContent()).toContain('Retirar hoy');
    expect(mocks.listeners.size).toBe(1);
    expect(mocks.dispatch).not.toHaveBeenCalled();
  });

  it.each(['ADMIN', 'OPERADOR'])(
    'la fecha legacy inválida conserva consulta y la edición respeta el rol %s',
    async (role) => {
      mocks.state.obras[0].fechaRetiroEstimada = undefined as unknown as string;
      mocks.role = role;
      await act(async () => {
        view = create(React.createElement(Detail));
      });
      expect(textContent()).toContain('Sin fecha de retiro');
      expect(textContent()).not.toMatch(/NaN|Invalid Date|vencido hace/);
      const edit = view!.root.findAll(
        (node) => node.type === 'Button' && node.props.label === 'Editar alquiler',
      );
      expect(edit).toHaveLength(role === 'ADMIN' ? 1 : 0);
      if (edit[0]) {
        await act(async () => edit[0].props.onPress());
        expect(mocks.push).toHaveBeenCalledWith('/obra/editar?id=obra_1');
      }
      expect(mocks.dispatch).not.toHaveBeenCalled();
    },
  );

  it.each(['RETIRADO', 'REINGRESADO'] as const)(
    'el detalle final %s conserva fechas y deja de contar días',
    async (estadoProceso) => {
      Object.assign(mocks.state.obras[0], {
        estadoProceso,
        fechaRetiroEstimada: '2026-10-01',
        fechaRetiroEfectiva: '2026-10-02',
      });
      await act(async () => {
        view = create(React.createElement(Detail));
      });
      expect(textContent()).toContain(estadoProceso === 'RETIRADO' ? 'Retirado' : 'Reingresado');
      expect(textContent()).toContain('Alquilado hasta\n01/10/2026');
      expect(textContent()).toContain('Retiro efectivo: 02/10/2026');
      expect(textContent()).not.toMatch(/Retirar|vencido hace/);
    },
  );

  it('formatea solo fechas civiles válidas sin convertir una fecha imposible en otra', () => {
    expect(formatDate('2024-02-29')).toBe('29/02/2024');
    expect(formatDate('2026-10-19', true)).toBe('19/10');
    expect(formatDate('2026-02-30')).toBe('Sin fecha');
    expect(formatDate(null, false, 'Sin fecha de retiro')).toBe('Sin fecha de retiro');
  });
});
