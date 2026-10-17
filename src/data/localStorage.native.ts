import AsyncStorage from '@react-native-async-storage/async-storage';
import { openDatabaseAsync } from 'expo-sqlite';
import { SqliteStorage, type SqlDatabase } from './sqliteStorage';
import { migrateLocalInventory } from './migrateLocalStorage';
let connection: Promise<SqliteStorage> | undefined;
function ready() {
  return (connection ??= (async () => {
    const database = await openDatabaseAsync('chema-inventario-v1.db');
    const store = new SqliteStorage(database as unknown as SqlDatabase);
    await migrateLocalInventory(AsyncStorage, store);
    return store;
  })().catch((error) => {
    connection = undefined;
    throw error;
  }));
}
export const inventoryStorage = {
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
};
