import * as FirebaseAuth from 'firebase/auth';
import type { Persistence } from 'firebase/auth';
import * as SecureStore from 'expo-secure-store';
const secureKey = (key: string) => key.replace(/[^\w.-]/g, '_');
const storage = {
  async getItem(key: string) {
    const k = secureKey(key),
      n = Number(await SecureStore.getItemAsync(k));
    if (!n) return null;
    let value = '';
    for (let i = 0; i < n; i++) {
      const part = await SecureStore.getItemAsync(`${k}.${i}`);
      if (part === null) return null;
      value += part;
    }
    return value;
  },
  async setItem(key: string, value: string) {
    const k = secureKey(key),
      n = Math.ceil(value.length / 1500);
    const oldCount = Number(await SecureStore.getItemAsync(k));
    await SecureStore.deleteItemAsync(k);
    for (let i = 0; i < n; i++)
      await SecureStore.setItemAsync(`${k}.${i}`, value.slice(i * 1500, (i + 1) * 1500));
    await SecureStore.setItemAsync(k, String(n));
    for (let i = n; i < oldCount; i++) await SecureStore.deleteItemAsync(`${k}.${i}`);
  },
  async removeItem(key: string) {
    const k = secureKey(key),
      n = Number(await SecureStore.getItemAsync(k));
    await SecureStore.deleteItemAsync(k);
    for (let i = 0; i < n; i++) await SecureStore.deleteItemAsync(`${k}.${i}`);
  },
};
// Firebase 13 publica esta API bajo la condición react-native, no en sus tipos web.
const rnAuth = FirebaseAuth as typeof FirebaseAuth & {
  getReactNativePersistence: (adapter: typeof storage) => Persistence;
};
export const authPersistence = rnAuth.getReactNativePersistence(storage);
