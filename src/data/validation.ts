import { z } from 'zod';
import type { Envelope } from '../types';
import { actionSchema } from '../domain/schema';
import { assertState } from '../domain/engine';
import { validDate } from '../domain/rules';
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
            materialId: id,
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
