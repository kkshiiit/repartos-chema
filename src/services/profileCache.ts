import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import type { UserProfile } from '../types';
export async function saveProfile(profile: UserProfile) {
  const key = `chema-profile-${profile.uid}`,
    value = JSON.stringify(profile);
  if (Platform.OS === 'web') await AsyncStorage.setItem(key, value);
  else await SecureStore.setItemAsync(key, value);
}
export async function cachedProfile(uid: string): Promise<UserProfile | null> {
  const key = `chema-profile-${uid}`;
  const raw =
    Platform.OS === 'web' ? await AsyncStorage.getItem(key) : await SecureStore.getItemAsync(key);
  if (!raw) return null;
  const p = JSON.parse(raw) as UserProfile;
  return p.uid === uid && ['ADMIN', 'OPERADOR'].includes(p.role) ? p : null;
}
