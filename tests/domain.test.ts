import { describe, it, expect } from 'vitest';
import { seed, demoProfile } from '../src/data/seed';
import { applyOperation, assertState, undoReason } from '../src/domain/engine';
import {
  businessDate,
  quantity,
  trafficLight,
  validDate,
  obraStatus,
  authorize,
  matchesStatusFilter,
} from '../src/domain/rules';
import { remitoText, whatsappUrl, mapsUrl } from '../src/utils/whatsapp';
import type { Action, AppState, Operation } from '../src/types';
const now = new Date('2026-10-10T12:00:00Z'),
  admin = demoProfile('ADMIN'),
  operator = demoProfile('OPERADOR');
let seq = 0;
const op = (action: Action, actor = admin): Operation => ({
  id: `test_${++seq}`,
  createdAt: now.toISOString(),
  actor,
  action,
});
const apply = (s: AppState, a: Action, actor = admin) => applyOperation(s, op(a, actor), now);
const stockTotal = (s: AppState) =>
  s.materiales.reduce(
    (n, m) => n + m.cantidadGalpon + m.cantidadEnObra + m.cantidadEnTaller + m.cantidadPerdido,
    0,
  );
describe('Calendario y cantidades', () => {
  it('usa el calendario argentino en el límite de medianoche UTC', () => {
    expect(businessDate(new Date('2026-10-10T02:59:59Z'))).toBe('2026-10-09');
    expect(businessDate(new Date('2026-10-10T03:00:00Z'))).toBe('2026-10-10');
  });
  it.each([
    ['2026-10-09', 'ROJO'],
    ['2026-10-10', 'AMARILLO'],
    ['2026-10-11', 'VERDE'],
  ])('clasifica %s', (date, color) =>
    expect(
      trafficLight({ estadoProceso: 'ENTREGADO', fechaRetiroEstimada: date! }, '2026-10-10'),
    ).toBe(color),
  );
  it.each(['2026-02-29', '2026-13-01', '2026-04-31', '10/10/2026'])('rechaza fecha %s', (date) =>
    expect(() => validDate(date)).toThrow(),
  );
  it('acepta año bisiesto', () => expect(validDate('2028-02-29')).toBe('2028-02-29'));
  it.each([-1, 1.2, NaN, Infinity, 100001, '2', null])('rechaza cantidad %s', (n) =>
    expect(() => quantity(n)).toThrow(),
  );
  it.each([0, 1, 100000])('acepta entero %s', (n) => expect(quantity(n)).toBe(n));
  it('separa pendientes y cerradas del alquiler vigente', () => {
    const pending = seed(now).obras.find((o) => o.id === 'obra_5')!;
    expect(obraStatus(pending).key).toBe('PENDIENTE');
    expect(
      trafficLight({ ...pending, estadoProceso: 'RETIRADO', fechaRetiroEstimada: '2020-01-01' }),
    ).toBe('VERDE');
  });
});
describe('Inventario atómico', () => {
  it('semilla conserva el saldo de calle', () =>
    expect(() => assertState(seed(now))).not.toThrow());
  it('entrega descuenta galpón y aumenta calle una sola vez', () => {
    const before = seed(now),
      action = op({ type: 'DELIVER', obraId: 'obra_5', responsables: ['Fabián'] });
    const after = applyOperation(before, action, now);
    expect(after.materiales[0]!.cantidadGalpon).toBe(before.materiales[0]!.cantidadGalpon - 10);
    expect(after.materiales[0]!.cantidadEnObra).toBe(before.materiales[0]!.cantidadEnObra + 10);
    expect(applyOperation(after, action, now)).toBe(after);
    expect(() => apply(after, action.action)).toThrow();
    expect(stockTotal(after)).toBe(stockTotal(before));
  });
  it('rechaza faltante sin stock y no muta el original', () => {
    const before = seed(now),
      copy = JSON.stringify(before);
    expect(() =>
      apply(before, {
        type: 'REPORT',
        obraId: 'obra_1',
        incidents: [{ materialId: 'marco130', cantidad: 999, tipo: 'PERDIDO' }],
      }),
    ).toThrow();
    expect(JSON.stringify(before)).toBe(copy);
  });
  it('retira distribuyendo galpón, taller y perdido', () => {
    const before = seed(now);
    const after = apply(
      before,
      {
        type: 'RETIRE',
        obraId: 'obra_1',
        responsables: ['Flete Juan'],
        incidents: [
          { materialId: 'marco130', cantidad: 2, tipo: 'DANADO' },
          { materialId: 'marco130', cantidad: 3, tipo: 'PERDIDO' },
        ],
      },
      operator,
    );
    const m = after.materiales[0]!;
    expect(m.cantidadEnTaller).toBe(2);
    expect(m.cantidadPerdido).toBe(3);
    expect(m.cantidadGalpon - before.materiales[0]!.cantidadGalpon).toBe(11);
    expect(m.cantidadEnObra).toBe(before.materiales[0]!.cantidadEnObra - 16);
    expect(after.obras[0]!.saldosEnObra.marco130).toBe(0);
    expect(stockTotal(after)).toBe(stockTotal(before));
    expect(after.notificaciones[0]!.status).toBe('PENDING');
  });
  it('no descuenta dos veces daños registrados antes del retiro', () => {
    let s = seed(now);
    const total = stockTotal(s);
    s = apply(s, {
      type: 'REPORT',
      obraId: 'obra_1',
      incidents: [{ materialId: 'marco130', cantidad: 3, tipo: 'DANADO' }],
    });
    s = apply(s, { type: 'RETIRE', obraId: 'obra_1', responsables: ['Fabián'], incidents: [] });
    expect(s.materiales[0]!.cantidadEnTaller).toBe(3);
    expect(stockTotal(s)).toBe(total);
  });
  it('recuperación parcial auditada y sin sobregiro', () => {
    let s = apply(seed(now), {
      type: 'REPORT',
      obraId: 'obra_1',
      incidents: [{ materialId: 'marco130', cantidad: 3, tipo: 'PERDIDO' }],
    });
    const id = s.obras[0]!.faltantesRegistrados![0]!.id;
    s = apply(s, {
      type: 'RECOVER',
      obraId: 'obra_1',
      incidentId: id,
      cantidad: 2,
      motivo: 'Hallado y devuelto',
    });
    expect(s.materiales[0]!.cantidadPerdido).toBe(1);
    expect(s.logs[0]!.movimientos[0]!.destino).toBe('galpon');
    expect(() =>
      apply(s, {
        type: 'RECOVER',
        obraId: 'obra_1',
        incidentId: id,
        cantidad: 2,
        motivo: 'Duplicado',
      }),
    ).toThrow();
  });
  it('triangulación conserva el total y registra extremos', () => {
    const before = seed(now);
    const after = apply(
      before,
      {
        type: 'TRANSFER',
        obraId: 'obra_1',
        targetId: 'obra_2',
        materialId: 'marco130',
        cantidad: 4,
        motivo: 'Traslado directo',
        responsables: ['Fabián'],
      },
      operator,
    );
    expect(after.materiales).toEqual(before.materiales);
    expect(after.obras[0]!.saldosEnObra.marco130).toBe(12);
    expect(after.obras[1]!.saldosEnObra.marco130).toBe(12);
    expect(after.logs[0]!.movimientos[0]).toMatchObject({
      origen: 'obra:obra_1',
      destino: 'obra:obra_2',
      cantidad: 4,
    });
  });
  it('stock bajo permite preparar pero exige procedencia real al entregar', () => {
    let s = seed(now);
    s = apply(s, {
      type: 'SET_LOAD',
      obraId: 'obra_5',
      items: [{ materialId: 'marco130', nombre: 'Marco', cantidad: 70, medida: '1.30m' }],
    });
    expect(() => apply(s, { type: 'DELIVER', obraId: 'obra_5', responsables: ['Fabián'] })).toThrow(
      'Stock bajo',
    );
    const total = stockTotal(s),
      galpon = s.materiales[0]!.cantidadGalpon;
    s = apply(s, {
      type: 'DELIVER',
      obraId: 'obra_5',
      responsables: ['Fabián'],
      origins: [{ materialId: 'marco130', obraId: 'obra_1', cantidad: 70 - galpon }],
      motivo: 'Autorizado desde obra de origen',
    });
    expect(s.materiales[0]!.cantidadGalpon).toBe(0);
    expect(stockTotal(s)).toBe(total);
  });
  it('no permite duplicados ni medidas inconsistentes en la carga', () => {
    const s = seed(now),
      item = s.obras[4]!.materialesCargados[0]!;
    expect(() => apply(s, { type: 'SET_LOAD', obraId: 'obra_5', items: [item, item] })).toThrow();
  });
  it('transiciones explícitas y responsables obligatorios', () => {
    const s = seed(now);
    expect(() => apply(s, { type: 'REENTER', obraId: 'obra_1' })).toThrow();
    expect(() =>
      apply(s, { type: 'RETIRE', obraId: 'obra_5', responsables: ['Fabián'], incidents: [] }),
    ).toThrow();
    expect(() => apply(s, { type: 'DELIVER', obraId: 'obra_5', responsables: [] })).toThrow();
    expect(() =>
      apply(s, { type: 'DELIVER', obraId: 'obra_5', responsables: ['Persona no configurada'] }),
    ).toThrow();
  });
});
describe('Deshacer', () => {
  it('restaura estado e inventario sin borrar evidencia', () => {
    const before = seed(now),
      after = apply(before, { type: 'DELIVER', obraId: 'obra_5', responsables: ['Fabián'] }),
      log = after.logs[0]!;
    const reversal = op({ type: 'UNDO', logId: log.id });
    const reverted = applyOperation(after, reversal, new Date(now.getTime() + 299999));
    expect(reverted.materiales).toEqual(before.materiales);
    expect(reverted.obras[4]!.estadoProceso).toBe('PENDIENTE_ENTREGA');
    expect(reverted.logs).toHaveLength(2);
    expect(reverted.logs[1]!.undoneBy).toBe(reversal.id);
    expect(applyOperation(reverted, reversal, now)).toBe(reverted);
  });
  it('límite inclusivo de 5 minutos y actor original', () => {
    const s = apply(seed(now), { type: 'DELIVER', obraId: 'obra_5', responsables: ['Fabián'] }),
      log = s.logs[0]!;
    expect(undoReason(s, log, admin, new Date(now.getTime() + 300000))).toBeNull();
    expect(undoReason(s, log, admin, new Date(now.getTime() + 300001))).toContain('5 minutos');
    expect(undoReason(s, log, operator, now)).toContain('quien');
  });
  it('bloquea inversión tras otro movimiento', () => {
    const first = apply(seed(now), { type: 'DELIVER', obraId: 'obra_5', responsables: ['Fabián'] }),
      log = first.logs[0]!;
    const second = apply(first, {
      type: 'RETIRE',
      obraId: 'obra_1',
      responsables: ['Fabián'],
      incidents: [],
    });
    expect(undoReason(second, log, admin, now)).toContain('posteriores');
    expect(() => apply(second, { type: 'UNDO', logId: log.id })).toThrow();
  });
  it('avisos externos exigen corrección compensatoria', () => {
    const s = apply(seed(now), {
      type: 'REPORT',
      obraId: 'obra_1',
      incidents: [{ materialId: 'marco130', cantidad: 1, tipo: 'DANADO' }],
    });
    expect(s.logs[0]!.payloadInverso).toBeUndefined();
  });
});
describe('RBAC y remitos', () => {
  it.each<Action>([
    { type: 'DELETE_OBRA', obraId: 'obra_5' },
    {
      type: 'ADJUST',
      materialId: 'marco130',
      bucket: 'cantidadGalpon',
      delta: 10,
      motivo: 'Compra',
      procedencia: 'Proveedor',
    },
    { type: 'DELETE_COMBO', comboId: 'torre130' },
    { type: 'RESPONSABLES', nombres: ['Otro'] },
  ])('operador no ejecuta $type', (action) => {
    expect(() => authorize(operator, action)).toThrow();
    expect(() => apply(seed(now), action, operator)).toThrow();
    expect(() => authorize(admin, action)).not.toThrow();
  });
  it('ignora falsa cantidadGalpon en edición por esquema estricto', () => {
    const action = {
      type: 'SAVE_MATERIAL',
      material: { id: 'marco130', nombre: 'Nuevo', categoria: 'ANDAMIOS', cantidadGalpon: 900 },
    } as unknown as Action;
    expect(() => apply(seed(now), action)).toThrow();
  });
  it('remito en español, con datos y URL codificada', () => {
    const o = {
      ...seed(now).obras[0]!,
      clienteNombre: 'Cliente & Hijos',
      clienteTelefono: '+54 9 11 1234 5678',
    };
    const text = remitoText(o);
    expect(text).toContain('16 × Marco');
    expect(text).toContain('Fabián');
    expect(text).toContain('Cliente & Hijos');
    const url = new URL(whatsappUrl(o));
    expect(url.hostname).toBe('wa.me');
    expect(url.searchParams.get('text')).toBe(text);
    expect(url.pathname).toBe('/5491112345678');
  });
  it('no inventa teléfono ni coordenadas', () => {
    const o = seed(now).obras[0]!;
    expect(() => whatsappUrl(o)).toThrow();
    expect(new URL(mapsUrl(o)).searchParams.get('destination')).toContain(o.direccion);
  });
});

