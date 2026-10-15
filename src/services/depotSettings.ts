import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_DEPOT, parseDepotSettings, type DepotSettings } from '../utils/trip';
const KEY = 'chema:depot:v1';
export async function loadDepot() {
  const raw = await AsyncStorage.getItem(KEY);
  return raw === null ? DEFAULT_DEPOT : parseDepotSettings(raw);
}
export async function saveDepot(value: DepotSettings) {
  const valid = parseDepotSettings(JSON.stringify(value));
  await AsyncStorage.setItem(KEY, JSON.stringify(valid));
  return valid;
}
