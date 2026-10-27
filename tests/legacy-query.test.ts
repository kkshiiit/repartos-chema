import React from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import ExcelJS from 'exceljs';
import JSZip from 'jszip';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { seed, emptyState } from '../src/data/seed';
import { sortTripStops } from '../src/utils/trip';
import { localDocument } from '../src/services/localDocuments';
import { validDate } from '../src/domain/rules';
import type { ObraCard } from '../src/types';
import { light } from '../src/theme/tokens';
import Trip from '../app/(tabs)/mapa';
import Export from '../app/exportar';

const mocks = vi.hoisted(() => ({
  obras: [] as ObraCard[],
  exportDocument: vi.fn(),
  listeners: new Set<(state: string) => void>(),
}));
vi.mock('expo-router', () => ({
  useFocusEffect: () => {},
  useLocalSearchParams: () => ({}),
}));
vi.mock('react-native', () => ({
  View: 'View',
  Text: 'Text',
  Pressable: 'Pressable',
  Platform: { OS: 'web' },
  AppState: {
    currentState: 'active',
    addEventListener: (_: string, listener: (state: string) => void) => {
      mocks.listeners.add(listener);
      return { remove: () => mocks.listeners.delete(listener) };
    },
  },
}));
vi.mock('lucide-react-native', () => ({
  Navigation: 'Navigation',
  LocateFixed: 'LocateFixed',
  ArrowUp: 'ArrowUp',
  ArrowDown: 'ArrowDown',
  CornerDownLeft: 'CornerDownLeft',
  Route: 'Route',
  RotateCcw: 'RotateCcw',
  MoreHorizontal: 'MoreHorizontal',
  ChevronRight: 'ChevronRight',
  Warehouse: 'Warehouse',
  CheckCircle2: 'CheckCircle2',
  Clock: 'Clock',
  CircleAlert: 'CircleAlert',
  Archive: 'Archive',
  Download: 'Download',
  FileText: 'FileText',
}));
vi.mock('../src/components/TripOrderEditor', () => ({ TripOrderEditor: () => null }));
vi.mock('../src/components/DataList', () => ({
  DataList: ({ data, renderItem, ListHeaderComponent }: { data: unknown[]; renderItem: (arg: {item: unknown}) => React.ReactNode; ListHeaderComponent?: React.ReactNode }) =>
    React.createElement(React.Fragment, null, ListHeaderComponent, ...data.map((item, index) => React.createElement(React.Fragment, {key:index}, renderItem({item})))),
}));
vi.mock('@react-native-async-storage/async-storage', () => {
  const values = new Map<string,string>();
  return {default:{ getItem:async(key:string)=>values.get(key)??null, setItem:async(key:string,value:string)=>{values.set(key,value);} }};
});
vi.mock('expo-location', () => ({}));
vi.mock('../src/context/InventoryContext', () => ({
  useInventory: () => ({ state: { ...emptyState(), obras: mocks.obras } }),
}));
vi.mock('../src/context/AuthContext', () => ({
  useAuth: () => ({ user: { uid: 'query_admin', role: 'ADMIN' } }),
}));
vi.mock('../src/context/ThemeContext', () => ({ useTheme: () => ({ colors: light }) }));
vi.mock('../src/components/ui', () => {
  const host = (name: string) => {
    function Host(props: { children?: React.ReactNode }) {
      return React.createElement(name, props, props.children);
    }
    return Host;
  };
  return {
    useUI: () => ({ C: light, s: { row: {}, grow: {}, body: {}, muted: {}, h2: {}, wrap: {} } }),
    Button: host('Button'),
    Empty: host('Empty'),
    Notice: host('Notice'),
    Select: host('Select'),
    Field: host('Field'),
    IconButton: host('IconButton'),
    Screen: ({ children, footer }: { children: React.ReactNode; footer?: React.ReactNode }) =>
      React.createElement('Screen', {}, children, footer),
    Sheet: ({ visible, children }: { visible: boolean; children: React.ReactNode }) =>
      visible ? React.createElement('Sheet', {}, children) : null,
  };
});
vi.mock('../src/services/exportService', () => ({ exportDocument: mocks.exportDocument }));
vi.mock('../src/services/firebase', () => ({ DATA_MODE: 'demo' }));
vi.mock('../src/services/depotSettings', () => ({ loadDepot: vi.fn(async () => ({ nombre: 'Depósito sintético', direccion: 'Dirección sintética', coordenadas: { lat: -34.5, lng: -58.5 } })) }));
vi.mock('../src/services/links', () => ({ openLink: vi.fn() }));
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

const invalidRetirements = [undefined, null, '', '2026-02-30'];
function obra(id: string, date: unknown, estadoProceso: ObraCard['estadoProceso'] = 'ENTREGADO') {
  return {
    ...seed(new Date('2026-10-18T12:00:00Z')).obras[0],
    id,
    clienteNombre: id,
    fechaRetiroEstimada: date as string,
    estadoProceso,
  };
}
let view: ReactTestRenderer | undefined;
const textContent = () =>
  view!.root
    .findAll((node) => node.type === 'Text')
    .map((node) => node.children.join(''))
    .join('\n');
