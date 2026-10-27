import type { MaterialCargado, ObraCard } from '../types';
import { coordinates, distanceKm, measureKey } from './rules';
export type TripTaskFilter = 'ALL' | 'RETIRE' | 'DELIVER';
export interface TripStop {
  id: string;
  task: Exclude<TripTaskFilter, 'ALL'>;
  obra: ObraCard;
}
export interface MaterialBasis {
  materialId: string;
  medida?: string;
}
export interface TripSortResult {
  ids: string[];
  error?: string;
}
export function eligibleTripStops(works: readonly ObraCard[]): TripStop[] {
  return works.flatMap<TripStop>((obra) => {
    if (
      obra.estadoProceso === 'PENDIENTE_ENTREGA' &&
      obra.materialesCargados.some((m) => m.cantidad > 0)
    )
      return [{ id: obra.id, task: 'DELIVER' as const, obra }];
    if (
      obra.estadoProceso === 'ENTREGADO' &&
      Object.values(obra.saldosEnObra || {}).some((n) => n > 0)
    )
      return [{ id: obra.id, task: 'RETIRE' as const, obra }];
    return [];
  });
}
export function reconcileTripSequence(
  saved: readonly string[],
  eligible: readonly string[],
): string[] {
  const valid = new Set(eligible),
    seen = new Set<string>();
  return [...saved, ...eligible].filter((id) => {
    if (!valid.has(id) || seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}
export function visibleTripStops(
  ids: readonly string[],
  stops: readonly TripStop[],
  filter: { task: TripTaskFilter; zone: string },
): TripStop[] {
  const byId = new Map(stops.map((s) => [s.id, s]));
  return ids.flatMap((id) => {
    const stop = byId.get(id);
    return stop &&
      (filter.task === 'ALL' || stop.task === filter.task) &&
      (filter.zone === 'TODAS' || stop.obra.localidadBarrio === filter.zone)
      ? [stop]
      : [];
  });
}
export function permuteVisibleTripIds(
  all: readonly string[],
  orderedVisible: readonly string[],
): string[] {
  if (
    new Set(all).size !== all.length ||
    new Set(orderedVisible).size !== orderedVisible.length ||
    orderedVisible.some((id) => !all.includes(id))
  )
    throw new Error('Las paradas cambiaron. Revisá el recorrido antes de guardar.');
  const subset = new Set(orderedVisible);
  let next = 0;
  return all.map((id) => (subset.has(id) ? orderedVisible[next++]! : id));
}
export function moveTripStop(ids: readonly string[], id: string, position: number): string[] {
  if (!Number.isInteger(position) || position < 1 || position > ids.length || !ids.includes(id))
    throw new Error(`Elegí una posición entera entre 1 y ${ids.length}.`);
  const rest = ids.filter((v) => v !== id);
  rest.splice(position - 1, 0, id);
  return rest;
}
export function coordinateOrNull(value: unknown): { lat: number; lng: number } | null {
  if (!value || typeof value !== 'object') return null;
  try {
    coordinates(value as { lat: number; lng: number });
    return value as { lat: number; lng: number };
  } catch {
    return null;
  }
}
export function sortTripByDistance(
  stops: readonly TripStop[],
  origin: { lat: number; lng: number } | null,
): TripSortResult {
  const validOrigin = coordinateOrNull(origin);
  if (!validOrigin)
    return {
      ids: stops.map((s) => s.id),
      error: 'Elegí un origen válido: mi ubicación o depósito.',
    };
  const distances = stops.map((s, index) => ({
    id: s.id,
    index,
    distance: coordinateOrNull(s.obra.coordenadas)
      ? distanceKm(validOrigin, s.obra.coordenadas!)
      : null,
  }));
  if (!distances.some((s) => s.distance !== null))
    return {
      ids: stops.map((s) => s.id),
      error:
        'No hay paradas con ubicación para calcular cercanía. Usá el orden manual o por material.',
    };
  distances.sort((a, b) =>
    a.distance === null
      ? b.distance === null
        ? a.index - b.index
        : 1
      : b.distance === null
        ? -1
        : a.distance - b.distance || a.index - b.index,
  );
  return { ids: distances.map((s) => s.id) };
}
function matchingLines(stop: TripStop, basis: MaterialBasis): MaterialCargado[] {
  return stop.obra.materialesCargados.filter(
    (m) => m.materialId === basis.materialId && measureKey(m.medida) === measureKey(basis.medida),
  );
}
export function materialQuantity(stop: TripStop, basis: MaterialBasis): number | null {
  const lines = matchingLines(stop, basis);
  if (!lines.length) return null;
  if (stop.task === 'DELIVER') return lines.reduce((n, m) => n + m.cantidad, 0);
  // Saldos are keyed by material identity. Different measures must never be invented/combined.
  const otherMeasure = stop.obra.materialesCargados.some(
    (m) => m.materialId === basis.materialId && measureKey(m.medida) !== measureKey(basis.medida),
  );
  if (otherMeasure) return null;
  const n = stop.obra.saldosEnObra[basis.materialId];
  return typeof n === 'number' && Number.isSafeInteger(n) && n >= 0 ? n : null;
}
export function sortTripByMaterial(
  stops: readonly TripStop[],
  basis: MaterialBasis,
  direction: 'ASC' | 'DESC',
): TripSortResult {
  const values = stops.map((s, index) => ({
    id: s.id,
    index,
    quantity: materialQuantity(s, basis),
  }));
  if (!values.some((s) => s.quantity !== null))
    return {
      ids: stops.map((s) => s.id),
      error: 'No hay cantidades comparables de este material y medida. Usá el orden manual.',
    };
  values.sort((a, b) =>
    a.quantity === null
      ? b.quantity === null
        ? a.index - b.index
        : 1
      : b.quantity === null
        ? -1
        : (a.quantity - b.quantity) * (direction === 'ASC' ? 1 : -1) || a.index - b.index,
  );
  return { ids: values.map((s) => s.id) };
}
export function tripOriginSignature(
  origin: { coordinates: { lat: number; lng: number }; kind: string } | null,
) {
  return origin ? `${origin.kind}:${origin.coordinates.lat}:${origin.coordinates.lng}` : '';
}