it('Retiradas agrupa retiros y reingresos sin incluir alquileres activos', () => {
  const o = seed(now).obras[0]!;
  expect(matchesStatusFilter({ ...o, estadoProceso: 'RETIRADO' }, 'RETIRADO')).toBe(true);
  expect(matchesStatusFilter({ ...o, estadoProceso: 'REINGRESADO' }, 'RETIRADO')).toBe(true);
  expect(matchesStatusFilter(o, 'RETIRADO')).toBe(false);
});

describe('Regresiones de integridad de la auditoría', () => {
  it('taller externo vuelve a galpón sin duplicarse ni consumir incidentes', () => {
    let s = apply(seed(now), {
      type: 'ADJUST',
      materialId: 'marco130',
      bucket: 'cantidadEnTaller',
      delta: 5,
      motivo: 'Recepción externa',
      procedencia: 'Lote externo',
    });
    const total = stockTotal(s),
      operation = op({
        type: 'MOVE_STOCK',
        materialId: 'marco130',
        origen: 'cantidadEnTaller',
        destino: 'cantidadGalpon',
        cantidad: 5,
        motivo: 'Reparación terminada',
      });
    s = applyOperation(s, operation, now);
    expect(stockTotal(s)).toBe(total);
    expect(s.materiales[0]!.cantidadEnTaller).toBe(0);
    expect(applyOperation(s, operation, now)).toBe(s);
    expect(() => applyOperation(s, { ...operation, id: 'other', actor: operator }, now)).toThrow(
      'administración',
    );
  });
  it('no consume piezas asociadas a faltantes desde el movimiento libre', () => {
    const s = apply(seed(now), {
      type: 'REPORT',
      obraId: 'obra_1',
      incidents: [{ materialId: 'marco130', cantidad: 2, tipo: 'DANADO' }],
    });
    expect(() =>
      apply(s, {
        type: 'MOVE_STOCK',
        materialId: 'marco130',
        origen: 'cantidadEnTaller',
        destino: 'cantidadGalpon',
        cantidad: 1,
        motivo: 'Incorrecto',
      }),
    ).toThrow('vinculados');
  });
  it('corrige pérdida registrada por error devolviendo al saldo de obra', () => {
    let s = apply(seed(now), {
      type: 'REPORT',
      obraId: 'obra_1',
      incidents: [{ materialId: 'marco130', cantidad: 2, tipo: 'PERDIDO' }],
    });
    const total = stockTotal(s);
    s = apply(s, {
      type: 'CORRECT_INCIDENT',
      obraId: 'obra_1',
      incidentId: s.obras[0]!.faltantesRegistrados![0]!.id,
      cantidad: 2,
      destino: 'obra',
      motivo: 'Conteo verificado: sigue en obra',
    });
    expect(stockTotal(s)).toBe(total);
    expect(s.obras[0]!.saldosEnObra.marco130).toBe(16);
    expect(s.materiales[0]!.cantidadPerdido).toBe(0);
  });
  it('medidas incompatibles no se cargan ni se triangulan como equivalentes', () => {
    const s = seed(now),
      item = s.obras[4]!.materialesCargados[0]!;
    expect(() =>
      apply(s, { type: 'SET_LOAD', obraId: 'obra_5', items: [{ ...item, medida: '70cm' }] }),
    ).toThrow('medida');
    s.obras[0]!.materialesCargados[0]!.medida = '70cm';
    expect(() =>
      apply(s, {
        type: 'DELIVER',
        obraId: 'obra_5',
        responsables: ['Fabián'],
        origins: [{ materialId: 'marco130', obraId: 'obra_1', cantidad: 1 }],
        motivo: 'Traslado',
      }),
    ).toThrow('medida');
  });
  it('entrega tardía conserva planificación y exige confirmar retiro coherente', () => {
    const s = seed(now);
    s.obras[4]!.fechaEntrega = '2026-09-01';
    s.obras[4]!.fechaRetiroEstimada = '2026-09-02';
    expect(() => apply(s, { type: 'DELIVER', obraId: 'obra_5', responsables: ['Fabián'] })).toThrow(
      'fecha de retiro',
    );
    const after = apply(s, {
      type: 'DELIVER',
      obraId: 'obra_5',
      responsables: ['Fabián'],
      fechaRetiroEstimada: '2026-10-12',
    });
    expect(after.obras[4]!.fechaEntrega).toBe('2026-09-01');
    expect(after.obras[4]!.fechaEntregaEfectiva).toBe('2026-10-10');
  });
  it('edición concurrente no sobreescribe ubicación ni metadatos', () => {
    const s = seed(now),
      o = s.obras[0]!;
    const form = {
      id: o.id,
      clienteNombre: 'Nuevo nombre',
      clienteTelefono: o.clienteTelefono,
      direccion: o.direccion,
      localidadBarrio: o.localidadBarrio,
      fechaEntrega: o.fechaEntrega,
      fechaRetiroEstimada: o.fechaRetiroEstimada,
    };
    const updated = apply(s, {
      type: 'LOCATION',
      obraId: o.id,
      coordenadas: { lat: -34, lng: -58 },
    });
    expect(() => apply(updated, { type: 'UPDATE_OBRA', obra: form, expectedVersion: 0 })).toThrow(
      'cambió',
    );
    expect(
      apply(updated, { type: 'UPDATE_OBRA', obra: form, expectedVersion: 1 }).obras[0]!.coordenadas,
    ).toEqual({ lat: -34, lng: -58 });
  });
});

