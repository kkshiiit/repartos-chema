import type { ReminderAdapter } from './reminders';
import type { ReminderOpen } from './reminderNavigation';
export type { ReminderOpen } from './reminderNavigation';
// Web fallback intentionally does not pretend to schedule browser/native notifications.
export const notificationAdapter: ReminderAdapter = {
  supported: false,
  permission: async () => false,
  scheduled: async () => [],
  schedule: async () => {
    throw new Error('Los recordatorios nativos no están disponibles en la versión web.');
  },
  cancel: async () => undefined,
};
export async function confirmationFeedback(_sound: boolean, _vibrate: boolean, _error: boolean) {
  // Browser feedback remains textual; no autoplay or permission prompt.
}
export async function requestFeedbackPermission() {
  return false;
}
export function watchReminderOpens(
  _onOpen: (value: ReminderOpen) => void,
  _onError: (message: string) => void,
): () => void {
  return () => {};
}
export async function acknowledgeReminderOpen(_responseKey: string): Promise<void> {}
