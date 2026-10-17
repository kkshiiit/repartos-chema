import type { KeyValueStorage } from './repository';
import type { SqliteStorage } from './sqliteStorage';
const PREFIX = 'chema:demo:v1';
export const MIGRATION_KEY = 'chema:migrated-asyncstorage:v1';
const LEGACY_MIGRATION_MARKER = 'chema:sqlite-activated:v1';
export async function migrateLocalInventory(
  legacy: KeyValueStorage & { getAllKeys(): Promise<readonly string[]> },
  target: SqliteStorage,
) {
  if ((await target.getItem(MIGRATION_KEY)) === 'complete') {
    await legacy.setItem(LEGACY_MIGRATION_MARKER,'complete');
    return;
  }
  if (await legacy.getItem(LEGACY_MIGRATION_MARKER) === 'complete') throw new Error('No se encontró la base SQLite previamente activada. Se conserva el original de migración; recuperá una copia reciente antes de continuar.');
  const keys = (await legacy.getAllKeys()).filter(
    (k) => k === PREFIX || k.startsWith(PREFIX + ':'),
  );
  const entries: [string, string][] = [];
  for (const key of keys) {
    const raw = await legacy.getItem(key);
    if (raw === null)
      throw new Error(
        'La copia original cambió durante la migración. Reintenta; no se borraron datos.',
      );
    entries.push([key, raw]);
  }
  // Incluso un original corrupto se conserva byte por byte para recuperación asistida.
  // Repository valida el sobre antes de aceptar operaciones, sin reinicio silencioso.
  entries.push([MIGRATION_KEY, 'complete']);
  await target.atomicSet(entries);
  await legacy.setItem(LEGACY_MIGRATION_MARKER,'complete');
}
