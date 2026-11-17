/** Android/iOS: SQLite (sin el límite de 6 MB de AsyncStorage). */
import Storage from 'expo-sqlite/kv-store';
export const kv = {
  getItem: (key: string) => Storage.getItem(key),
  setItem: (key: string, value: string) => Storage.setItem(key, value),
  removeItem: (key: string) => Storage.removeItem(key).then(() => undefined),
};
