import { describe, expect, it } from 'vitest';
import { seed } from '../src/data/seed';
import {
  rentalRows,
  rentalTaskForDate,
  matchesRentalSearch,
  matchesPresentationStatusFilter,
  rentalMaterialPreview,
} from '../src/utils/listPresentation';

const today = '2026-12-31';
const state = () => seed(new Date('2026-12-31T15:00:00Z'));
describe('tareas de alquiler en el calendario del negocio', () => {
  it('Hoy incluye entrega prevista y retiro, sin duplicar ni cambiar stock', () => {
    const s = state();
    const before = JSON.stringify(s);
    const results = s.obras.filter((o) => matchesPresentationStatusFilter(o, 'HOY', today));
    expect(results.map((o) => o.id)).toEqual(['obra_2', 'obra_3', 'obra_5']);
    const rows = rentalRows(results, today);
    expect(rows.filter((r) => r.kind === 'section')).toEqual([
      { kind: 'section', id: 'group_today', title: 'Tareas de hoy', count: 3 },
    ]);
    expect(new Set(rows.filter((r) => r.kind === 'rental').map((r) => r.id)).size).toBe(3);
    expect(JSON.stringify(s)).toBe(before);
  });
  it('una entrega atrasada usa su fecha prevista, no el final del alquiler', () => {
    const o = state().obras[4]!;
    o.fechaEntrega = '2026-12-29';
    o.fechaRetiroEstimada = '2027-01-07';
    expect(rentalTaskForDate(o, today)).toMatchObject({
      kind: 'DELIVER',
      group: 'overdue',
      date: '2026-12-29',
      label: 'Entrega atrasada · 2 días',
    });
    expect(matchesPresentationStatusFilter(o, 'ATRASADOS', today)).toBe(true);
    expect(matchesPresentationStatusFilter(o, 'ROJO', today)).toBe(false);
  });
  it('mismo día, mañana y cambio de año se derivan de fechas civiles', () => {
    const o = state().obras[0]!;
    o.fechaRetiroEstimada = '2027-01-01';
    expect(rentalTaskForDate(o, today)).toMatchObject({
      label: 'Retirar mañana',
      group: 'upcoming',
    });
    expect(rentalTaskForDate(o, '2027-01-01')).toMatchObject({
      label: 'Retirar hoy',
      group: 'today',
    });
    expect(rentalTaskForDate(o, '2027-01-02')).toMatchObject({
      label: 'Retiro atrasado · 1 día',
      group: 'overdue',
    });
  });
  it('finalizados no conservan una tarea pendiente y fechas legacy no se inventan', () => {
    const o = state().obras[0]!;
    o.estadoProceso = 'REINGRESADO';
    expect(rentalTaskForDate(o, today)).toMatchObject({
      kind: 'FINISHED',
      group: 'finished',
      label: 'Reingresado',
    });
    expect(matchesPresentationStatusFilter(o, 'HOY', today)).toBe(false);
    o.estadoProceso = 'ENTREGADO';
    o.fechaRetiroEstimada = '2027-02-30';
    expect(rentalTaskForDate(o, today)).toMatchObject({
      date: null,
      group: 'undated',
      label: 'Sin fecha de retiro',
    });
  });
  it('busca localidad y dirección con mayúsculas, acentos y espacios sin filtrar por IDs', () => {
    const o = state().obras[0]!;
    o.clienteNombre = 'Martín Suárez';
    o.direccion = 'Calle de Prueba 1240';
    o.localidadBarrio = 'José León Suárez';
    expect(matchesRentalSearch(o, 'jose leon')).toBe(true);
    expect(matchesRentalSearch(o, '  CALLE   de prueba  ')).toBe(true);
    expect(matchesRentalSearch(o, 'martin')).toBe(true);
    expect(matchesRentalSearch(o, 'obra_1')).toBe(false);
  });
  it('resume nombre y medida de material con saldo actual sin alterar la carga histórica', () => {
    const o = state().obras[0]!;
    o.saldosEnObra = { marco130: 2, tablon: 0, nuevo: 3 };
    const materials = [
      ...state().materiales,
      {
        id: 'nuevo',
        nombre: 'Rueda giratoria',
        categoria: 'ACCESORIOS' as const,
        medida: '20cm',
        cantidadGalpon: 0,
        cantidadEnObra: 3,
        cantidadEnTaller: 0,
        cantidadPerdido: 0,
      },
    ];
    expect(rentalMaterialPreview(o, materials)).toBe('2 × Marco de andamio · 1.30m · +1 material');
    expect(o.materialesCargados[0]!.cantidad).toBe(16);
  });
});
