import { coordinateOrNull, type MaterialBasis, type TripTaskFilter } from '../domain/tripOrder';
export interface TripOrigin {
  kind: 'GPS' | 'DEPOT';
  coordinates: { lat: number; lng: number };
  capturedAt: string;
  accuracy?: number;
}
export interface TripPreferences {
  schema: 1;
  revision: number;
  ids: string[];
  previousIds: string[] | null;
  task: TripTaskFilter;
  zone: string;
  origin: TripOrigin | null;
  criterion: {
    kind: 'INITIAL' | 'MANUAL' | 'DISTANCE' | 'MATERIAL';
    label: string;
    originSignature?: string;
    scopeSignature?: string;
    materialSignature?: string;
  };
  basis: MaterialBasis | null;
}
export function initialTripPreferences(): TripPreferences {
  return {
    schema: 1,
    revision: 0,
    ids: [],
    previousIds: null,
    task: 'ALL',
    zone: 'TODAS',
    origin: null,
    criterion: { kind: 'INITIAL', label: 'Orden inicial · retiros pendientes primero' },
    basis: null,
  };
}
function ids(value: unknown): value is string[] {
  return (
    Array.isArray(value) &&
    value.length <= 20000 &&
    value.every((v) => typeof v === 'string' && /^[a-zA-Z0-9_-]{1,100}$/.test(v)) &&
    new Set(value).size === value.length
  );
}
export function parseTripPreferences(raw: string): TripPreferences {
  let data: TripPreferences;
  try {
    data = JSON.parse(raw) as TripPreferences;
  } catch {
    throw new Error(
      'No pudimos leer el orden guardado. Se conserva para recuperar; reintentá la lectura.',
    );
  }
  if (!data || data.schema !== 1)
    throw new Error(
      'La versión del recorrido guardado no es compatible. No se reemplazaron los datos.',
    );
  if (
    !('origin' in data) ||
    !('basis' in data) ||
    !Number.isSafeInteger(data.revision) ||
    data.revision < 0 ||
    !ids(data.ids) ||
    (data.previousIds !== null && !ids(data.previousIds)) ||
    !['ALL', 'RETIRE', 'DELIVER'].includes(data.task) ||
    typeof data.zone !== 'string' ||
    data.zone.length > 200 ||
    !data.criterion ||
    !['INITIAL', 'MANUAL', 'DISTANCE', 'MATERIAL'].includes(data.criterion.kind) ||
    typeof data.criterion.label !== 'string' ||
    data.criterion.label.length > 300 ||
    ['originSignature', 'scopeSignature', 'materialSignature'].some((key) => {
      const value = data.criterion[key as keyof typeof data.criterion];
      return value !== undefined && typeof value !== 'string';
    })
  )
    throw new Error(
      'El recorrido guardado está incompleto. Se conserva para recuperar; no se restableció.',
    );
  if (
    data.origin &&
    (!['GPS', 'DEPOT'].includes(data.origin.kind) ||
      !coordinateOrNull(data.origin.coordinates) ||
      !Number.isFinite(Date.parse(data.origin.capturedAt)) ||
      (data.origin.accuracy !== undefined &&
        (!Number.isFinite(data.origin.accuracy) || data.origin.accuracy < 0)))
  )
    throw new Error('El origen guardado no es válido. No se reemplazó el recorrido.');
  if (
    data.basis &&
    (typeof data.basis.materialId !== 'string' ||
      !/^[a-zA-Z0-9_-]{1,100}$/.test(data.basis.materialId) ||
      (data.basis.medida !== undefined &&
        (typeof data.basis.medida !== 'string' || data.basis.medida.length > 100)))
  )
    throw new Error('El material del recorrido guardado no es válido.');
  return data;
}
export interface TripStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
}
const writes = new Map<string, Promise<unknown>>();
export class TripPreferencesStore {
  readonly key: string;
  constructor(
    private storage: TripStorage,
    namespace: string,
  ) {
    this.key = `chema:trip:v1:${encodeURIComponent(namespace)}`;
  }
  async load(): Promise<TripPreferences> {
    const raw = await this.storage.getItem(this.key);
    return raw === null ? initialTripPreferences() : parseTripPreferences(raw);
  }
  save(value: TripPreferences): Promise<TripPreferences> {
    const run = (writes.get(this.key) || Promise.resolve())
      .catch(() => undefined)
      .then(async () => {
        const current = await this.load();
        if (value.revision !== current.revision)
          throw new Error('El recorrido guardado cambió. Reintentá la lectura antes de guardar.');
        const valid = parseTripPreferences(
          JSON.stringify({ ...value, revision: current.revision + 1 }),
        );
        const raw = JSON.stringify(valid);
        await this.storage.setItem(this.key, raw);
        if ((await this.storage.getItem(this.key)) !== raw)
          throw new Error(
            'No pudimos confirmar el orden guardado. Reintentá la lectura antes de continuar.',
          );
        return valid;
      });
    writes.set(this.key, run);
    void run
      .finally(() => {
        if (writes.get(this.key) === run) writes.delete(this.key);
      })
      .catch(() => undefined);
    return run;
  }
}
