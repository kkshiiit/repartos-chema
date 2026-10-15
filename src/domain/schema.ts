import { z } from 'zod';
const id = z.string().regex(/^[a-zA-Z0-9_-]{1,100}$/),
  text = z.string().min(1).max(200),
  quantity = z.number().int().min(0).max(100000),
  coord = z
    .object({ lat: z.number().min(-90).max(90), lng: z.number().min(-180).max(180) })
    .strict();
const obra = z
  .object({
    id,
    clienteNombre: text,
    clienteTelefono: z.string().max(25),
    direccion: text,
    localidadBarrio: text,
    fechaEntrega: z.string().max(10),
    fechaRetiroEstimada: z.string().max(10),
    coordenadas: coord.optional(),
    observaciones: z.string().max(1000).optional(),
  })
  .strict();
const load = z
  .object({
    materialId: id,
    nombre: text,
    medida: z.string().max(30).optional(),
    cantidad: quantity,
    apodo: z.string().max(80).optional(),
  })
  .strict();
const incident = z
  .object({
    materialId: id.optional(),
    cantidad: quantity,
    tipo: z.enum(['PERDIDO', 'DANADO']),
    notas: z.string().max(500).optional(),
    itemNombre: z.string().max(100).optional(),
  })
  .strict();
const responsables = z.array(z.string().min(1).max(80)).max(10);
export const actionSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('CREATE_OBRA'), obra }).strict(),
  z
    .object({
      type: z.literal('UPDATE_OBRA'),
      obra,
      expectedVersion: z.number().int().nonnegative().optional(),
    })
    .strict(),
  z.object({ type: z.literal('DELETE_OBRA'), obraId: id }).strict(),
  z
    .object({
      type: z.literal('SET_LOAD'),
      obraId: id,
      items: z.array(load).max(100),
      expectedVersion: z.number().int().nonnegative().optional(),
    })
    .strict(),
  z
    .object({
      type: z.literal('DELIVER'),
      recibidoPor: z.string().trim().max(80).optional(),
      fechaRetiroEstimada: z.string().max(10).optional(),
      obraId: id,
      responsables,
      origins: z
        .array(z.object({ materialId: id, obraId: id, cantidad: quantity }).strict())
        .max(100)
        .optional(),
      motivo: text.optional(),
    })
    .strict(),
  z
    .object({
      type: z.literal('RETIRE'),
      obraId: id,
      responsables,
      incidents: z.array(incident).max(100),
    })
    .strict(),
  z
    .object({ type: z.literal('REPORT'), obraId: id, incidents: z.array(incident).max(100) })
    .strict(),
  z
    .object({
      type: z.literal('RECOVER'),
      obraId: id,
      incidentId: id,
      cantidad: quantity,
      motivo: text,
    })
    .strict(),
  z.object({ type: z.literal('REENTER'), obraId: id }).strict(),
  z.object({ type: z.literal('REACTIVATE'), obraId: id }).strict(),
  z
    .object({
      type: z.literal('TRANSFER'),
      obraId: id,
      targetId: id,
      materialId: id,
      cantidad: quantity,
      motivo: text,
      responsables,
    })
    .strict(),
  z
    .object({
      type: z.literal('SAVE_MATERIAL'),
      expectedVersion: z.number().int().nonnegative().optional(),
      material: z
        .object({
          id,
          nombre: z.string().min(1).max(80),
          medida: z.string().max(30).optional(),
          categoria: z.enum(['ANDAMIOS', 'TABLONES', 'ACCESORIOS', 'OTROS']),
        })
        .strict(),
    })
    .strict(),
  z
    .object({
      type: z.literal('ADJUST'),
      materialId: id,
      bucket: z.enum(['cantidadGalpon', 'cantidadEnTaller', 'cantidadPerdido']),
      delta: z.number().int().min(-100000).max(100000),
      motivo: text,
      procedencia: text,
    })
    .strict(),
  z
    .object({
      type: z.literal('SAVE_COMBO'),
      expectedVersion: z.number().int().nonnegative().optional(),
      combo: z
        .object({
          id,
          version: z.number().int().nonnegative().optional(),
          nombreCombo: z.string().min(1).max(80),
          items: z.array(z.object({ materialId: id, cantidad: quantity }).strict()).max(100),
        })
        .strict(),
    })
    .strict(),
  z
    .object({
      type: z.literal('MOVE_STOCK'),
      materialId: id,
      origen: z.enum(['cantidadGalpon', 'cantidadEnTaller', 'cantidadPerdido']),
      destino: z.enum(['cantidadGalpon', 'cantidadEnTaller', 'cantidadPerdido']),
      cantidad: quantity,
      motivo: text,
    })
    .strict(),
  z
    .object({
      type: z.literal('CORRECT_INCIDENT'),
      obraId: id,
      incidentId: id,
      cantidad: quantity,
      destino: z.enum(['obra', 'taller', 'perdido']),
      motivo: text,
    })
    .strict(),
  z.object({ type: z.literal('DELETE_COMBO'), comboId: id }).strict(),
  z
    .object({
      type: z.literal('RESPONSABLES'),
      nombres: z.array(z.string().min(1).max(80)).max(50),
    })
    .strict(),
  z
    .object({
      type: z.literal('PHOTO'),
      obraId: id,
      photo: z
        .object({
          id,
          uri: z.string().max(1500000),
          status: z.enum(['PENDING', 'SYNCED']),
          storagePath: z.string().max(500).optional(),
          usuarioUid: id,
        })
        .strict(),
    })
    .strict(),
  z.object({ type: z.literal('DELETE_PHOTO'), obraId: id, photoId: id }).strict(),
  z.object({ type: z.literal('LOCATION'), obraId: id, coordenadas: coord }).strict(),
  z.object({ type: z.literal('UNDO'), logId: id }).strict(),
]);
export const commandSchema = z.object({ id, action: actionSchema }).strict();
