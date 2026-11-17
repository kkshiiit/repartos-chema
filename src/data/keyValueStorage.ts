/** Almacenamiento clave-valor usado por la base local de la versión 1.x (se lee para migrar). */
export interface KeyValueStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  getAllKeys?(): Promise<readonly string[]>;
  getRecoveryItem?(key: string): Promise<string | null>;
  restoreMissingDatabase?(key: string, raw: string): Promise<void>;
  atomicSet?(entries: readonly (readonly [string, string])[]): Promise<void>;
}
