import type { KeyValueStorage } from './repository';
export interface SqlDatabase {
  closeAsync?(): Promise<void>;
  execAsync(sql: string): Promise<void>;
  runAsync(sql: string, ...params: (string | number | null)[]): Promise<unknown>;
  getFirstAsync<T>(sql: string, ...params: (string | number | null)[]): Promise<T | null>;
  getAllAsync<T>(sql: string, ...params: (string | number | null)[]): Promise<T[]>;
  withExclusiveTransactionAsync(task: (tx: SqlDatabase) => Promise<void>): Promise<void>;
}
export class SqliteStorage implements KeyValueStorage {
  private initialized: Promise<void> | undefined;
  constructor(private database: SqlDatabase) {}
  initialize() {
    return (this.initialized ??= this.database
      .execAsync(
        'PRAGMA journal_mode = WAL; PRAGMA synchronous = FULL; CREATE TABLE IF NOT EXISTS chema_kv (key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL);',
      )
      .catch((e) => {
        this.initialized = undefined;
        throw e;
      }));
  }
  async close() {
    await this.database.closeAsync?.();
  }
  async getItem(key: string) {
    await this.initialize();
    return (
      (
        await this.database.getFirstAsync<{ value: string }>(
          'SELECT value FROM chema_kv WHERE key = ?',
          key,
        )
      )?.value ?? null
    );
  }
  async setItem(key: string, value: string) {
    await this.initialize();
    await this.database.runAsync(
      'INSERT INTO chema_kv (key,value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value',
      key,
      value,
    );
  }
  async getAllKeys() {
    await this.initialize();
    return (await this.database.getAllAsync<{ key: string }>('SELECT key FROM chema_kv')).map(
      (r) => r.key,
    );
  }
  async atomicSet(entries: readonly (readonly [string, string])[]) {
    await this.initialize();
    await this.database.withExclusiveTransactionAsync(async (tx) => {
      for (const [key, value] of entries) {
        await tx.runAsync(
          'INSERT INTO chema_kv (key,value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value',
          key,
          value,
        );
        const saved = await tx.getFirstAsync<{ value: string }>(
          'SELECT value FROM chema_kv WHERE key = ?',
          key,
        );
        if (saved?.value !== value)
          throw new Error('No se pudo verificar el guardado. Se conserva el original.');
      }
    });
  }
}
