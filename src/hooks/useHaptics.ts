import * as Haptics from 'expo-haptics';
export function haptic() {
  void Haptics.selectionAsync().catch(() => undefined);
}
