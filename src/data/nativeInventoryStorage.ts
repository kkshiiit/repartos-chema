import type { KeyValueStorage } from './keyValueStorage';
import { MIGRATION_KEY, migrateLocalInventory, type MigrationGuard } from './migrateLocalStorage';
import type { SqliteStorage } from './sqliteStorage';
import { parseEnvelope, validateImportEnvelope } from './validation';
export function createNativeInventoryStorage(
  legacy: KeyValueStorage & { getAllKeys(): Promise<readonly string[]> },
  open: () => Promise<SqliteStorage>,
  guard: MigrationGuard,
) {
  let connection: Promise<SqliteStorage> | undefined;
  const ready = () =>
    (connection ??= (async () => {
      const store = await open();
      try {
        await migrateLocalInventory(legacy, store, guard);
        if (!(await guard.activated())) await guard.activate();
        return store;
      } catch (e) {
        await store.close().catch(() => undefined);
        if ((e as { code?: string }).code === 'LOCAL_DATABASE_MISSING') throw e;
        throw Object.assign(
          new Error(
            'No se pudo completar la migración local. Se conserva el original. Podés recuperar un JSON reciente sin reiniciar el inventario.',
          ),
          { code: 'LOCAL_MIGRATION_FAILED', cause: e },
        );
      }
    })().catch((e) => {
      connection = undefined;
      throw e;
    }));
  return {
    async getItem(key: string) {
      return (await ready()).getItem(key);
    },
    async setItem(key: string, value: string) {
      await (await ready()).setItem(key, value);
    },
    async getAllKeys() {
      return (await ready()).getAllKeys();
    },
    async atomicSet(entries: readonly (readonly [string, string])[]) {
      await (await ready()).atomicSet(entries);
    },
    async getRecoveryItem(key: string) {
      try {
        return await (await ready()).getItem(key);
      } catch {
        const original = await legacy.getItem(key);
        if (original === null)
          throw new Error(
            'No hay original de migración accesible. Conservá los archivos y recuperá un JSON reciente.',
          );
        return JSON.stringify({
          format: 'chema-migration-original-v1',
          nota: 'Original anterior a migración, puede no incluir cambios recientes. Recuperación asistida; no es una copia actual.',
          originalRaw: original,
        });
      }
    },
    async restoreMissingDatabase(key: string, raw: string) {
      if (key !== 'chema:demo:v1') throw new Error('Clave de recuperación no permitida.');
      const restored = parseEnvelope(raw);
      validateImportEnvelope(restored);
      if (restored.queue.length) throw new Error('La copia contiene envíos remotos.');
      const store = await open();
      try {
        if ((await store.getItem(MIGRATION_KEY)) === 'complete')
          throw new Error('La base cambió. Reintentá la importación normal.');
        const entries: [string, string][] = [];
        const current = await store.getItem(key);
        const original = await legacy.getItem(key).catch(() => null);
        if (current !== null)
          entries.push([key + ':before-recovery:' + Date.now() + '_current', current]);
        if (original !== null)
          entries.push([key + ':before-recovery:' + Date.now() + '_legacy', original]);
        entries.push([key, raw], [MIGRATION_KEY, 'complete']);
        await store.atomicSet(entries);
        if (!(await guard.activated())) await guard.activate();
        connection = Promise.resolve(store);
      } catch (error) {
        await store.close().catch(() => undefined);
        throw error;
      }
    },
  };
}
