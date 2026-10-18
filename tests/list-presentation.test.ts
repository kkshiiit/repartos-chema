import { describe, expect, it } from 'vitest';
import { seed } from '../src/data/seed';
import { rentalRows, rentalSummary, historyRows } from '../src/utils/listPresentation';
import type { ActivityLog } from '../src/types';
const today = '2026-10-18';
describe('agrupación operativa de listas', () => {
  it('prioriza vencidos y retiros de hoy sin alterar datos ni duplicar alquileres', () => {
    const state = seed(new Date(`${today}T15:00:00Z`));
    const before = JSON.stringify(state);
    const rows = rentalRows(state.obras, today);
    expect(rows.filter((r) => r.kind === 'section').map((r) => r.title)).toEqual([
      'Vencidos',
      'Retiros de hoy',
      'Por entregar',
      'Próximos retiros',
    ]);
    expect(rows.filter((r) => r.kind === 'rental').map((r) => r.id)).toEqual([
      'obra_1',
      'obra_2',
      'obra_3',
      'obra_5',
      'obra_4',
      'obra_6',
    ]);
    expect(JSON.stringify(state)).toBe(before);
  });
  it('agrupa retirado y reingresado juntos, con IDs estables', () => {
    const state = seed(new Date(`${today}T15:00:00Z`));
    state.obras[0].estadoProceso = 'REINGRESADO';
    state.obras[1].estadoProceso = 'RETIRADO';
    const rows = rentalRows(state.obras, today);
    expect(rows.filter((r) => r.kind === 'section').at(-1)?.title).toBe('Retirados');
    expect(rows.filter((r) => r.kind === 'section').some((r) => r.title === 'Cerradas')).toBe(
      false,
    );
  });
  it('resumen usa saldo actual incluido lo triangulado y conserva carga histórica', () => {
    const o = seed().obras[0];
    o.saldosEnObra = { marco130: 2, extra: 3 };
    expect(rentalSummary(o)).toBe('5 piezas · 2 tipos');
    expect(o.materialesCargados[0].cantidad).toBe(16);
  });
  it('cronología respeta el calendario argentino alrededor de medianoche y año', () => {
    const logs = [
      { id: '1', timestamp: '2027-01-01T01:00:00Z' },
      { id: '2', timestamp: '2027-01-01T04:00:00Z' },
    ] as ActivityLog[];
    const rows = historyRows(logs, '2027-01-01');
    expect(rows.filter((r) => r.kind === 'section').map((r) => r.title)).toEqual([
      'Hoy · 1 ene 2027',
      'Ayer · 31 dic 2026',
    ]);
    expect(rows.filter((r) => r.kind === 'activity').map((r) => r.id)).toEqual(['2', '1']);
  });
});
