import { expect, it } from 'vitest';
import {
  TripPreferencesStore,
  parseTripPreferences,
  initialTripPreferences,
} from '../src/services/tripPreferences';
class Storage {
  values = new Map<string, string>();
  fail = false;
  async getItem(key: string) {
    return this.values.get(key) ?? null;
  }
  async setItem(key: string, value: string) {
    if (this.fail) throw Error('sin espacio');
    this.values.set(key, value);
  }
}
it('conserva secuencia, filtros, origen y último cambio al cerrar y abrir otro store', async () => {
  const storage = new Storage();
  const first = new TripPreferencesStore(storage, 'local:user');
  const initial = await first.load();
  const saved = await first.save({
    ...initial,
    ids: ['A', 'X', 'B'],
    task: 'RETIRE',
    zone: 'Centro',
    origin: {
      kind: 'GPS',
      coordinates: { lat: -34, lng: -58 },
      capturedAt: '2026-10-26T10:00:00Z',
      accuracy: 8,
    },
    previousIds: ['B', 'X', 'A'],
  });
  expect(saved.revision).toBe(1);
  expect(await new TripPreferencesStore(storage, 'local:user').load()).toEqual(saved);
  expect((await new TripPreferencesStore(storage, 'other:user').load()).ids).toEqual([]);
});
it('datos corruptos/versiones incompatibles no se restablecen silenciosamente', async () => {
  const storage = new Storage(),
    store = new TripPreferencesStore(storage, 'local');
  storage.values.set(store.key, '{roto');
  await expect(store.load()).rejects.toThrow(/recuperar|leer|guardado/);
  expect(storage.values.get(store.key)).toBe('{roto');
  expect(() =>
    parseTripPreferences(JSON.stringify({ ...initialTripPreferences(), schema: 9 })),
  ).toThrow(/versión/);
});
it('rechaza escritura fallida y revisión concurrente conservando el último orden guardado', async () => {
  const storage = new Storage(),
    store = new TripPreferencesStore(storage, 'local');
  const initial = await store.load();
  const saved = await store.save({ ...initial, ids: ['A', 'B'] });
  storage.fail = true;
  await expect(store.save({ ...saved, ids: ['B', 'A'] })).rejects.toThrow('sin espacio');
  expect((await store.load()).ids).toEqual(['A', 'B']);
  storage.fail = false;
  await expect(store.save({ ...initial, ids: ['B', 'A'] })).rejects.toThrow(/cambió/);
});
