import { DatabaseSync } from 'node:sqlite';
import type { SqlDatabase } from '../../src/data/sqliteStorage';
export function sqliteDb(control = { failRoot: false, failAt: 0, runs: 0 }): SqlDatabase {
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
