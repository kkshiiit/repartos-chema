import type { ObraCard, ActivityLog } from '../types';
import { businessDate, obraStatus } from '../domain/rules';
import { isCalendarDate } from './retirementCalendar';

/** Read-only fallback for malformed historical dates; domain commands stay strict. */
export function obraPresentationStatus(obra: ObraCard, today = businessDate()) {
  if (obra.estadoProceso === 'ENTREGADO' && !isCalendarDate(obra.fechaRetiroEstimada))
    return { key: 'SIN_FECHA', label: 'Sin fecha de retiro' };
  return obraStatus(obra, today);
}

export function matchesPresentationStatusFilter(
  obra: ObraCard,
  filter: string,
  today = businessDate(),
): boolean {
  return (
    filter === 'TODAS' ||
    (filter === 'RETIRADO'
      ? ['RETIRADO', 'REINGRESADO'].includes(obra.estadoProceso)
      : obraPresentationStatus(obra, today).key === filter)
  );
}

function rentalSortDate(obra: ObraCard): string {
  const date =
    obra.estadoProceso === 'PENDIENTE_ENTREGA' ? obra.fechaEntrega : obra.fechaRetiroEstimada;
  return isCalendarDate(date) ? date : '';
}

export type RentalRow =
  | { kind: 'section'; id: string; title: string; count: number }
  | { kind: 'rental'; id: string; obra: ObraCard };
/** Presentation only: never changes commercial dates, stock or technical states. */
export function rentalRows(obras: ObraCard[], today = businessDate()): RentalRow[] {
  const groups = [
    { keys: ['ROJO'], title: 'Vencidos' },
    { keys: ['AMARILLO'], title: 'Retiros de hoy' },
    { keys: ['PENDIENTE'], title: 'Por entregar' },
    { keys: ['VERDE'], title: 'Próximos retiros' },
    { keys: ['SIN_FECHA'], title: 'Sin fecha de retiro' },
    { keys: ['RETIRADO', 'REINGRESADO'], title: 'Retirados' },
  ];
  return groups.flatMap(({ keys, title }, index): RentalRow[] => {
    const items = obras
      .filter((o) => keys.includes(obraPresentationStatus(o, today).key))
      .sort(
        (a, b) => rentalSortDate(a).localeCompare(rentalSortDate(b)) || a.id.localeCompare(b.id),
      );
    return items.length
      ? [
          { kind: 'section', id: `group_${index}`, title, count: items.length },
          ...items.map((obra): RentalRow => ({ kind: 'rental', id: obra.id, obra })),
        ]
      : [];
  });
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
