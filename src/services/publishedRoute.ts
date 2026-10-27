import type { SharedSnapshot } from '../shared/protocol';
import type { TripStorage } from './tripPreferences';
export interface RoutePlan {
  schema: 1;
  ids: string[];
  tasks: Record<string, string>;
  assignments: Record<string, string>;
}
export interface PublishedRoute {
  revision: number;
  route: RoutePlan;
  userId: string;
  updatedAt: string;
}
const record = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === 'object' && !Array.isArray(v);
export function validateRoutePlan(value: unknown): RoutePlan {
  if (
    !record(value) ||
    Object.keys(value).some((k) => !['schema', 'ids', 'tasks', 'assignments'].includes(k)) ||
    value.schema !== 1 ||
    !Array.isArray(value.ids) ||
    value.ids.length > 500 ||
    !value.ids.every((id) => typeof id === 'string' && /^[a-zA-Z0-9_-]{1,100}$/.test(id)) ||
    new Set(value.ids).size !== value.ids.length ||
    !record(value.tasks) ||
    !record(value.assignments)
  )
    throw Error('El plan de viaje no es válido.');
  const ids = value.ids as string[],
    tasks = value.tasks,
    assignments = value.assignments;
  if (
    Object.keys(tasks).length !== ids.length ||
    ids.some(
      (id) =>
        typeof tasks[id] !== 'string' ||
        !(tasks[id] as string).length ||
        (tasks[id] as string).length > 300,
    ) ||
    Object.entries(assignments).some(
      ([id, uid]) => !ids.includes(id) || typeof uid !== 'string' || !/^[0-9a-f-]{36}$/i.test(uid),
    )
  )
    throw Error('Las tareas o asignaciones del plan no son válidas.');
  return value as unknown as RoutePlan;
}
export function parsePublishedRoute(value: unknown): PublishedRoute | null {
  if (value === null) return null;
  if (
    !record(value) ||
    !Number.isSafeInteger(value.revision) ||
    Number(value.revision) < 1 ||
    typeof value.userId !== 'string' ||
    typeof value.updatedAt !== 'string' ||
    !Number.isFinite(Date.parse(value.updatedAt))
  )
    throw Error('No pudimos leer el plan publicado.');
  validateRoutePlan(value.route);
  return value as unknown as PublishedRoute;
}
export function proposalFromSnapshot(
  ids: string[],
  assignments: Record<string, string>,
  snapshot: SharedSnapshot,
): RoutePlan {
  const tasks: Record<string, string> = {};
  for (const id of ids) {
    if (!snapshot.tasks[id])
      throw Error('Las paradas cambiaron. Actualizá el inventario y revisá tu borrador.');
    tasks[id] = snapshot.tasks[id].id;
  }
  return validateRoutePlan({ schema: 1, ids, tasks, assignments });
}
// Task identity prevents a completed delivery from being loaded as a later retirement.
export function loadableRouteIds(
  plan: RoutePlan,
  eligible: string[],
  snapshot: SharedSnapshot | null,
): string[] {
  return plan.ids.filter(
    (id) => eligible.includes(id) && (!snapshot || snapshot.tasks[id]?.id === plan.tasks[id]),
  );
}
export class PublishedRouteCache {
  readonly key: string;
  constructor(
    private storage: TripStorage,
    spaceId: string,
    uid: string,
  ) {
    this.key = `chema:published-route:v1:${encodeURIComponent(spaceId)}:${encodeURIComponent(uid)}`;
  }
  async loadAssignments(): Promise<Record<string, string> | null> {
    const raw = await this.storage.getItem(this.key + ':draft-assignments');
    if (raw === null) return null;
    const value: unknown = JSON.parse(raw);
    if (
      !record(value) ||
      Object.keys(value).length > 500 ||
      Object.entries(value).some(
        ([id, uid]) =>
          !/^[a-zA-Z0-9_-]{1,100}$/.test(id) ||
          typeof uid !== 'string' ||
          !/^[0-9a-f-]{36}$/i.test(uid),
      )
    )
      throw Error('No pudimos leer las asignaciones del borrador. Conservamos la copia original.');
    return value as Record<string, string>;
  }
  async saveAssignments(value: Record<string, string>) {
    const raw = JSON.stringify(value);
    await this.storage.setItem(this.key + ':draft-assignments', raw);
    if ((await this.storage.getItem(this.key + ':draft-assignments')) !== raw)
      throw Error('No pudimos confirmar las asignaciones guardadas en este teléfono.');
  }
  async load() {
    const raw = await this.storage.getItem(this.key);
    return raw === null ? null : parsePublishedRoute(JSON.parse(raw));
  }
  async save(plan: PublishedRoute | null) {
    parsePublishedRoute(plan);
    const raw = JSON.stringify(plan);
    await this.storage.setItem(this.key, raw);
    if ((await this.storage.getItem(this.key)) !== raw)
      throw Error('El plan se recibió, pero no pudimos confirmar su copia local.');
  }
}