it('ítem libre no inventa material maestro ni existencias', () => {
  const initial = seed(now);
  let s = apply(initial, {
    type: 'REPORT',
    obraId: 'obra_1',
    incidents: [
      {
        itemNombre: 'Candado ajeno al stock',
        cantidad: 1,
        tipo: 'PERDIDO',
        notas: 'Aviso informativo',
      },
    ],
  });
  expect(s.materiales).toEqual(initial.materiales);
  expect(s.notificaciones.at(-1)?.status).toBe('PENDING');
  s = apply(s, {
    type: 'RECOVER',
    obraId: 'obra_1',
    incidentId: s.obras[0]!.faltantesRegistrados!.at(-1)!.id,
    cantidad: 1,
    motivo: 'Encontrado en obra',
  });
  expect(s.materiales).toEqual(initial.materiales);
  expect(s.logs[0]!.movimientos).toHaveLength(0);
});

it('la entrega conserva quien recibió y deshacer restaura también ese dato', () => {
  const original = seed(now);
  const command = op({
    type: 'DELIVER',
    obraId: 'obra_5',
    responsables: ['Fabián'],
    recibidoPor: '  Ana Pérez  ',
  });
  const delivered = applyOperation(original, command, now);
  expect(delivered.obras.find((o) => o.id === 'obra_5')!.recibidoPor).toBe('Ana Pérez');
  expect(remitoText(delivered.obras.find((o) => o.id === 'obra_5')!)).toContain(
    'Recibió: Ana Pérez',
  );
  const undone = applyOperation(delivered, op({ type: 'UNDO', logId: delivered.logs[0]!.id }), now);
  expect(undone.obras.find((o) => o.id === 'obra_5')!.recibidoPor).toBeUndefined();
});
