import type { Action, AppState, UserProfile } from '../types';
import { applyOperation, assertState, clone } from '../domain/engine';
import { commandSchema } from '../domain/schema';

export interface SharedTask {
  id: string;
  type: 'DELIVER' | 'RETIRE';
}
export interface SharedSnapshot {
  protocol: 1;
  spaceId: string;
  epoch: string;
  cursor: number;
  state: AppState;
  versions: Record<string, number>;
  tasks: Record<string, SharedTask>;
  member?: { uid: string; nombre: string; role: 'ADMIN' | 'OPERADOR' };
}
export interface SyncCommand {
  protocolVersion: 1;
  spaceId: string;
  epoch: string;
  operationId: string;
  expectedUserId: string;
  action: Action;
  expectedVersions: Record<string, number>;
  expectedTaskId?: string;
  clientTimestamp: string;
  /** Canonical payload is compared in full, not trusted as a signature or authorization. */
  payloadHash: string;
}
export type CommitResult =
  | {
      kind: 'CONFIRMED';
      operationId: string;
      snapshot: SharedSnapshot;
      serverTimestamp: string;
      payloadHash: string;
      message?: string;
    }
  | { kind: 'CONFLICT'; operationId: string; message: string; snapshot?: SharedSnapshot };
export interface SharedRemote {
  snapshot(): Promise<SharedSnapshot>;
  commit(command: SyncCommand): Promise<CommitResult>;
  receipt(operationId: string): Promise<CommitResult | null>;
  pull(cursor: number): Promise<{ changes: SharedSnapshot[]; watermark: number; epoch: string }>;
}
export function canonical(value: unknown): string {
  if (Array.isArray(value)) return '[' + value.map(canonical).join(',') + ']';
  if (value && typeof value === 'object')
    return (
      '{' +
      Object.keys(value)
        .filter((k) => (value as Record<string, unknown>)[k] !== undefined)
        .sort()
        .map((k) => JSON.stringify(k) + ':' + canonical((value as Record<string, unknown>)[k]))
        .join(',') +
      '}'
    );
  return JSON.stringify(value);
}
function entities(state: AppState): Record<string, unknown> {
  return Object.fromEntries([
    ...state.obras.map((o) => ['obra:' + o.id, o] as const),
    ...state.materiales.map((m) => ['material:' + m.id, m] as const),
    ...state.combos.map((c) => ['combo:' + c.id, c] as const),
    ['responsables', state.responsables],
  ]);
}
function taskType(state: AppState, id: string): SharedTask['type'] | null {
  const obra = state.obras.find((o) => o.id === id);
  if (obra?.estadoProceso === 'PENDIENTE_ENTREGA') return 'DELIVER';
  if (obra?.estadoProceso === 'ENTREGADO') return 'RETIRE';
  return null;
}
export function bootstrapShared(spaceId: string, state: AppState, epoch: string): SharedSnapshot {
  assertState(state);
  const tasks: Record<string, SharedTask> = {};
  for (const obra of state.obras) {
    const type = taskType(state, obra.id);
    if (type) tasks[obra.id] = { id: `initial:${epoch}:${obra.id}:${type}`, type };
  }
  return {
    protocol: 1,
    spaceId,
    epoch,
    cursor: 0,
    state: clone(state),
    versions: Object.fromEntries(Object.keys(entities(state)).map((k) => [k, 0])),
    tasks,
  };
}
export function createCommand(
  base: SharedSnapshot,
  action: Action,
  operationId: string,
  expectedUserId = base.member?.uid || '',
): SyncCommand {
  if (action.type === 'PHOTO')
    action = {
      ...action,
      photo: {
        id: action.photo.id,
        usuarioUid: action.photo.usuarioUid,
        uri: 'chema-photo:' + action.photo.id,
        status: 'PENDING',
      },
    };
  commandSchema.parse({ id: operationId, action });
  const obraId = 'obraId' in action ? action.obraId : undefined;
  return {
    protocolVersion: 1,
    spaceId: base.spaceId,
    epoch: base.epoch,
    operationId,
    expectedUserId,
    action: clone(action),
    expectedVersions: clone(base.versions),
    ...(obraId && (action.type === 'DELIVER' || action.type === 'RETIRE')
      ? { expectedTaskId: base.tasks[obraId]?.id }
      : {}),
    clientTimestamp: new Date().toISOString(),
    payloadHash: canonical(action),
  };
}
export function prepareCommit(
  base: SharedSnapshot,
  command: SyncCommand,
  actor: UserProfile,
  now = new Date(),
): CommitResult {
  commandSchema.parse({ id: command.operationId, action: command.action });
  if (command.payloadHash !== canonical(command.action))
    throw new Error('La huella no coincide con el contenido de la operación.');
  const conflict = (message: string): CommitResult => ({
    kind: 'CONFLICT',
    operationId: command.operationId,
    message,
  });
  if (
    command.protocolVersion !== 1 ||
    command.spaceId !== base.spaceId ||
    command.epoch !== base.epoch
  )
    return conflict('La generación del equipo cambió. Conservamos tus cambios para revisión.');
  if (command.action.type === 'DELIVER' || command.action.type === 'RETIRE') {
    const task = base.tasks[command.action.obraId];
    if (!task || task.id !== command.expectedTaskId || task.type !== command.action.type)
      return conflict(
        'Esta entrega o retiro ya fue registrado o cambió. Revisá el alquiler; tu propuesta se conserva.',
      );
  }
  const keys = new Set([
    ...Object.keys(base.versions),
    ...Object.keys(command.expectedVersions || {}),
  ]);
  for (const key of keys)
    if ((base.versions[key] ?? -1) !== (command.expectedVersions?.[key] ?? -1))
      return conflict(
        'Hay cambios posteriores en el equipo. Revisá la propuesta antes de volver a enviarla.',
      );
  let next: AppState;
  try {
    next = applyOperation(
      base.state,
      { id: command.operationId, action: command.action, actor, createdAt: now.toISOString() },
      now,
    );
  } catch (error) {
    return conflict(error instanceof Error ? error.message : 'No se pudo validar la operación.');
  }
  const previousEntities = entities(base.state),
    nextEntities = entities(next);
  const versions = { ...base.versions };
  for (const key of new Set([...Object.keys(previousEntities), ...Object.keys(nextEntities)]))
    if (canonical(previousEntities[key] ?? null) !== canonical(nextEntities[key] ?? null))
      versions[key] = (versions[key] ?? -1) + 1;
  const tasks: Record<string, SharedTask> = {};
  for (const obra of next.obras) {
    const type = taskType(next, obra.id);
    if (!type) continue;
    const old = base.tasks[obra.id];
    // UNDO or REACTIVATE reopening a commercial task receives a new immutable identity.
    tasks[obra.id] =
      old?.type === type
        ? clone(old)
        : { id: `task:${command.operationId}:${obra.id}:${type}`, type };
  }
  return {
    kind: 'CONFIRMED',
    operationId: command.operationId,
    serverTimestamp: now.toISOString(),
    payloadHash: command.payloadHash,
    snapshot: { ...base, cursor: base.cursor + 1, state: next, versions, tasks },
  };
}