const control = (type: string, label: string) =>
  view!.root.findAll((node) => node.type === type && node.props.label === label)[0]!;
beforeEach(() => {
  mocks.obras = [];
  mocks.exportDocument.mockReset();
  mocks.exportDocument.mockResolvedValue('Documento listo.');
});
afterEach(async () => {
  if (view) await act(async () => view!.unmount());
  view = undefined;
  mocks.listeners.clear();
  vi.useRealTimers();
});

describe('consultas con retiro histórico inválido', () => {
  it('ordena fechas conocidas antes de fechas desconocidas sin omitir ni mutar paradas', () => {
    const items = [
      ...invalidRetirements.map((date, index) => obra(`sin_${index}`, date)),
      obra('futuro', '2026-10-20'),
      obra('hoy', '2026-10-18'),
      obra('vencido', '2026-10-17'),
      obra('entrega', null, 'PENDIENTE_ENTREGA'),
      obra('cerrado', null, 'REINGRESADO'),
    ];
    const before = JSON.stringify(items);
    expect(sortTripStops(items, { today: '2026-10-18' }).map((o) => o.id)).toEqual([
      'vencido',
      'hoy',
      'entrega',
      'futuro',
      'sin_0',
      'sin_1',
      'sin_2',
      'sin_3',
    ]);
    expect(
      sortTripStops(items, { today: '2026-10-18', manualOrder: ['sin_1', 'futuro'] })
        .map((o) => o.id)
        .slice(0, 2),
    ).toEqual(['sin_1', 'futuro']);
    expect(JSON.stringify(items)).toBe(before);
    for (const date of invalidRetirements) expect(() => validDate(date as string)).toThrow();
  });

  it('genera Excel local con estado neutral para las fechas inválidas y conserva fechas conocidas', async () => {
    const items = invalidRetirements.map((date, index) => obra(`sin_${index}`, date));
    const before = JSON.stringify(items);
    const bytes = await localDocument('excel', items);
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(bytes.buffer as ArrayBuffer);
    const sheet = workbook.getWorksheet('Logística')!;
    expect(sheet.getCell('A1').value).toBe('REPORTE LOGÍSTICO - GRUPO CHEMA CONSTRUCCIONES');
    expect(sheet.rowCount).toBe(6);
    for (let row = 3; row <= 6; row++) {
      expect(sheet.getCell(`C${row}`).value).toBe('Sin fecha de retiro');
      expect(sheet.getCell(`C${row}`).fill).toMatchObject({ fgColor: { argb: 'FFE2E8F0' } });
      expect(sheet.getCell(`G${row}`).value).toBe(items[row - 3]!.fechaEntrega);
    }
    expect(JSON.stringify(items)).toBe(before);
  });

  it.each(invalidRetirements)(
    'genera remito Word local sin inventar una fecha para %s',
    async (date) => {
      const item = obra('historico', date);
      const bytes = await localDocument('word', [item]);
      const archive = await JSZip.loadAsync(bytes);
      const document = await archive.file('word/document.xml')!.async('string');
      expect(document).toContain('GRUPO CHEMA');
      expect(document).toContain('REMITO DE MATERIALES');
      expect(document).toContain('Retiro estimado: Sin fecha de retiro');
      expect(document).not.toMatch(/undefined|null|2026-02-30|2026-03-02/);
      expect(document).toContain(
        'Se deja constancia de la recepción de los materiales detallados en este remito.',
      );
      expect(item.fechaRetiroEstimada).toBe(date);
    },
  );

  it('el viaje consulta las fechas desconocidas y actualiza estado al llegar medianoche argentina', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-19T02:59:59Z'));
    mocks.obras = [obra('fecha_conocida', '2026-10-19'), obra('sin_fecha', null)];
    await act(async () => {
      view = create(React.createElement(Trip));
    });
    expect(textContent()).toContain('Al día');
    expect(textContent()).toContain('Sin fecha de retiro');
    expect(mocks.listeners.size).toBe(1);
    await act(async () => vi.advanceTimersByTime(1001));
    expect(textContent()).toContain('Retiro hoy');
    expect(textContent()).not.toContain('Al día');
  });

  it('el filtro documental selecciona fechas desconocidas sin clasificar como al día', async () => {
    mocks.obras = [obra('sin_fecha', null), obra('con_fecha', '2099-01-01')];
    await act(async () => {
      view = create(React.createElement(Export));
    });
    await act(async () => control('Select', 'Estado').props.onChange('SIN_FECHA'));
    await act(async () => control('Button', 'Exportar Excel').props.onPress());
    expect(mocks.exportDocument).toHaveBeenCalledWith(
      'excel',
      [mocks.obras[0]],
      { uid: 'query_admin', role: 'ADMIN' },
      { from: '', to: '', status: 'SIN_FECHA' },
    );
    await act(async () => control('Select', 'Estado').props.onChange('VERDE'));
    await act(async () => control('Button', 'Exportar Excel').props.onPress());
    expect(mocks.exportDocument.mock.calls.at(-1)?.[1]).toEqual([mocks.obras[1]]);
  });
});
