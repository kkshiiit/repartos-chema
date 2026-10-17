import { expect, it } from 'vitest';
import { SqliteStorage } from '../src/data/sqliteStorage';
import { createNativeInventoryStorage } from '../src/data/nativeInventoryStorage';
import { sqliteDb } from './helpers/sqlite';
import { Repository } from '../src/data/repository';
import { emptyLocalState } from '../src/data/localInitialState';
import { demoProfile } from '../src/data/seed';
function fixture() {
  const state = emptyLocalState();
  return JSON.stringify({ schema: 1, state, confirmed: state, queue: [] });
}
it('migra con el almacén legado lleno y no vuelve a escribirlo al reabrir', async () => {
  const data = new Map([['chema:demo:v1', fixture()]]);
  let writes = 0,
    active = false;
  const legacy = {
    getItem: async (k: string) => data.get(k) ?? null,
    getAllKeys: async () => [...data.keys()],
    setItem: async () => {
      writes++;
      throw new Error('AsyncStorage lleno');
    },
  };
  const sql = new SqliteStorage(sqliteDb());
  const guard = {
    activated: async () => active,
    activate: async () => {
      active = true;
    },
  };
  const first = createNativeInventoryStorage(legacy, async () => sql, guard);
  expect(await first.getItem('chema:demo:v1')).toBe(fixture());
  const second = createNativeInventoryStorage(legacy, async () => sql, guard);
  expect(await second.getItem('chema:demo:v1')).toBe(fixture());
  expect(writes).toBe(0);
  expect(data.size).toBe(1);
});
it('base ausente admite exportación asistida y restauración explícita, nunca caída automática al legado', async () => {
  const original = fixture();
  const legacy = {
    getItem: async () => original,
    setItem: async () => {},
    getAllKeys: async () => ['chema:demo:v1'],
  };
  const sql = new SqliteStorage(sqliteDb());
  const guard = { activated: async () => true, activate: async () => {} };
  const storage = createNativeInventoryStorage(legacy, async () => sql, guard);
  const repo = new Repository(storage, 'chema:demo:v1', emptyLocalState);
  await expect(repo.load()).rejects.toThrow(/No se encontró/);
  const rescue = JSON.parse((await repo.exportRaw())!);
  expect(rescue.format).toBe('chema-migration-original-v1');
  expect(rescue.originalRaw).toBe(original);
  await repo.restoreDemo(original, demoProfile('ADMIN'));
  expect((await repo.load()).state.obras).toEqual([]);
  const reopened = createNativeInventoryStorage(legacy, async () => sql, guard);
  expect(await reopened.getItem('chema:demo:v1')).toBe(original);
  expect((await reopened.getAllKeys()).some((k) => k.includes('before-recovery'))).toBe(true);
});
it('un fallo de lectura legado bloquea el inicio pero permite recuperar un JSON verificado sin borrar el legado', async () => {
  let active = false;
  const original = fixture();
  const legacy = {
    getItem: async () => {
      throw new Error('Lectura legado fallida');
    },
    setItem: async () => {
      throw new Error('No escribir legado');
    },
    getAllKeys: async () => ['chema:demo:v1'],
  };
  const sql = new SqliteStorage(sqliteDb());
  const guard = {
    activated: async () => active,
    activate: async () => {
      active = true;
    },
  };
  const storage = createNativeInventoryStorage(legacy, async () => sql, guard);
  const repo = new Repository(storage, 'chema:demo:v1', emptyLocalState);
  await expect(repo.load()).rejects.toThrow();
  await expect(repo.restoreDemo(original, demoProfile('ADMIN'))).resolves.toMatchObject({
    state: { obras: [] },
  });
  expect(active).toBe(true);
});
