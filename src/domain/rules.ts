import type { Action, ObraCard, UserProfile } from '../types';
export const MAX_QUANTITY = 100000;
export function ensure(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}
export function quantity(value: unknown, positive = false): number {
  ensure(
    typeof value === 'number' &&
      Number.isSafeInteger(value) &&
      value >= (positive ? 1 : 0) &&
      value <= MAX_QUANTITY,
    `Cantidad inválida: usa enteros ${positive ? 'positivos' : 'no negativos'} hasta ${MAX_QUANTITY}.`,
  );
  return value;
}
export function validId(id: string) {
  ensure(typeof id === 'string' && /^[a-zA-Z0-9_-]{1,100}$/.test(id), 'Identificador inválido.');
}
export function required(value: string, label: string, max = 200): string {
  ensure(
    typeof value === 'string' && value.trim().length > 0 && value.length <= max,
    `${label}: completa un valor válido (hasta ${max} caracteres).`,
  );
  return value.trim();
}
export function validDate(value: string): string {
  ensure(/^\d{4}-\d{2}-\d{2}$/.test(value), 'Fecha inválida. Usa AAAA-MM-DD.');
  const date = new Date(`${value}T12:00:00Z`);
  ensure(
    !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value,
    'La fecha no existe.',
  );
  return value;
}
// Un único calendario empresarial, independiente de la zona horaria del teléfono/servidor.
export function businessDate(now = new Date()): string {
  const p = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Argentina/Buenos_Aires',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  return `${p.find((v) => v.type === 'year')!.value}-${p.find((v) => v.type === 'month')!.value}-${p.find((v) => v.type === 'day')!.value}`;
}
export function trafficLight(
  obra: Pick<ObraCard, 'estadoProceso' | 'fechaRetiroEstimada'>,
  today = businessDate(),
): ObraCard['estadoSemaphoro'] {
  validDate(today);
  validDate(obra.fechaRetiroEstimada);
  if (obra.estadoProceso !== 'ENTREGADO') return 'VERDE';
  return obra.fechaRetiroEstimada < today
    ? 'ROJO'
    : obra.fechaRetiroEstimada === today
      ? 'AMARILLO'
      : 'VERDE';
}
export function obraStatus(obra: ObraCard, today = businessDate()) {
  if (obra.estadoProceso === 'PENDIENTE_ENTREGA')
    return { label: 'Por entregar', color: '#A5B4FC', key: 'PENDIENTE' };
  if (obra.estadoProceso === 'RETIRADO')
    return { label: 'Retirado', color: '#CBD5E1', key: 'RETIRADO' };
  if (obra.estadoProceso === 'REINGRESADO')
    return { label: 'Reingresado', color: '#CBD5E1', key: 'REINGRESADO' };
  const key = trafficLight(obra, today);
  return {
    key,
    label: { VERDE: 'Al día', AMARILLO: 'Retiro hoy', ROJO: 'Vencido' }[key],
    color: { VERDE: '#4ADE80', AMARILLO: '#FACC15', ROJO: '#FB7185' }[key],
  };
}
export const adminActions: Action['type'][] = [
  'CREATE_OBRA',
  'UPDATE_OBRA',
  'DELETE_OBRA',
  'SET_LOAD',
  'REACTIVATE',
  'SAVE_MATERIAL',
  'ADJUST',
  'SAVE_COMBO',
  'DELETE_COMBO',
  'RESPONSABLES',
];
export function authorize(actor: UserProfile, action: Action) {
  ensure(actor && ['ADMIN', 'OPERADOR'].includes(actor.role) && !!actor.uid, 'Sesión inválida.');
  ensure(
    !adminActions.includes(action.type) || actor.role === 'ADMIN',
    'Solo administración puede realizar esta acción.',
  );
  if (action.type === 'DELIVER' && action.origins?.length)
    ensure(
      actor.role === 'ADMIN',
      'La procedencia alternativa requiere autorización de administración.',
    );
}
export function coordinates(c: { lat: number; lng: number }) {
  ensure(
    Number.isFinite(c.lat) &&
      Number.isFinite(c.lng) &&
      Math.abs(c.lat) <= 90 &&
      Math.abs(c.lng) <= 180,
    'Coordenadas inválidas.',
  );
}
export function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const r = Math.PI / 180;
  const d =
    Math.sin(((b.lat - a.lat) * r) / 2) ** 2 +
    Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(((b.lng - a.lng) * r) / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(d), Math.sqrt(1 - d));
}

export function matchesStatusFilter(
  obra: ObraCard,
  filter: string,
  today = businessDate(),
): boolean {
  return (
    filter === 'TODAS' ||
    (filter === 'RETIRADO'
      ? ['RETIRADO', 'REINGRESADO'].includes(obra.estadoProceso)
      : obraStatus(obra, today).key === filter)
  );
}
