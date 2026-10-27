import AsyncStorage from '@react-native-async-storage/async-storage';
import type { SessionStorage } from './auth';
// Web has no native SecureStore. Keep the session in memory; closing the page requires signing in.
const entries = new Map<string, string>();
export const sharedSessionStorage: SessionStorage = {
  getItem: async (key) => entries.get(key) ?? null,
  setItem: async (key, value) => {
    entries.set(key, value);
  },
  removeItem: async (key) => {
    entries.delete(key);
  },
};
// UI workspace choice only; inventory and authentication tokens do not use this key.
export const sharedWorkspacePreference = AsyncStorage;
