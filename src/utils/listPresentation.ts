import type { ObraCard, ActivityLog } from '../types';
import { businessDate, obraStatus } from '../domain/rules';

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
    { keys: ['RETIRADO', 'REINGRESADO'], title: 'Retirados' },
  ];
  return groups.flatMap(({ keys, title }, index): RentalRow[] => {
    const items = obras
      .filter((o) => keys.includes(obraStatus(o, today).key))
      .sort(
        (a, b) =>
          (a.estadoProceso === 'PENDIENTE_ENTREGA'
            ? a.fechaEntrega
            : a.fechaRetiroEstimada
          ).localeCompare(
            b.estadoProceso === 'PENDIENTE_ENTREGA' ? b.fechaEntrega : b.fechaRetiroEstimada,
          ) || a.id.localeCompare(b.id),
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
