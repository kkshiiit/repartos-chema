import { describe, it, expect } from 'vitest';
import { DatabaseSync } from 'node:sqlite';
import type { KeyValueStorage } from '../src/data/repository';
import { SqliteStorage, type SqlDatabase } from '../src/data/sqliteStorage';
import { migrateLocalInventory } from '../src/data/migrateLocalStorage';
import { Repository } from '../src/data/repository';
import { emptyLocalState } from '../src/data/localInitialState';
import { seed, demoProfile } from '../src/data/seed';
class Legacy implements KeyValueStorage {
  data = new Map<string, string>();
  async getItem(k: string) {
    return this.data.get(k) ?? null;
  }
  async setItem(k: string, v: string) {
    this.data.set(k, v);
  }
  async getAllKeys() {
    return [...this.data.keys()];
  }
}
function db(control = { failRoot: false, failAt: 0, runs: 0 }): SqlDatabase {
  const database = new DatabaseSync(':memory:');
  const adapter: SqlDatabase = {
    execAsync: async (sql: string) => {
      database.exec(sql);
    },
    runAsync: async (sql: string, ...params: (string | number | null)[]) => {
      control.runs++;
      if ((control.failRoot && params[0] === 'chema:demo:v1') || control.failAt === control.runs)
        throw new Error('Disco lleno');
      return database.prepare(sql).run(...params);
    },
    getFirstAsync: async <T>(sql: string, ...params: (string | number | null)[]) =>
      (database.prepare(sql).get(...params) as T | undefined) ?? null,
    getAllAsync: async <T>(sql: string, ...params: (string | number | null)[]) =>
      database.prepare(sql).all(...params) as T[],
    withExclusiveTransactionAsync: async (f: (tx: typeof adapter) => Promise<void>) => {
      database.exec('BEGIN IMMEDIATE');
      try {
        await f(adapter);
        database.exec('COMMIT');
      } catch (e) {
        database.exec('ROLLBACK');
        throw e;
      }
    },
  };
  return adapter;
}
async function setup() {
  return { target: new SqliteStorage(db()), migrate: migrateLocalInventory };
}
describe('Migración de inventario local a SQLite', () => {
  it('copia inventario y recuperaciones sin tocar originales ni otras preferencias', async () => {
    const { target, migrate } = await setup();
    const legacy = new Legacy();
    legacy.data.set('chema:demo:v1', 'original íntegro ñ');
    legacy.data.set('chema:demo:v1:before-empty:1', 'copia anterior');
    legacy.data.set('chema:demo:v1:previous-empty', 'chema:demo:v1:before-empty:1');
    legacy.data.set('chema:theme:v1', 'dark');
    await migrate(legacy, target);
    expect(await target.getItem('chema:demo:v1')).toBe('original íntegro ñ');
    expect(await target.getItem('chema:demo:v1:before-empty:1')).toBe('copia anterior');
    expect(await target.getItem('chema:theme:v1')).toBeNull();
    expect(legacy.data.size).toBe(5);
  });
  it('no importa el legado de nuevo después de una escritura SQLite confirmada', async () => {
    const { target, migrate } = await setup();
    const legacy = new Legacy();
    legacy.data.set('chema:demo:v1', 'antes');
    await migrate(legacy, target);
    await target.setItem('chema:demo:v1', 'después');
    await migrate(legacy, target);
    expect(await target.getItem('chema:demo:v1')).toBe('después');
    expect(legacy.data.get('chema:demo:v1')).toBe('antes');
  });
  it('si una lectura falla no deja migración parcial y permite reintentar', async () => {
    const { target, migrate } = await setup();
    const legacy = new Legacy();
    legacy.data.set('chema:demo:v1', 'original');
    legacy.data.set('chema:demo:v1:before-empty:1', 'archivo');
    const original = legacy.getItem.bind(legacy);
    legacy.getItem = async (k) => {
      if (k.includes('before-empty')) throw new Error('Lectura interrumpida');
      return original(k);
    };
    await expect(migrate(legacy, target)).rejects.toThrow('Lectura interrumpida');
    expect(await target.getItem('chema:demo:v1')).toBeNull();
    legacy.getItem = original;
    await migrate(legacy, target);
    expect(await target.getItem('chema:demo:v1')).toBe('original');
  });
  it('guarda más de6MiB sin truncar y devuelve contenido exacto', async () => {
    const { target, migrate } = await setup();
    const legacy = new Legacy();
    const large = 'a'.repeat(7 * 1024 * 1024);
    legacy.data.set('chema:demo:v1', large);
    await migrate(legacy, target);
    expect(await target.getItem('chema:demo:v1')).toBe(large);
  });
});

it('fallo dentro de la migración revierte todas las filas y permite reintentar', async () => {
  const control = { failRoot: false, failAt: 2, runs: 0 };
  const target = new SqliteStorage(db(control));
  const legacy = new Legacy();
  legacy.data.set('chema:demo:v1', 'original');
  legacy.data.set('chema:demo:v1:before-empty:1', 'archivo');
  await expect(migrateLocalInventory(legacy, target)).rejects.toThrow('Disco lleno');
  expect(await target.getItem('chema:demo:v1')).toBeNull();
  control.failAt = 0;
  await migrateLocalInventory(legacy, target);
  expect(await target.getItem('chema:demo:v1')).toBe('original');
});
it('importación fallida conserva también el puntero de la recuperación anterior', async () => {
  const control = { failRoot: false, failAt: 0, runs: 0 };
  const target = new SqliteStorage(db(control));
  const repo = new Repository(target, 'chema:demo:v1', emptyLocalState);
  const before = await repo.load();
  await target.setItem('chema:demo:v1:previous-restore', 'archivo-anterior');
  const state = seed();
  const raw = JSON.stringify({ schema: 1, state, confirmed: state, queue: [] });
  control.failRoot = true;
  await expect(repo.restoreDemo(raw, demoProfile('ADMIN'))).rejects.toThrow('Disco lleno');
  expect(await target.getItem('chema:demo:v1:previous-restore')).toBe('archivo-anterior');
  expect(JSON.parse((await target.getItem('chema:demo:v1'))!)).toEqual(before);
});
it('si desaparece una base SQLite migrada no vuelve silenciosamente a un original antiguo',async()=>{
  const legacy=new Legacy();legacy.data.set('chema:demo:v1','legado anterior');
  const first=new SqliteStorage(db());await migrateLocalInventory(legacy,first);await first.setItem('chema:demo:v1','datos nuevos');
  const missing=new SqliteStorage(db());await expect(migrateLocalInventory(legacy,missing)).rejects.toThrow(/no.*encontr|desapareci|recuper/i);
  expect(await missing.getItem('chema:demo:v1')).toBeNull();expect(legacy.data.get('chema:demo:v1')).toBe('legado anterior');
});
