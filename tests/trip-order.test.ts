import { describe, expect, it } from 'vitest';
import type { ObraCard } from '../src/types';
import {
  eligibleTripStops,
  materialQuantity,
  permuteVisibleTripIds,
  reconcileTripSequence,
  sortTripByDistance,
  sortTripByMaterial,
  visibleTripStops,
  moveTripStop,
} from '../src/domain/tripOrder';
const stop = (
  id: string,
  status: ObraCard['estadoProceso'] = 'ENTREGADO',
  quantity = 3,
  lng?: number,
): ObraCard => ({
  id,
  clienteNombre: id,
  clienteTelefono: '',
  direccion: `Dirección ${id}`,
  localidadBarrio: id === 'X' ? 'Otro' : 'Centro',
  ...(lng === undefined ? {} : { coordenadas: { lat: -34.55, lng } }),
  estadoSemaphoro: 'VERDE',
  materialesCargados: [
    { materialId: 'marco', nombre: 'Marco', medida: '1.30m', cantidad: quantity },
  ],
  fechaEntrega: '2026-10-25',
  fechaRetiroEstimada: '2026-10-26',
  estadoProceso: status,
  syncStatus: 'PENDING',
  saldosEnObra: { marco: quantity },
  updatedAt: '2026-10-26T10:00:00Z',
});
describe('secuencia personal de Viaje', () => {
  it('sólo ofrece entregas con carga positiva y retiros con saldo, sin inventar cierre', () => {
    const works = [
      stop('A'),
      stop('X', 'PENDIENTE_ENTREGA'),
      stop('vacio', 'ENTREGADO', 0),
      stop('preparar', 'PENDIENTE_ENTREGA', 0),
      stop('cerrado', 'RETIRADO'),
      stop('final', 'REINGRESADO'),
    ];
    const before = JSON.stringify(works);
    expect(eligibleTripStops(works).map((s) => s.id)).toEqual(['A', 'X']);
    expect(JSON.stringify(works)).toBe(before);
  });
  it('reconcilia repetidas/cerradas y agrega nuevas sin resucitar al deshacer viejo', () => {
    expect(reconcileTripSequence(['B', 'vieja', 'A', 'B'], ['A', 'B', 'C'])).toEqual([
      'B',
      'A',
      'C',
    ]);
    expect(reconcileTripSequence(['vieja', 'B', 'A'], ['A', 'C'])).toEqual(['A', 'C']);
  });
  it('reordenar filtradas permuta sólo las posiciones visibles y conserva ocultas', () => {
    const all = ['A', 'X', 'B', 'Y'];
    expect(permuteVisibleTripIds(all, ['B', 'A'])).toEqual(['B', 'X', 'A', 'Y']);
    expect(all).toEqual(['A', 'X', 'B', 'Y']);
    expect(() => permuteVisibleTripIds(all, ['A', 'A'])).toThrow();
    expect(() => permuteVisibleTripIds(all, ['no-existe'])).toThrow();
  });
  it('filtros combinados no alteran la secuencia completa', () => {
    const all = ['A', 'X', 'B', 'Y'];
    const stops = eligibleTripStops([
      stop('A'),
      stop('X', 'PENDIENTE_ENTREGA'),
      stop('B'),
      stop('Y', 'PENDIENTE_ENTREGA'),
    ]);
    expect(
      visibleTripStops(all, stops, { task: 'RETIRE', zone: 'TODAS' }).map((s) => s.id),
    ).toEqual(['A', 'B']);
    expect(
      visibleTripStops(all, stops, { task: 'DELIVER', zone: 'Centro' }).map((s) => s.id),
    ).toEqual(['Y']);
    expect(visibleTripStops(all, stops, { task: 'ALL', zone: 'TODAS' }).map((s) => s.id)).toEqual(
      all,
    );
  });
  it('cercanía estricta, empates estables y desconocidos al final sin falsos ceros', () => {
    const stops = eligibleTripStops([
      stop('lejos', 'ENTREGADO', 6, -58.8),
      stop('cerca', 'PENDIENTE_ENTREGA', 3, -58.57),
      stop('sin'),
      stop('empate', 'ENTREGADO', 3, -58.57),
    ]);
    const before = JSON.stringify(stops);
    expect(sortTripByDistance(stops, { lat: -34.55, lng: -58.57 }).ids).toEqual([
      'cerca',
      'empate',
      'lejos',
      'sin',
    ]);
    expect(sortTripByDistance(stops, null).error).toMatch(/origen/);
    expect(sortTripByDistance(eligibleTripStops([stop('sin')]), { lat: 0, lng: 0 }).error).toMatch(
      /ubicación/,
    );
    expect(JSON.stringify(stops)).toBe(before);
  });
  it('cantidades comparan material y medida: saldo real, no carga histórica ni piezas mezcladas', () => {
    const three = stop('tres', 'PENDIENTE_ENTREGA', 3);
    const six = stop('seis', 'ENTREGADO', 30);
    six.saldosEnObra.marco = 6;
    const zero = stop('cero');
    zero.saldosEnObra.marco = 0;
    zero.saldosEnObra.rueda = 2;
    zero.materialesCargados.push({ materialId: 'rueda', nombre: 'Rueda', cantidad: 2 });
    const missing = stop('otro');
    missing.materialesCargados[0]!.medida = '70cm';
    const stops = eligibleTripStops([six, missing, three, zero]);
    const basis = { materialId: 'marco', medida: '1.30m' };
    expect(
      materialQuantity(
        stops.find((s) => s.id === 'seis')!,
        basis,
      ),
    ).toBe(6);
    expect(
      materialQuantity(
        stops.find((s) => s.id === 'otro')!,
        basis,
      ),
    ).toBeNull();
    expect(sortTripByMaterial(stops, basis, 'ASC').ids).toEqual(['cero', 'tres', 'seis', 'otro']);
    expect(sortTripByMaterial(stops, basis, 'DESC').ids).toEqual(['seis', 'tres', 'cero', 'otro']);
    expect(sortTripByMaterial(stops, { materialId: 'faltante' }, 'ASC').error).toMatch(/material/);
  });
  it('mover a posición directa valida enteros y no omite IDs', () => {
    expect(moveTripStop(['A', 'B', 'C'], 'C', 1)).toEqual(['C', 'A', 'B']);
    expect(() => moveTripStop(['A', 'B'], 'B', 0)).toThrow();
    expect(() => moveTripStop(['A', 'B'], 'B', 1.5)).toThrow();
  });
});
