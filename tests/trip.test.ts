import { describe, expect, it } from 'vitest';
import type { ObraCard } from '../src/types';
import {
  DEFAULT_DEPOT,
  buildTripRoutes,
  depotDirectionsUrl,
  parseDepotSettings,
  sortTripStops,
} from '../src/utils/trip';

const stop = (
  id: string,
  status: ObraCard['estadoProceso'],
  date: string,
  lng = -58.57,
): ObraCard => ({
  id,
  clienteNombre: id,
  clienteTelefono: '',
  direccion: `Calle ${id} & esquina`,
  localidadBarrio: 'Villa Ballester',
  coordenadas: { lat: -34.55, lng },
  estadoSemaphoro: 'VERDE',
  materialesCargados: [],
  fechaEntrega: '2026-10-01',
  fechaRetiroEstimada: date,
  estadoProceso: status,
  syncStatus: 'PENDING',
  saldosEnObra: {},
  updatedAt: '2026-10-15T12:00:00Z',
});

describe('Viaje y depósito', () => {
  it('la cercanía estricta pone una entrega cercana antes de un retiro vencido lejano', () => {
    const items = [
      stop('entrega', 'PENDIENTE_ENTREGA', '2026-10-16'),
      stop('hoy', 'ENTREGADO', '2026-10-15', -58.7),
      stop('vencido', 'ENTREGADO', '2026-10-14', -58.8),
      stop('futuro', 'ENTREGADO', '2026-10-16'),
      stop('cerrado', 'REINGRESADO', '2026-10-10'),
    ];
    expect(
      sortTripStops(items, { today: '2026-10-15', origin: { lat: -34.55, lng: -58.57 } }).map(
        (o) => o.id,
      ),
    ).toEqual(['entrega', 'futuro', 'hoy', 'vencido']);
  });
  it('utiliza coordenadas reales y deja ubicaciones desconocidas al final', () => {
    const noCoordinates = { ...stop('sin', 'ENTREGADO', '2026-10-15'), coordenadas: undefined };
    const ordered = sortTripStops(
      [
        noCoordinates,
        stop('lejos', 'ENTREGADO', '2026-10-15', -58.8),
        stop('cerca', 'ENTREGADO', '2026-10-15'),
      ],
      { today: '2026-10-15', origin: { lat: -34.55, lng: -58.57 } },
    );
    expect(ordered.map((o) => o.id)).toEqual(['cerca', 'lejos', 'sin']);
    expect(noCoordinates.coordenadas).toBeUndefined();
  });
  it('respeta orden manual sin modificar el inventario ni la entrada', () => {
    const items = [
      stop('a', 'ENTREGADO', '2026-10-14'),
      stop('b', 'PENDIENTE_ENTREGA', '2026-10-16'),
    ];
    expect(
      sortTripStops(items, { today: '2026-10-15', manualOrder: ['b', 'a'] }).map((o) => o.id),
    ).toEqual(['b', 'a']);
    expect(items.map((o) => o.id)).toEqual(['a', 'b']);
  });
  it('el depósito usa el pin del enlace proporcionado, nunca el centro del mapa', () => {
    expect(DEFAULT_DEPOT.coordenadas).toEqual({ lat: -34.5530245, lng: -58.5685218 });
    expect(new URL(depotDirectionsUrl(DEFAULT_DEPOT)).searchParams.get('destination')).toBe(
      '-34.5530245,-58.5685218',
    );
  });
  it('codifica direcciones sin coordenadas y termina en el depósito', () => {
    const item = { ...stop('A', 'ENTREGADO', '2026-10-15'), coordenadas: undefined };
    const routes = buildTripRoutes([item], DEFAULT_DEPOT);
    expect(routes).toHaveLength(1);
    const url = new URL(routes[0]!.url);
    expect(url.searchParams.get('waypoints')).toBe('Calle A & esquina, Villa Ballester');
    expect(url.searchParams.get('destination')).toBe('-34.5530245,-58.5685218');
    expect(url.searchParams.has('origin')).toBe(false);
    expect(routes[0]!.returnsToDepot).toBe(true);
  });
  it('divide rutas largas sin omitir ni repetir alquileres y conserva el regreso', () => {
    const items = Array.from({ length: 10 }, (_, i) =>
      stop(`p${i}`, 'ENTREGADO', '2026-10-15', -58.5 - i / 100),
    );
    const routes = buildTripRoutes(items, DEFAULT_DEPOT, { lat: -34.5, lng: -58.5 });
    expect(routes).toHaveLength(3);
    expect(routes.flatMap((r) => r.stopIds)).toEqual(items.map((o) => o.id));
    for (const route of routes) {
      const url = new URL(route.url);
      expect((url.searchParams.get('waypoints')?.split('|') ?? []).length).toBeLessThanOrEqual(3);
      expect(route.url.length).toBeLessThanOrEqual(2048);
    }
    expect(routes.at(-1)!.returnsToDepot).toBe(true);
  });
  it('rechaza ubicaciones ausentes, coordenadas inválidas y duplicados', () => {
    expect(() =>
      buildTripRoutes(
        [
          {
            ...stop('a', 'ENTREGADO', '2026-10-15'),
            coordenadas: undefined,
            direccion: '',
            localidadBarrio: '',
          },
        ],
        DEFAULT_DEPOT,
      ),
    ).toThrow('ubicación');
    expect(() =>
      buildTripRoutes(
        [{ ...stop('a', 'ENTREGADO', '2026-10-15'), coordenadas: { lat: 100, lng: 0 } }],
        DEFAULT_DEPOT,
      ),
    ).toThrow('Coordenadas');
    const item = stop('a', 'ENTREGADO', '2026-10-15');
    expect(() => buildTripRoutes([item, item], DEFAULT_DEPOT)).toThrow('repetidas');
  });
  it('valida almacenamiento y rechaza enlaces ajenos a Google Maps', () => {
    expect(parseDepotSettings(JSON.stringify(DEFAULT_DEPOT))).toEqual(DEFAULT_DEPOT);
    expect(() => parseDepotSettings('{')).toThrow();
    expect(() => parseDepotSettings(JSON.stringify({ ...DEFAULT_DEPOT, schema: 2 }))).toThrow(
      'versión',
    );
    for (const sourceUrl of [
      'https://maps.app.goo.gl.ejemplo.com/a',
      'javascript:alert(1)',
      'https://usuario@maps.app.goo.gl/a',
    ]) {
      expect(() => parseDepotSettings(JSON.stringify({ ...DEFAULT_DEPOT, sourceUrl }))).toThrow(
        'Google Maps',
      );
    }
  });
});
