import type { ObraCard } from '../types';
import { businessDate, coordinates, distanceKm } from '../domain/rules';
import { obraPresentationStatus } from './listPresentation';
import { isCalendarDate } from './retirementCalendar';
export interface DepotSettings {
  schema: 1;
  nombre: string;
  direccion: string;
  coordenadas?: { lat: number; lng: number };
  sourceUrl: string;
}
// Pin verificado en el enlace proporcionado por el usuario, no el centro del mapa.
export const DEFAULT_DEPOT: DepotSettings = {
  schema: 1,
  nombre: 'Depósito Chema',
  direccion: 'Formosa y Cuba, Villa Ballester, Buenos Aires',
  coordenadas: { lat: -34.5530245, lng: -58.5685218 },
  sourceUrl: 'https://maps.app.goo.gl/ZVFoghjHrGDunK4v5',
};
export function parseDepotSettings(raw: string): DepotSettings {
  const d = JSON.parse(raw) as DepotSettings;
  if (d.schema !== 1) throw new Error('La versión de la ubicación no es compatible.');
  if (!d.nombre?.trim() || !d.direccion?.trim() || d.direccion.length > 300)
    throw new Error('Completa la dirección del depósito.');
  if (d.coordenadas) coordinates(d.coordenadas);
  const u = new URL(d.sourceUrl);
  if (
    u.protocol !== 'https:' ||
    u.username ||
    u.password ||
    !['maps.app.goo.gl', 'www.google.com', 'maps.google.com'].includes(u.hostname)
  )
    throw new Error('Usa un enlace de Google Maps.');
  return d;
}
function destination(d: {
  coordenadas?: { lat: number; lng: number };
  direccion: string;
  localidadBarrio?: string;
}) {
  if (d.coordenadas) {
    coordinates(d.coordenadas);
    return `${d.coordenadas.lat},${d.coordenadas.lng}`;
  }
  if (!d.direccion.trim()) throw new Error('Falta ubicación para una parada.');
  return [d.direccion, d.localidadBarrio].filter(Boolean).join(', ');
}
export function depotDirectionsUrl(d = DEFAULT_DEPOT) {
  return `https://www.google.com/maps/dir/?api=1&travelmode=driving&destination=${encodeURIComponent(destination(d))}`;
}
export function sortTripStops(
  items: ObraCard[],
  options: {
    today?: string;
    origin?: { lat: number; lng: number } | null;
    manualOrder?: string[];
  } = {},
) {
  const today = options.today || businessDate();
  const priorities: Record<string, number> = {
    ROJO: 0,
    AMARILLO: 1,
    PENDIENTE: 2,
    VERDE: 3,
    SIN_FECHA: 4,
  };
  const rank = (o: ObraCard) => priorities[obraPresentationStatus(o, today).key] ?? 4;
  const sortDate = (o: ObraCard) =>
    isCalendarDate(o.fechaRetiroEstimada) ? o.fechaRetiroEstimada : '';
  return items
    .filter((o) => ['ENTREGADO', 'PENDIENTE_ENTREGA'].includes(o.estadoProceso))
    .slice()
    .sort((a, b) => {
      if (options.manualOrder?.length) {
        const pos = (id: string) => {
          const n = options.manualOrder!.indexOf(id);
          return n < 0 ? Number.MAX_SAFE_INTEGER : n;
        };
        return pos(a.id) - pos(b.id) || rank(a) - rank(b);
      }
      const priority = rank(a) - rank(b);
      if (priority) return priority;
      if (options.origin) {
        const dist = (o: ObraCard) =>
          o.coordenadas ? distanceKm(options.origin!, o.coordenadas) : Infinity;
        const delta = dist(a) - dist(b);
        if (Number.isFinite(delta) && delta) return delta;
        if (!a.coordenadas && b.coordenadas) return 1;
        if (a.coordenadas && !b.coordenadas) return -1;
      }
      return (
        sortDate(a).localeCompare(sortDate(b)) || a.clienteNombre.localeCompare(b.clienteNombre)
      );
    });
}
export function buildTripRoutes(
  items: ObraCard[],
  depot = DEFAULT_DEPOT,
  origin?: { lat: number; lng: number } | null,
) {
  if (new Set(items.map((o) => o.id)).size !== items.length)
    throw new Error('Hay paradas repetidas.');
  if (origin) coordinates(origin);
  const stops = items.map((o) => ({ id: o.id, query: destination(o) }));
  const result: { url: string; stopIds: string[]; returnsToDepot: boolean }[] = [];
  let cursor = 0,
    previous = origin ? `${origin.lat},${origin.lng}` : undefined;
  while (cursor < stops.length) {
    // Google Maps móvil admite hasta 3 waypoints; tramos cortos y sin optimización inventada.
    const remaining = stops.length - cursor;
    let size = Math.min(remaining, remaining <= 3 ? 3 : 4);
    let url = '',
      last = false;
    while (size > 0) {
      last = cursor + size === stops.length;
      const group = stops.slice(cursor, cursor + size);
      const waypoints = last ? group : group.slice(0, -1);
      const params = new URLSearchParams({
        api: '1',
        travelmode: 'driving',
        destination: last ? destination(depot) : group.at(-1)!.query,
      });
      if (previous) params.set('origin', previous);
      if (waypoints.length) params.set('waypoints', waypoints.map((o) => o.query).join('|'));
      url = `https://www.google.com/maps/dir/?${params}`;
      if (url.length <= 2048) break;
      size--;
    }
    if (!size) throw new Error('Una dirección es demasiado larga para Google Maps.');
    const group = stops.slice(cursor, cursor + size);
    result.push({ url, stopIds: group.map((o) => o.id), returnsToDepot: last });
    previous = group.at(-1)!.query;
    cursor += size;
  }
  return result;
}
