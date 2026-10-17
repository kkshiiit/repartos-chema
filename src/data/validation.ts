import { z } from 'zod';
import type { Envelope } from '../types';
import { actionSchema } from '../domain/schema';
import { assertState } from '../domain/engine';
import { ensure, measureKey, validDate } from '../domain/rules';
const id = z.string().regex(/^[a-zA-Z0-9_-]{1,100}$/);
const count = z.number().int().min(0).max(100000);
const timestamp = z.string().refine((s) => Number.isFinite(Date.parse(s)));
const date = z.string().refine((s) => {
  try {
    validDate(s);
    return true;
  } catch {
    return false;
  }
});
const profile = z.object({
  uid: id,
  nombre: z.string(),
  email: z.string(),
  role: z.enum(['ADMIN', 'OPERADOR']),
  createdAt: timestamp,
});
const material = z
  .object({
    id,
    nombre: z.string(),
    categoria: z.enum(['ANDAMIOS', 'TABLONES', 'ACCESORIOS', 'OTROS']),
    medida: z.string().optional(),
    cantidadGalpon: count,
    cantidadEnObra: count,
    cantidadEnTaller: count,
    cantidadPerdido: count,
  })
  .passthrough();
const load = z.object({
  materialId: id,
  nombre: z.string(),
  medida: z.string().optional(),
  cantidad: count,
  apodo: z.string().optional(),
});
const obra = z
  .object({
    id,
    clienteNombre: z.string(),
    clienteTelefono: z.string(),
    direccion: z.string(),
    localidadBarrio: z.string(),
    fechaEntrega: date,
    fechaRetiroEstimada: date,
    fechaRetiroEfectiva: date.optional(),
    fechaEntregaEfectiva: date.optional(),
    recibidoPor: z.string().max(80).optional(),
    estadoProceso: z.enum(['PENDIENTE_ENTREGA', 'ENTREGADO', 'RETIRADO', 'REINGRESADO']),
    estadoSemaphoro: z.enum(['VERDE', 'AMARILLO', 'ROJO']),
    syncStatus: z.enum(['SYNCED', 'PENDING']),
    materialesCargados: z.array(load),
    saldosEnObra: z.record(z.string(), count),
    updatedAt: timestamp,
    faltantesRegistrados: z
      .array(
        z
          .object({
            id,
            materialId: id.optional(),
            itemNombre: z.string(),
            cantidad: count,
            recuperado: count,
            tipo: z.enum(['PERDIDO', 'DANADO']),
            notas: z.string().optional(),
          })
          .passthrough(),
      )
      .optional(),
    fotos: z
      .array(
        z.object({
          id,
          uri: z.string(),
          status: z.enum(['PENDING', 'SYNCED']),
          usuarioUid: id,
          storagePath: z.string().optional(),
        }),
      )
      .optional(),
  })
  .passthrough();
const snapshot = z.object({
  obras: z.array(obra),
  materiales: z.array(material),
  combos: z.array(
    z
      .object({
        id,
        nombreCombo: z.string(),
        items: z.array(z.object({ materialId: id, cantidad: count })),
      })
      .passthrough(),
  ),
  responsables: z.array(z.string()),
  notificaciones: z.array(
    z
      .object({
        id,
        obraId: id,
        message: z.string(),
        status: z.enum(['PENDING', 'SENT', 'FAILED', 'EXHAUSTED']),
      })
      .passthrough(),
  ),
});
const state = snapshot.extend({
  revision: z.number().int().nonnegative(),
  appliedIds: z.array(id),
  logs: z.array(
    z
      .object({
        id,
        operationId: id,
        timestamp,
        usuarioUid: id,
        usuarioNombre: z.string(),
        accion: z.string(),
        movimientos: z.array(
          z.object({
            materialId: id,
            cantidad: count,
            origen: z.string(),
            destino: z.string(),
            motivo: z.string(),
          }),
        ),
        payloadInverso: z
          .object({ snapshot, expectedRevision: z.number().int().nonnegative() })
          .optional(),
      })
      .passthrough(),
  ),
});
const envelope = z.object({
  schema: z.literal(1),
  state,
  confirmed: state,
  queue: z.array(
    z.object({
      operation: z.object({ id, createdAt: timestamp, actor: profile, action: actionSchema }),
      status: z.enum(['PENDING', 'CONFLICT']),
      error: z.string().optional(),
    }),
  ),
});

