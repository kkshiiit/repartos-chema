import type {
  AppState,
  DomainSnapshot,
  IncidentInput,
  MaterialCargado,
  ObraCard,
  Operation,
  Movement,
  UserProfile,
  ActivityLog,
} from '../types';
import { commandSchema } from './schema';
import {
  adminActions,
  authorize,
  businessDate,
  coordinates,
  ensure,
  quantity,
  required,
  trafficLight,
  validDate,
  validId,
  measureKey,
} from './rules';
export const clone = <T>(x: T): T => JSON.parse(JSON.stringify(x)) as T;
export function snapshot(s: AppState): DomainSnapshot {
  return clone({
    obras: s.obras,
    materiales: s.materiales,
    combos: s.combos,
    responsables: s.responsables,
    notificaciones: s.notificaciones,
  });
}
export function undoReason(
  state: AppState,
  log: ActivityLog,
  actor: UserProfile,
  now = new Date(),
): string | null {
  if (log.requiredRole === 'ADMIN' && actor.role !== 'ADMIN')
    return 'Esta reversión requiere el rol de administración original.';
  if (log.usuarioUid !== actor.uid) return 'Solo puede deshacer quien registró la acción.';
  const elapsed = now.getTime() - new Date(log.timestamp).getTime();
  if (elapsed < 0 || elapsed > 300000)
    return 'Pasaron 5 minutos. Registra una corrección compensatoria.';
  if (log.undoneBy) return 'Esta acción ya fue deshecha.';
  if (!log.payloadInverso) return 'Esta acción no admite deshacer. Registra una corrección.';
  if (state.revision !== log.payloadInverso.expectedRevision)
    return 'Hay cambios posteriores. Usa recuperación, transferencia o ajuste con motivo.';
  return null;
}
export function mergeLoads(
  existing: MaterialCargado[],
  incoming: MaterialCargado[],
): MaterialCargado[] {
  const map = new Map(existing.map((i) => [i.materialId, clone(i)]));
  for (const item of incoming) {
    const prior = map.get(item.materialId);
    if (prior) {
      ensure(
        measureKey(prior.medida) === measureKey(item.medida),
        'La medida no coincide con la carga existente.',
      );
      prior.cantidad = quantity(prior.cantidad + item.cantidad);
    } else map.set(item.materialId, clone(item));
  }
  return [...map.values()];
}
export function assertState(s: AppState) {
  ensure(
    new Set(s.materiales.map((m) => m.id)).size === s.materiales.length,
    'Materiales duplicados.',
  );
  ensure(new Set(s.obras.map((o) => o.id)).size === s.obras.length, 'Obras duplicadas.');
  for (const m of s.materiales) {
    validId(m.id);
    [m.cantidadGalpon, m.cantidadEnObra, m.cantidadEnTaller, m.cantidadPerdido].forEach((n) =>
      quantity(n),
    );
    const inWorks = s.obras.reduce((n, o) => n + (o.saldosEnObra[m.id] || 0), 0);
    ensure(inWorks === m.cantidadEnObra, `Saldo inconsistente de ${m.nombre}.`);
  }
  for (const o of s.obras)
    for (const [id, n] of Object.entries(o.saldosEnObra)) {
      quantity(n);
      ensure(
        s.materiales.some((m) => m.id === id),
        'Saldo sin material maestro.',
      );
      if (o.estadoProceso !== 'ENTREGADO')
        ensure(n === 0, 'Una obra inactiva conserva material en calle.');
    }
}
export function applyOperation(current: AppState, op: Operation, now = new Date()): AppState {
  validId(op.id);
  const parsed = commandSchema.safeParse({ id: op.id, action: op.action });
  ensure(
    parsed.success,
    'Los datos de la operación no son válidos. Revisa campos, cantidades y límites.',
  );
  authorize(op.actor, op.action);
  if (current.appliedIds.includes(op.id)) return current;
  const s = clone(current),
    before = snapshot(current),
    a = op.action,
    movements: Movement[] = [];
  let obraId: string | undefined = 'obraId' in a ? a.obraId : undefined;
  let summary = '';
  const touched = new Set<string>();
  const getObra = (id: string) => {
    const o = s.obras.find((x) => x.id === id);
    ensure(o, 'Obra no encontrada.');
    touched.add(id);
    return o;
  };
  const material = (id: string) => {
    const m = s.materiales.find((x) => x.id === id);
    ensure(m, 'Material no encontrado.');
    return m;
  };
  const drivers = (names: string[]) => {
    ensure(names.length > 0 && names.length <= 10, 'Selecciona responsables.');
    const result = [...new Set(names.map((n) => required(n, 'Responsable', 80)))];
    ensure(
      result.every((n) => s.responsables.includes(n)),
      'Responsable no configurado.',
    );
    return result;
  };
  const move = (id: string, n: number, from: string, to: string, reason: string) => {
    quantity(n, true);
    movements.push({
      materialId: id,
      materialNombre: material(id).nombre,
      cantidad: n,
      origen: from,
      destino: to,
      motivo: reason,
    });
  };
  const checkObra = (o: {
    id: string;
    clienteNombre: string;
    clienteTelefono: string;
    direccion: string;
    localidadBarrio: string;
    fechaEntrega: string;
    fechaRetiroEstimada: string;
    coordenadas?: { lat: number; lng: number };
  }) => {
    validId(o.id);
    required(o.clienteNombre, 'Cliente');
    required(o.direccion, 'Dirección');
    required(o.localidadBarrio, 'Zona');
    ensure(
      o.clienteTelefono === '' || /^\+?[\d\s()-]{8,25}$/.test(o.clienteTelefono),
      'Teléfono inválido. Usa código de país.',
    );
    validDate(o.fechaEntrega);
    validDate(o.fechaRetiroEstimada);
    ensure(
      o.fechaRetiroEstimada >= o.fechaEntrega,
      'El retiro debe ser posterior o igual a la entrega.',
    );
    if (o.coordenadas) coordinates(o.coordenadas);
  };
  const incidents = (o: ObraCard, items: IncidentInput[]) => {
    ensure(items.length <= 100, 'Demasiados faltantes.');
    for (const [index, i] of items.entries()) {
      quantity(i.cantidad, true);
      ensure(['PERDIDO', 'DANADO'].includes(i.tipo), 'Tipo inválido.');
      if (!i.materialId) {
        (o.faltantesRegistrados ??= []).push({
          id: `${op.id}_${index}`,
          itemNombre: required(i.itemNombre || '', 'Ítem fuera del inventario', 100),
          cantidad: i.cantidad,
          tipo: i.tipo,
          notas: i.notas || '',
          recuperado: 0,
        });
        continue;
      }
      const m = material(i.materialId);
      ensure(
        (o.saldosEnObra[m.id] || 0) >= i.cantidad,
        `El faltante de ${m.nombre} supera el saldo de la obra.`,
      );
      o.saldosEnObra[m.id]! -= i.cantidad;
      m.cantidadEnObra -= i.cantidad;
      const bucket = i.tipo === 'DANADO' ? 'cantidadEnTaller' : 'cantidadPerdido';
      m[bucket] += i.cantidad;
      (o.faltantesRegistrados ??= []).push({
        id: `${op.id}_${index}`,
        materialId: m.id,
        itemNombre: i.itemNombre?.trim() || m.nombre,
        cantidad: i.cantidad,
        tipo: i.tipo,
        notas: i.notas?.slice(0, 500) || '',
        recuperado: 0,
      });
      move(
        m.id,
        i.cantidad,
        `obra:${o.id}`,
        i.tipo === 'DANADO' ? 'taller' : 'perdido',
        i.notas || 'Inspección',
      );
    }
    if (items.length)
      s.notificaciones.push({
        id: op.id,
        obraId: o.id,
        message: `Faltantes en ${o.clienteNombre}`,
        status: 'PENDING',
      });
  };
  const unlinked = (
    id: string,
    bucket: 'cantidadGalpon' | 'cantidadEnTaller' | 'cantidadPerdido',
  ) => {
    const reserved =
      bucket === 'cantidadGalpon'
        ? 0
        : s.obras.reduce(
            (sum, o) =>
              sum +
              (o.faltantesRegistrados || [])
                .filter(
                  (i) =>
                    i.materialId === id &&
                    (i.tipo === 'DANADO' ? 'cantidadEnTaller' : 'cantidadPerdido') === bucket,
                )
                .reduce((n, i) => n + i.cantidad - i.recuperado, 0),
            0,
          );
    return material(id)[bucket] - reserved;
  };
  switch (a.type) {
    case 'CREATE_OBRA': {
      checkObra(a.obra);
      ensure(!s.obras.some((o) => o.id === a.obra.id), 'La obra ya existe.');
      s.obras.push({
        ...clone(a.obra),
        estadoSemaphoro: 'VERDE',
        materialesCargados: [],
        estadoProceso: 'PENDIENTE_ENTREGA',
        syncStatus: 'PENDING',
        saldosEnObra: {},
        updatedAt: now.toISOString(),
      });
      obraId = a.obra.id;
      touched.add(obraId);
      summary = 'Creó una obra';
      break;
    }
    case 'UPDATE_OBRA': {
      checkObra(a.obra);
      const o = getObra(a.obra.id);
      ensure(
        a.expectedVersion === (o.version || 0),
        'La obra cambió desde que abriste el formulario. Reabre y revisa los cambios.',
      );
      if (o.fechaEntregaEfectiva)
        ensure(
          a.obra.fechaRetiroEstimada >= o.fechaEntregaEfectiva,
          'El retiro no puede preceder la entrega efectiva.',
        );
      Object.assign(o, clone(a.obra));
      obraId = o.id;
      summary = 'Editó datos de obra';
      break;
    }
    case 'DELETE_OBRA': {
      const o = getObra(a.obraId);
      ensure(
        ['PENDIENTE_ENTREGA', 'REINGRESADO'].includes(o.estadoProceso),
        'Solo se eliminan obras pendientes o reingresadas.',
      );
      ensure(
        !o.faltantesRegistrados?.some((i) => i.recuperado < i.cantidad),
        'Recupera o conserva los faltantes antes de eliminar.',
      );
      s.obras = s.obras.filter((x) => x.id !== o.id);
      summary = `Borró el alquiler de ${o.clienteNombre}`;
      break;
    }
    case 'SET_LOAD': {
      const o = getObra(a.obraId);
      ensure(o.estadoProceso === 'PENDIENTE_ENTREGA', 'La carga solo se edita antes de entregar.');
      if (a.expectedVersion !== undefined)
        ensure(a.expectedVersion === (o.version || 0), 'La carga cambió. Reabre el formulario.');
      ensure(a.items.length <= 100, 'Máximo 100 materiales.');
      ensure(
        new Set(a.items.map((i) => i.materialId)).size === a.items.length,
        'No dupliques materiales; suma las cantidades.',
      );
      o.materialesCargados = a.items.map((i) => {
        const m = material(i.materialId);
        quantity(i.cantidad, true);
        ensure(
          measureKey(i.medida) === measureKey(m.medida),
          'La medida debe coincidir con el material maestro. Selecciona la variante correcta.',
        );
        if (i.medida) required(i.medida, 'Medida', 30);
        if (i.apodo) required(i.apodo, 'Apodo', 80);
        return { ...clone(i), nombre: m.nombre };
      });
      summary = 'Actualizó la carga';
      break;
    }
    case 'DELIVER': {
      const o = getObra(a.obraId);
      ensure(o.estadoProceso === 'PENDIENTE_ENTREGA', 'La obra ya fue entregada o está cerrada.');
      ensure(o.materialesCargados.length, 'Agrega materiales a la carga.');
      const names = drivers(a.responsables);
      if (a.fechaRetiroEstimada) o.fechaRetiroEstimada = validDate(a.fechaRetiroEstimada);
      ensure(
        o.fechaRetiroEstimada >= o.fechaEntrega,
        'El retiro previsto no puede ser anterior a la entrega planificada.',
      );
      ensure(
        o.fechaRetiroEstimada >= businessDate(now),
        'Revisa la fecha de retiro: precede la entrega efectiva de hoy.',
      );
      const origins = a.origins || [];
      ensure(
        new Set(origins.map((x) => x.materialId)).size === origins.length,
        'Una procedencia por material.',
      );
      ensure(
        origins.every((x) => o.materialesCargados.some((i) => i.materialId === x.materialId)),
        'Procedencia ajena a la carga.',
      );
      for (const i of o.materialesCargados) {
        const m = material(i.materialId);
        ensure(
          measureKey(i.medida) === measureKey(m.medida),
          'Medida incompatible con el stock maestro. Revisa la carga histórica.',
        );
        const origin = origins.find((x) => x.materialId === i.materialId);
        let alternate = 0;
        if (origin) {
          alternate = quantity(origin.cantidad, true);
          ensure(alternate <= i.cantidad, 'La procedencia supera el pedido.');
          ensure(origin.obraId !== o.id, 'Selecciona otra obra de origen.');
          const from = getObra(origin.obraId);
          ensure(from.estadoProceso === 'ENTREGADO', 'Origen sin alquiler activo.');
          ensure(
            measureKey(from.materialesCargados.find((x) => x.materialId === m.id)?.medida) ===
              measureKey(i.medida),
            'La medida de origen no coincide con la carga.',
          );
          ensure((from.saldosEnObra[m.id] || 0) >= alternate, 'Saldo insuficiente en origen.');
          required(a.motivo || '', 'Motivo');
          from.saldosEnObra[m.id]! -= alternate;
          move(m.id, alternate, `obra:${from.id}`, `obra:${o.id}`, a.motivo!);
        }
        const warehouse = i.cantidad - alternate;
        ensure(
          m.cantidadGalpon >= warehouse,
          `⚠️ Stock bajo: Pedidos ${i.cantidad} | En Galpón ${m.cantidadGalpon}. Registra procedencia autorizada.`,
        );
        m.cantidadGalpon -= warehouse;
        m.cantidadEnObra += warehouse;
        o.saldosEnObra[m.id] = (o.saldosEnObra[m.id] || 0) + i.cantidad;
        if (warehouse) move(m.id, warehouse, 'galpon', `obra:${o.id}`, 'Entrega');
      }
      o.estadoProceso = 'ENTREGADO';
      o.entregadoPor = names;
      if (a.recibidoPor?.trim())
        o.recibidoPor = required(a.recibidoPor.trim(), 'Quien recibió', 80);
      else delete o.recibidoPor;
      o.fechaEntregaEfectiva = businessDate(now);
      delete o.fechaRetiroEfectiva;
      summary = 'Confirmó la entrega';
      break;
    }
    case 'RETIRE': {
      const o = getObra(a.obraId);
      ensure(o.estadoProceso === 'ENTREGADO', 'Solo se retiran obras entregadas.');
      const names = drivers(a.responsables);
      incidents(o, a.incidents);
      for (const [id, n] of Object.entries(o.saldosEnObra))
        if (n) {
          const m = material(id);
          m.cantidadEnObra -= n;
          m.cantidadGalpon += n;
          move(id, n, `obra:${o.id}`, 'galpon', 'Retiro inspeccionado');
          o.saldosEnObra[id] = 0;
        }
      o.estadoProceso = 'RETIRADO';
      o.retiradoPor = names;
      o.fechaRetiroEfectiva = businessDate(now);
      summary = 'Confirmó el retiro';
      break;
    }
    case 'REPORT': {
      const o = getObra(a.obraId);
      ensure(o.estadoProceso === 'ENTREGADO', 'Registra faltantes en una obra entregada.');
      ensure(a.incidents.length, 'Agrega al menos un faltante.');
      incidents(o, a.incidents);
      summary = 'Registró pérdida o daño';
      break;
    }
    case 'RECOVER': {
      const o = getObra(a.obraId);
      const i = o.faltantesRegistrados?.find((x) => x.id === a.incidentId);
      ensure(i, 'Faltante no encontrado.');
      quantity(a.cantidad, true);
      required(a.motivo, 'Motivo');
      ensure(a.cantidad <= i.cantidad - i.recuperado, 'La cantidad supera lo pendiente.');
      if (!i.materialId) {
        i.recuperado += a.cantidad;
        summary = 'Resolvió un faltante sin stock maestro';
        break;
      }
      const m = material(i.materialId);
      const bucket = i.tipo === 'DANADO' ? 'cantidadEnTaller' : 'cantidadPerdido';
      ensure(m[bucket] >= a.cantidad, 'El saldo ya cambió; revisa inventario.');
      m[bucket] -= a.cantidad;
      m.cantidadGalpon += a.cantidad;
      i.recuperado += a.cantidad;
      move(
        m.id,
        a.cantidad,
        bucket === 'cantidadEnTaller' ? 'taller' : 'perdido',
        'galpon',
        a.motivo,
      );
      summary = 'Recuperó material al galpón';
      break;
    }
    case 'REENTER': {
      const o = getObra(a.obraId);
      ensure(o.estadoProceso === 'RETIRADO', 'Primero confirma el retiro.');
      o.estadoProceso = 'REINGRESADO';
      summary = 'Cerró el reingreso';
      break;
    }
    case 'REACTIVATE': {
      const o = getObra(a.obraId);
      ensure(['RETIRADO', 'REINGRESADO'].includes(o.estadoProceso), 'La obra ya está activa.');
      o.estadoProceso = 'PENDIENTE_ENTREGA';
      o.entregadoPor = [];
      o.retiradoPor = [];
      delete o.fechaRetiroEfectiva;
      delete o.fechaEntregaEfectiva;
      delete o.recibidoPor;
      summary = 'Reactivó para nueva entrega';
      break;
    }
    case 'TRANSFER': {
      const from = getObra(a.obraId),
        to = getObra(a.targetId),
        m = material(a.materialId);
      quantity(a.cantidad, true);
      required(a.motivo, 'Motivo');
      const names = drivers(a.responsables);
      ensure(from.id !== to.id, 'El origen y destino deben ser distintos.');
      ensure(from.estadoProceso === 'ENTREGADO', 'La obra de origen no está entregada.');
      ensure(
        to.estadoProceso === 'ENTREGADO' ||
          (to.estadoProceso === 'PENDIENTE_ENTREGA' && to.materialesCargados.length === 0),
        'El destino debe estar entregado o pendiente sin carga.',
      );
      ensure((from.saldosEnObra[m.id] || 0) >= a.cantidad, 'Saldo insuficiente en origen.');
      from.saldosEnObra[m.id]! -= a.cantidad;
      to.saldosEnObra[m.id] = (to.saldosEnObra[m.id] || 0) + a.cantidad;
      const source = from.materialesCargados.find((x) => x.materialId === m.id);
      ensure(source, 'Carga de origen no encontrada.');
      ensure(
        measureKey(source.medida) === measureKey(m.medida),
        'La medida histórica no coincide con el maestro. Revisa antes de transferir.',
      );
      to.materialesCargados = mergeLoads(to.materialesCargados, [
        { ...source, cantidad: a.cantidad },
      ]);
      if (to.estadoProceso === 'PENDIENTE_ENTREGA') {
        to.estadoProceso = 'ENTREGADO';
        ensure(
          to.fechaRetiroEstimada >= businessDate(now),
          'Actualiza el retiro previsto de la obra destino antes de transferir.',
        );
        to.fechaEntregaEfectiva = businessDate(now);
      }
      to.entregadoPor = [...new Set([...(to.entregadoPor || []), ...names])];
      move(m.id, a.cantidad, `obra:${from.id}`, `obra:${to.id}`, a.motivo);
      summary = `Trianguló a ${to.clienteNombre}`;
      break;
    }
    case 'SAVE_MATERIAL': {
      const m = a.material;
      validId(m.id);
      required(m.nombre, 'Material', 80);
      ensure(
        ['ANDAMIOS', 'TABLONES', 'ACCESORIOS', 'OTROS'].includes(m.categoria),
        'Categoría inválida.',
      );
      if (m.medida) required(m.medida, 'Medida', 30);
      const old = s.materiales.find((x) => x.id === m.id);
      if (old) {
        ensure(
          a.expectedVersion === (old.version || 0),
          'El material cambió. Reabre el formulario.',
        );
        if (measureKey(old.medida) !== measureKey(m.medida))
          ensure(
            ![
              old.cantidadGalpon,
              old.cantidadEnObra,
              old.cantidadEnTaller,
              old.cantidadPerdido,
            ].some(Boolean) &&
              !s.obras.some((o) => o.materialesCargados.some((i) => i.materialId === old.id)),
            'Cada medida necesita su propio material. Conserva esta variante y crea otra.',
          );
        old.version = (old.version || 0) + 1;
        old.nombre = m.nombre;
        old.categoria = m.categoria;
        old.medida = m.medida || '';
      } else
        s.materiales.push({
          id: m.id,
          nombre: m.nombre,
          categoria: m.categoria,
          medida: m.medida || '',
          cantidadGalpon: 0,
          cantidadEnObra: 0,
          cantidadEnTaller: 0,
          cantidadPerdido: 0,
        });
      summary = 'Guardó material maestro';
      break;
    }
    case 'ADJUST': {
      const m = material(a.materialId);
      ensure(
        ['cantidadGalpon', 'cantidadEnTaller', 'cantidadPerdido'].includes(a.bucket),
        'Destino inválido.',
      );
      ensure(Number.isSafeInteger(a.delta) && a.delta !== 0, 'Ajuste inválido.');
      required(a.motivo, 'Motivo');
      required(a.procedencia, 'Procedencia');
      quantity(m[a.bucket] + a.delta);
      if (a.delta < 0)
        ensure(
          -a.delta <= unlinked(m.id, a.bucket),
          'Hay faltantes vinculados a obras. Corrige o recupera desde la obra de origen.',
        );
      m[a.bucket] += a.delta;
      move(
        m.id,
        Math.abs(a.delta),
        a.delta > 0 ? a.procedencia : a.bucket,
        a.delta > 0 ? a.bucket : a.procedencia,
        a.motivo,
      );
      summary = 'Ajustó inventario con procedencia';
      break;
    }
    case 'MOVE_STOCK': {
      const m = material(a.materialId);
      quantity(a.cantidad, true);
      required(a.motivo, 'Motivo');
      ensure(a.origen !== a.destino, 'Selecciona otro destino.');
      ensure(
        unlinked(m.id, a.origen) >= a.cantidad,
        'Saldo libre insuficiente. Los faltantes vinculados se recuperan desde su obra.',
      );
      m[a.origen] -= a.cantidad;
      m[a.destino] += a.cantidad;
      move(m.id, a.cantidad, a.origen, a.destino, a.motivo);
      summary = 'Movió existencias entre depósitos';
      break;
    }
    case 'CORRECT_INCIDENT': {
      const o = getObra(a.obraId),
        incident = o.faltantesRegistrados?.find((i) => i.id === a.incidentId);
      ensure(incident, 'Faltante no encontrado.');
      quantity(a.cantidad, true);
      required(a.motivo, 'Motivo');
      ensure(
        a.cantidad <= incident.cantidad - incident.recuperado,
        'La cantidad supera lo pendiente.',
      );
      ensure(
        incident.materialId,
        'Un ítem sin stock se resuelve como recuperado, sin mover existencias.',
      );
      const m = material(incident.materialId),
        from = incident.tipo === 'DANADO' ? 'cantidadEnTaller' : 'cantidadPerdido';
      ensure(m[from] >= a.cantidad, 'Saldo insuficiente.');
      if (a.destino === 'obra') {
        ensure(o.estadoProceso === 'ENTREGADO', 'Solo se corrige al saldo de una obra activa.');
        m.cantidadEnObra += a.cantidad;
        o.saldosEnObra[m.id] = (o.saldosEnObra[m.id] || 0) + a.cantidad;
      } else {
        const to = a.destino === 'taller' ? 'cantidadEnTaller' : 'cantidadPerdido';
        ensure(from !== to, 'Selecciona otro destino.');
        m[to] += a.cantidad;
        (o.faltantesRegistrados ??= []).push({
          ...incident,
          id: op.id + '_correction',
          cantidad: a.cantidad,
          recuperado: 0,
          tipo: a.destino === 'taller' ? 'DANADO' : 'PERDIDO',
          notas: a.motivo,
        });
      }
      m[from] -= a.cantidad;
      incident.recuperado += a.cantidad;
      move(m.id, a.cantidad, from, a.destino === 'obra' ? `obra:${o.id}` : a.destino, a.motivo);
      summary = 'Corrigió un faltante con motivo';
      break;
    }
    case 'SAVE_COMBO': {
      const c = a.combo;
      validId(c.id);
      required(c.nombreCombo, 'Nombre del combo', 80);
      ensure(c.items.length > 0 && c.items.length <= 100, 'Agrega materiales al combo.');
      ensure(
        new Set(c.items.map((i) => i.materialId)).size === c.items.length,
        'Material duplicado en combo.',
      );
      for (const i of c.items) {
        material(i.materialId);
        quantity(i.cantidad, true);
      }
      const index = s.combos.findIndex((x) => x.id === c.id);
      if (index >= 0) {
        ensure(
          a.expectedVersion === (s.combos[index]!.version || 0),
          'El combo cambió. Reabre el formulario.',
        );
        s.combos[index] = { ...clone(c), version: (s.combos[index]!.version || 0) + 1 };
      } else s.combos.push(clone(c));
      summary = 'Guardó un combo';
      break;
    }
    case 'DELETE_COMBO':
      ensure(
        s.combos.some((c) => c.id === a.comboId),
        'Combo no encontrado.',
      );
      s.combos = s.combos.filter((c) => c.id !== a.comboId);
      summary = 'Eliminó un combo';
      break;
    case 'DELETE_MATERIAL': {
      const m = material(a.materialId);
      ensure(m.cantidadEnObra === 0, `Hay ${m.cantidadEnObra} ${m.nombre} en obras. Registrá los retiros antes de borrarlo.`);
      const loads = s.obras.filter(
        (o) => o.estadoProceso === 'PENDIENTE_ENTREGA' && o.materialesCargados.some((x) => x.materialId === m.id),
      );
      ensure(!loads.length, `Está en la carga de ${loads.map((o) => o.clienteNombre).join(', ')}. Quitalo de esa carga primero.`);
      const open = s.obras.some((o) =>
        o.faltantesRegistrados?.some((f) => f.materialId === m.id && f.recuperado < f.cantidad),
      );
      ensure(!open, 'Tiene faltantes o daños sin resolver en un alquiler. Recuperalos primero.');
      for (const [bucket, place] of [
        ['cantidadGalpon', 'galpon'],
        ['cantidadEnTaller', 'taller'],
        ['cantidadPerdido', 'perdido'],
      ] as const)
        if (m[bucket] > 0) move(m.id, m[bucket], place, 'baja', 'Material borrado del depósito');
      for (const c of s.combos) c.items = c.items.filter((i) => i.materialId !== m.id);
      s.combos = s.combos.filter((c) => c.items.length > 0);
      for (const o of s.obras) delete o.saldosEnObra[m.id];
      s.materiales = s.materiales.filter((x) => x.id !== m.id);
      summary = `Borró el material ${m.nombre}${m.medida ? ` ${m.medida}` : ''}`;
      break;
    }
    case 'RESPONSABLES':
      ensure(
        a.nombres.length > 0 && a.nombres.length <= 50,
        'Configura entre 1 y 50 responsables.',
      );
      s.responsables = [...new Set(a.nombres.map((n) => required(n, 'Responsable', 80)))];
      summary = 'Configuró responsables';
      break;
    case 'PHOTO': {
      const o = getObra(a.obraId);
      ensure((o.fotos?.length || 0) < 12, 'Máximo 12 fotos por obra.');
      validId(a.photo.id);
      ensure(a.photo.usuarioUid === op.actor.uid, 'Autor de foto inválido.');
      ensure(!o.fotos?.some((p) => p.id === a.photo.id), 'Foto duplicada.');
      ensure(
        /^(chema-photo:|file:|data:image\/jpeg;base64,|https:|blob:)/.test(a.photo.uri),
        'Referencia de foto inválida.',
      );
      (o.fotos ??= []).push(clone(a.photo));
      o.fotosUrls = o.fotos.map((p) => p.uri);
      summary = 'Agregó una foto';
      break;
    }
    case 'DELETE_PHOTO': {
      const o = getObra(a.obraId);
      const p = o.fotos?.find((p) => p.id === a.photoId);
      ensure(p, 'Foto no encontrada.');
      ensure(
        op.actor.role === 'ADMIN' || p.usuarioUid === op.actor.uid,
        'Solo el autor o administración elimina la foto.',
      );
      o.fotos = o.fotos!.filter((p) => p.id !== a.photoId);
      o.fotosUrls = o.fotos.map((p) => p.uri);
      summary = 'Eliminó una foto';
      break;
    }
    case 'LOCATION': {
      coordinates(a.coordenadas);
      getObra(a.obraId).coordenadas = clone(a.coordenadas);
      summary = 'Actualizó la ubicación';
      break;
    }
    case 'UNDO': {
      const log = s.logs.find((l) => l.id === a.logId);
      ensure(log, 'Registro no encontrado.');
      const reason = undoReason(s, log, op.actor, now);
      ensure(!reason, reason || '');
      const restored = clone(log.payloadInverso!.snapshot);
      restored.notificaciones = restored.notificaciones.map(
        (n) => s.notificaciones.find((current) => current.id === n.id) || n,
      );
      Object.assign(s, restored);
      log.undoneBy = op.id;
      summary = `Deshizo: ${log.accion}`;
      obraId = log.obraId;
      for (const o of s.obras) touched.add(o.id);
      movements.push(
        ...log.movimientos.map((m) => ({
          ...m,
          origen: m.destino,
          destino: m.origen,
          motivo: `Deshacer ${log.id}`,
        })),
      );
      break;
    }
    default:
      throw new Error('Operación desconocida.');
  }
  s.revision += 1;
  s.appliedIds.push(op.id);
  for (const o of s.obras)
    if (touched.has(o.id)) {
      o.version = (o.version || 0) + 1;
      o.updatedAt = now.toISOString();
      o.syncStatus = 'PENDING';
      o.estadoSemaphoro = trafficLight(o, businessDate(now));
    }
  const log: ActivityLog = {
    id: op.id,
    operationId: op.id,
    timestamp: now.toISOString(),
    usuarioUid: op.actor.uid,
    usuarioNombre: op.actor.nombre,
    accion: summary,
    movimientos: movements,
    requiredRole:
      adminActions.includes(a.type) || (a.type === 'DELIVER' && a.origins?.length)
        ? 'ADMIN'
        : 'OPERADOR',
  };
  if (obraId) {
    log.obraId = obraId;
    log.obraNombre = (
      s.obras.find((o) => o.id === obraId) || current.obras.find((o) => o.id === obraId)
    )?.clienteNombre;
  }
  // Fotos y avisos externos no son reversibles de forma transaccional: usar eliminación/recuperación explícita.
  if (
    !['UNDO', 'PHOTO', 'DELETE_PHOTO', 'REPORT'].includes(a.type) &&
    !(a.type === 'RETIRE' && a.incidents.length)
  )
    log.payloadInverso = { snapshot: before, expectedRevision: s.revision };
  for (const prior of s.logs) delete prior.payloadInverso;
  s.logs.unshift(log);
  assertState(s);
  return s;
}
