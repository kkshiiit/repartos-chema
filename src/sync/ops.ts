import type { Action, ActivityLog, AppState, DomainSnapshot, Operation, UserProfile } from '../types';
import { applyOperation, clone } from '../domain/engine';

/** Reemplaza todo el inventario del equipo por una copia importada (queda auditado). */
export interface ImportAction {
  type: 'IMPORT_SNAPSHOT';
  snapshot: DomainSnapshot;
  origen: string;
  /** Texto para la Auditoría (restauraciones). Si falta, se usa el texto de importación. */
  accion?: string;
}
/** Evento sin efecto en el stock, solo para la auditoría (ingresos, exportaciones, tickets). */
export interface NoteAction {
  type: 'NOTE';
  accion: string;
  obraId?: string;
}
export type SyncAction = Action | ImportAction | NoteAction;
export interface SyncOperation extends Omit<Operation, 'action'> {
  action: SyncAction;
}

function pushLog(s: AppState, op: SyncOperation, accion: string, obraId?: string) {
  const obra = obraId ? s.obras.find((o) => o.id === obraId) : undefined;
  const log: ActivityLog = {
    id: op.id,
    operationId: op.id,
    timestamp: op.createdAt,
    usuarioUid: op.actor.uid,
    usuarioNombre: op.actor.nombre,
    accion,
    obraId: obra?.id,
    obraNombre: obra?.clienteNombre,
    movimientos: [],
  };
  for (const prior of s.logs) delete prior.payloadInverso;
  s.logs.unshift(log);
}

/** Aplica cualquier operación de forma determinista: misma entrada ⇒ mismo resultado en todos los teléfonos. */
export function applySync(current: AppState, op: SyncOperation): AppState {
  const at = new Date(op.createdAt);
  const when = Number.isFinite(at.getTime()) ? at : new Date(0);
  if (current.appliedIds.includes(op.id)) return current;
  const a = op.action;
  if (a.type === 'IMPORT_SNAPSHOT') {
    const s = clone(current);
    const snap = clone(a.snapshot);
    s.obras = snap.obras;
    s.materiales = snap.materiales;
    s.combos = snap.combos;
    s.responsables = snap.responsables;
    s.notificaciones = snap.notificaciones || [];
    s.revision += 1;
    s.appliedIds.push(op.id);
    pushLog(
      s,
      op,
      a.accion
        ? a.accion.slice(0, 200)
        : `Importó una copia completa (${a.origen.slice(0, 80)}): ${snap.obras.length} alquileres, ${snap.materiales.length} materiales`,
    );
    return s;
  }
  if (a.type === 'NOTE') {
    const s = clone(current);
    s.appliedIds.push(op.id);
    pushLog(s, op, a.accion.slice(0, 200), a.obraId);
    return s;
  }
  return applyOperation(current, op as Operation, when);
}

export function actorFor(member: { id: string; name: string }): UserProfile {
  return { uid: member.id, nombre: member.name, email: '', role: 'ADMIN', createdAt: '2026-01-01T00:00:00.000Z' };
}

export function photoIdsOf(op: SyncOperation): string[] {
  const a = op.action;
  if (a.type === 'PHOTO') return [a.photo.id];
  if (a.type === 'IMPORT_SNAPSHOT') return a.snapshot.obras.flatMap((o) => (o.fotos || []).map((p) => p.id));
  return [];
}