// Solo para copias nuevas ya analizadas por parseEnvelope. El arranque conserva
// la tolerancia legacy para que el original siga disponible para recuperación.
export function validateImportEnvelope(e: Envelope): void {
  for (const s of [e.state, e.confirmed]) {
    const materials = new Map(s.materiales.map((m) => [m.id, m]));
    const comboIds = new Set<string>();
    const incidentIds = new Set<string>();
    const reservations = new Map<string, { taller: number; perdido: number }>();
    for (const combo of s.combos) {
      ensure(!comboIds.has(combo.id), 'La copia contiene combos con ID duplicado.');
      comboIds.add(combo.id);
      const components = new Set<string>();
      for (const item of combo.items) {
        ensure(materials.has(item.materialId), 'Un combo apunta a un material inexistente.');
        ensure(!components.has(item.materialId), 'Un combo contiene un material duplicado.');
        components.add(item.materialId);
      }
    }
    for (const work of s.obras) {
      const loadIds = new Set<string>();
      for (const item of work.materialesCargados) {
        const master = materials.get(item.materialId);
        ensure(master, 'Una carga apunta a un material inexistente.');
        ensure(!loadIds.has(item.materialId), 'Una carga contiene un material duplicado.');
        loadIds.add(item.materialId);
        ensure(
          measureKey(item.medida) === measureKey(master.medida),
          'La medida de una carga no coincide con el material maestro.',
        );
      }
      ensure(
        work.fechaRetiroEstimada >= work.fechaEntrega,
        'El retiro previsto no puede ser anterior a la entrega planificada.',
      );
      if (work.fechaEntregaEfectiva)
        ensure(
          work.fechaRetiroEstimada >= work.fechaEntregaEfectiva,
          'El retiro previsto no puede ser anterior a la entrega efectiva.',
        );
      if (work.fechaRetiroEfectiva)
        ensure(
          work.fechaRetiroEfectiva >= (work.fechaEntregaEfectiva || work.fechaEntrega),
          'El retiro efectivo no puede ser anterior a la entrega.',
        );
      for (const incident of work.faltantesRegistrados || []) {
        ensure(!incidentIds.has(incident.id), 'La copia contiene faltantes con ID duplicado.');
        incidentIds.add(incident.id);
        ensure(
          incident.recuperado <= incident.cantidad,
          'La cantidad recuperada de un faltante supera su cantidad registrada.',
        );
        // Los ítems libres son incidentes válidos sin relación con el stock.
        if (!incident.materialId) continue;
        ensure(materials.has(incident.materialId), 'Un faltante apunta a un material inexistente.');
        const reserved = reservations.get(incident.materialId) || { taller: 0, perdido: 0 };
        const bucket = incident.tipo === 'DANADO' ? 'taller' : 'perdido';
        reserved[bucket] += incident.cantidad - incident.recuperado;
        reservations.set(incident.materialId, reserved);
      }
    }
    for (const [id, reserved] of reservations) {
      const master = materials.get(id)!;
      ensure(
        reserved.taller <= master.cantidadEnTaller,
        'Las reservas por faltantes superan el stock en taller.',
      );
      ensure(
        reserved.perdido <= master.cantidadPerdido,
        'Las reservas por faltantes superan el stock perdido.',
      );
    }
  }
}

export function parseEnvelope(raw: string): Envelope {
  try {
    const data: unknown = JSON.parse(raw);
    envelope.parse(data);
    const e = data as Envelope;
    assertState(e.state);
    assertState(e.confirmed);
    if (new Set(e.queue.map((q) => q.operation.id)).size !== e.queue.length)
      throw new Error('Cola duplicada');
    return e;
  } catch {
    throw new Error(
      'Datos locales dañados o incompatibles. Se conserva el original; no se restablecerá el inventario. Exporta una copia y solicita revisión.',
    );
  }
}
