/** UI state only. This service never reads or writes an inventory envelope. */
export interface RentalListPreferences {
  schema: 1;
  query: string;
  status: string;
  zone: string;
  scroll: number;
}
interface Storage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
}
export const emptyRentalListPreferences = (): RentalListPreferences => ({
  schema: 1,
  query: '',
  status: 'TODAS',
  zone: 'TODAS',
  scroll: 0,
});
const statuses = new Set([
  'TODAS',
  'HOY',
  'ATRASADOS',
  'PROXIMOS',
  'ROJO',
  'AMARILLO',
  'VERDE',
  'SIN_FECHA',
  'PENDIENTE',
  'RETIRADO',
]);
function validate(value: unknown): RentalListPreferences {
  if (!value || typeof value !== 'object')
    throw new Error('No se pudo leer la vista guardada de alquileres.');
  const v = value as Partial<RentalListPreferences>;
  if (v.schema !== 1) throw new Error('La versión de la vista guardada no es compatible.');
  if (
    typeof v.query !== 'string' ||
    v.query.length > 1000 ||
    typeof v.status !== 'string' ||
    !statuses.has(v.status) ||
    typeof v.zone !== 'string' ||
    v.zone.length > 200 ||
    typeof v.scroll !== 'number' ||
    !Number.isFinite(v.scroll) ||
    v.scroll < 0
  )
    throw new Error('No se pudo leer la vista guardada de alquileres.');
  return { schema: 1, query: v.query, status: v.status, zone: v.zone, scroll: v.scroll };
}
const queues = new WeakMap<Storage, Map<string, Promise<void>>>();
export function createRentalListPreferences(storage: Storage, scope: string) {
  const key = `chema:rental-list:v1:${encodeURIComponent(scope)}`;
  let writes = queues.get(storage);
  if (!writes) {
    writes = new Map();
    queues.set(storage, writes);
  }
  return {
    async load(): Promise<RentalListPreferences> {
      await writes!.get(key)?.catch(() => undefined);
      const raw = await storage.getItem(key);
      if (raw === null) return emptyRentalListPreferences();
      try {
        return validate(JSON.parse(raw));
      } catch (error) {
        if (error instanceof SyntaxError)
          throw new Error(
            'No se pudo leer la vista guardada de alquileres. El original se conserva.',
          );
        throw error;
      }
    },
    async save(value: RentalListPreferences): Promise<void> {
      const raw = JSON.stringify(validate(value));
      const next = (writes!.get(key) || Promise.resolve())
        .catch(() => undefined)
        .then(async () => {
          await storage.setItem(key, raw);
          if ((await storage.getItem(key)) !== raw)
            throw new Error('No se pudo confirmar la vista guardada. Reintentá.');
        });
      writes!.set(key, next);
      return next;
    },
  };
}
// An immediate return from detail does not wait for a disk read or reset the list.
const views = new Map<
  string,
  { preferences: RentalListPreferences; error: string; writesBlocked: boolean }
>();
export function rememberedRentalList(scope: string) {
  return views.get(scope);
}
export function rememberRentalList(
  scope: string,
  preferences: RentalListPreferences,
  error = '',
  writesBlocked = false,
) {
  views.set(scope, { preferences: validate(preferences), error, writesBlocked });
}
