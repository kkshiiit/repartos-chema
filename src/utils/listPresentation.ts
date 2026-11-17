import type { ObraCard, ActivityLog, MaterialItem } from '../types';
import { businessDate, obraStatus } from '../domain/rules';
import { isCalendarDate } from './retirementCalendar';

/** Read-only fallback for malformed historical dates; domain commands stay strict. */
export function obraPresentationStatus(obra: ObraCard, today = businessDate()) {
  if (obra.estadoProceso === 'ENTREGADO' && !isCalendarDate(obra.fechaRetiroEstimada))
    return { key: 'SIN_FECHA', label: 'Sin fecha de retiro' };
  return obraStatus(obra, today);
}

export type RentalTaskGroup =
  'overdue' | 'today' | 'upcoming' | 'unprepared' | 'undated' | 'finished';
export interface RentalTask {
  kind: 'DELIVER' | 'RETIRE' | 'FINISHED';
  date: string | null;
  group: RentalTaskGroup;
  label: string;
}
/** Calendar ordinals are civil date labels, never elapsed 24-hour business days. */
export function rentalTaskForDate(obra: ObraCard, today = businessDate()): RentalTask {
  if (obra.estadoProceso === 'RETIRADO' || obra.estadoProceso === 'REINGRESADO')
    return {
      kind: 'FINISHED',
      date: null,
      group: 'finished',
      label: obra.estadoProceso === 'REINGRESADO' ? 'Reingresado' : 'Retirado',
    };
  const delivery = obra.estadoProceso === 'PENDIENTE_ENTREGA';
  const kind = delivery ? 'DELIVER' : 'RETIRE';
  const value = delivery ? obra.fechaEntrega : obra.fechaRetiroEstimada;
  if (!isCalendarDate(value) || !isCalendarDate(today))
    return {
      kind,
      date: null,
      group: delivery ? 'unprepared' : 'undated',
      label: delivery ? 'Sin fecha de entrega' : 'Sin fecha de retiro',
    };
  const days = (Date.parse(`${value}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / 86_400_000;
  const verb = delivery ? 'Entregar' : 'Retirar';
  return {
    kind,
    date: value,
    group: days < 0 ? 'overdue' : days === 0 ? 'today' : 'upcoming',
    label:
      days < 0
        ? `${delivery ? 'Entrega atrasada' : 'Retiro atrasado'} · ${-days} ${days === -1 ? 'día' : 'días'}`
        : days === 0
          ? `${verb} hoy`
          : days === 1
            ? `${verb} mañana`
            : `${verb} en ${days} días`,
  };
}
function normalizeQuery(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('es-AR')
    .trim()
    .replace(/\s+/g, ' ');
}
export function matchesRentalSearch(obra: ObraCard, query: string): boolean {
  const haystack = normalizeQuery(
    `${obra.clienteNombre} ${obra.direccion} ${obra.localidadBarrio}`,
  );
  return normalizeQuery(query)
    .split(' ')
    .every((term) => haystack.includes(term));
}
export function matchesPresentationStatusFilter(
  obra: ObraCard,
  filter: string,
  today = businessDate(),
): boolean {
  if (filter === 'TODAS') return true;
  const task = rentalTaskForDate(obra, today);
  if (filter === 'HOY') return task.group === 'today';
  if (filter === 'ATRASADOS') return task.group === 'overdue';
  if (filter === 'PROXIMOS') return task.group === 'upcoming';
  if (filter === 'RETIRADO') return task.kind === 'FINISHED';
  if (filter === 'EN_OBRA') return obra.estadoProceso === 'ENTREGADO';
  return obraPresentationStatus(obra, today).key === filter;
}
export type RentalRow =
  | { kind: 'section'; id: string; title: string; count: number }
  | { kind: 'rental'; id: string; obra: ObraCard };
/** Presentation only: one task per rental, no writes to dates, stock or technical states. */
export function rentalRows(obras: ObraCard[], today = businessDate()): RentalRow[] {
  const groups: { key: RentalTaskGroup; title: string }[] = [
    { key: 'overdue', title: 'Atrasados' },
    { key: 'today', title: 'Tareas de hoy' },
    { key: 'upcoming', title: 'Próximos' },
    { key: 'unprepared', title: 'Por preparar' },
    { key: 'undated', title: 'Sin fecha de retiro' },
    { key: 'finished', title: 'Retirados' },
  ];
  return groups.flatMap(({ key, title }): RentalRow[] => {
    const items = obras
      .filter((o) => rentalTaskForDate(o, today).group === key)
      .sort(
        (a, b) =>
          (rentalTaskForDate(a, today).date || '').localeCompare(
            rentalTaskForDate(b, today).date || '',
          ) || a.id.localeCompare(b.id),
      );
    return items.length
      ? [
          { kind: 'section', id: `group_${key}`, title, count: items.length },
          ...items.map((obra): RentalRow => ({ kind: 'rental', id: obra.id, obra })),
        ]
      : [];
  });
}
/** One material preview, including current triangulated balances; full list lives in detail. */
export function rentalMaterialPreview(o: ObraCard, materials: MaterialItem[] = []): string {
  const loads =
    o.estadoProceso === 'ENTREGADO'
      ? Object.entries(o.saldosEnObra)
          .filter(([, quantity]) => quantity > 0)
          .map(([id, cantidad]) => {
            const reference =
              o.materialesCargados.find((m) => m.materialId === id) ||
              materials.find((m) => m.id === id);
            return {
              cantidad,
              nombre: reference?.nombre || 'Material sin referencia',
              medida: reference?.medida,
            };
          })
      : o.materialesCargados.filter((m) => m.cantidad > 0);
  const first = loads[0];
  if (!first)
    return o.estadoProceso === 'ENTREGADO' ? 'Sin material pendiente' : 'Carga por preparar';
  const more = loads.length - 1;
  return `${first.cantidad} × ${first.nombre}${first.medida ? ` · ${first.medida}` : ''}${more ? ` · +${more} ${more === 1 ? 'material' : 'materiales'}` : ''}`;
}
export function rentalSummary(o: ObraCard): string {
  const loads =
    o.estadoProceso === 'ENTREGADO'
      ? o.materialesCargados
          .map((m) => ({ ...m, cantidad: o.saldosEnObra[m.materialId] || 0 }))
          .filter((m) => m.cantidad > 0)
      : o.materialesCargados;
  // Include triangulated pieces even when they weren't in the original load.
  const count =
    o.estadoProceso === 'ENTREGADO'
      ? Object.values(o.saldosEnObra).reduce((a, b) => a + b, 0)
      : loads.reduce((a, m) => a + m.cantidad, 0);
  const types =
    o.estadoProceso === 'ENTREGADO'
      ? Object.values(o.saldosEnObra).filter((n) => n > 0).length
      : loads.length;
  return count
    ? `${count} piezas · ${types} ${types === 1 ? 'tipo' : 'tipos'}`
    : 'Carga por preparar';
}
export type HistoryRow =
  | { kind: 'section'; id: string; title: string }
  | { kind: 'activity'; id: string; log: ActivityLog };
export function historyRows(logs: ActivityLog[], today = businessDate()): HistoryRow[] {
  const yesterday = new Date(`${today}T12:00:00Z`);
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  const previous = yesterday.toISOString().slice(0, 10);
  let last = '';
  const rows: HistoryRow[] = [];
  for (const log of [...logs].sort((a, b) => b.timestamp.localeCompare(a.timestamp))) {
    const date = businessDate(new Date(log.timestamp));
    if (date !== last) {
      const formatted = new Date(`${date}T12:00:00Z`)
        .toLocaleDateString('es-AR', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          timeZone: 'UTC',
        })
        .replaceAll(' de ', ' ');
      rows.push({
        kind: 'section',
        id: `date_${date}`,
        title: `${date === today ? 'Hoy · ' : date === previous ? 'Ayer · ' : ''}${formatted}`,
      });
      last = date;
    }
    rows.push({ kind: 'activity', id: log.id, log });
  }
  return rows;
}
