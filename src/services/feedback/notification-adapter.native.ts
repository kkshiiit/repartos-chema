import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import type { ReminderAdapter } from './reminders';
import { reminderOpenFromResponse, type ReminderOpen } from './reminderNavigation';
export type { ReminderOpen } from './reminderNavigation';
const sounds = {
  reminder: 'chema_recordatorio_calido.wav',
  success: 'chema_confirmacion_sutil.wav',
  error: 'chema_atencion_suave.wav',
};
Notifications.setNotificationHandler({
  handleNotification: async (notification) => ({
    shouldShowBanner: notification.request.content.data?.kind !== 'confirmation',
    shouldShowList: true,
    shouldPlaySound: notification.request.content.data?.sound === true,
    shouldSetBadge: false,
  }),
});
async function channel(kind: keyof typeof sounds, sound: boolean, vibrate: boolean) {
  // Channel sound/vibration are immutable on Android; version/options are part of its identity.
  const id = `chema-${kind}-v1-s${Number(sound)}-v${Number(vibrate)}`;
  if (Platform.OS === 'android')
    await Notifications.setNotificationChannelAsync(id, {
      name:
        kind === 'reminder'
          ? `Recordatorios · sonido ${sound ? 'sí' : 'no'} · vibración ${vibrate ? 'sí' : 'no'}`
          : `Confirmaciones ${kind === 'error' ? 'de atención' : 'guardadas'} · sonido ${sound ? 'sí' : 'no'} · vibración ${vibrate ? 'sí' : 'no'}`,
      importance: Notifications.AndroidImportance.DEFAULT,
      sound: sound ? sounds[kind] : null,
      enableVibrate: vibrate,
      vibrationPattern: vibrate ? [0, 100] : [0],
      enableLights: false,
      showBadge: false,
      bypassDnd: false,
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PRIVATE,
      audioAttributes: {
        usage: Notifications.AndroidAudioUsage.NOTIFICATION,
        contentType: Notifications.AndroidAudioContentType.SONIFICATION,
        flags: { enforceAudibility: false, requestHardwareAudioVideoSynchronization: false },
      },
    });
  return id;
}
async function checkPermission(request: boolean) {
  let response = await Notifications.getPermissionsAsync();
  if (request && !response.granted && response.canAskAgain) {
    // Android 13 needs a channel before the permission prompt can be displayed.
    await channel('reminder', false, false);
    response = await Notifications.requestPermissionsAsync({
      ios: { allowAlert: true, allowSound: true, allowBadge: false },
    });
  }
  return response.granted;
}
let permissionRequest: Promise<boolean> | undefined;
function permission(request: boolean): Promise<boolean> {
  if (!request) return checkPermission(false);
  if (!permissionRequest)
    permissionRequest = checkPermission(true).finally(() => {
      permissionRequest = undefined;
    });
  return permissionRequest;
}
export const requestFeedbackPermission = () => permission(true);
export const notificationAdapter: ReminderAdapter = {
  supported: true,
  permission,
  scheduled: async () =>
    (await Notifications.getAllScheduledNotificationsAsync()).map((n) => n.identifier),
  schedule: async (identifier, reminder) => {
    const channelId = await channel('reminder', reminder.sound, reminder.vibrate);
    await Notifications.scheduleNotificationAsync({
      identifier,
      content: {
        title: reminder.notificationTitle || 'Recordatorio de alquiler',
        body:
          reminder.notificationBody ||
          `${reminder.title} · Revisá el retiro previsto en Repartos Chema.`,
        sound: reminder.sound ? sounds.reminder : false,
        vibrate: reminder.vibrate ? [0, 100] : [0],
        data: { obraId: reminder.obraId, kind: 'reminder', sound: reminder.sound },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: new Date(reminder.at),
        channelId,
      },
    });
  },
  cancel: (identifier) => Notifications.cancelScheduledNotificationAsync(identifier),
};

/** Subscribe before reading cold-start state so a tap during startup cannot be missed. */
export function watchReminderOpens(
  onOpen: (value: ReminderOpen) => void,
  onError: (message: string) => void,
): () => void {
  let active = true;
  let subscription:
    ReturnType<typeof Notifications.addNotificationResponseReceivedListener> | undefined;
  const seen = new Set<string>();
  const report = (error: unknown) => {
    if (!active) return;
    onError(
      error instanceof Error && error.message
        ? error.message
        : typeof error === 'string' && error
          ? error
          : 'No se pudo abrir el recordatorio.',
    );
  };
  const receive = (response: unknown) => {
    if (!active) return;
    const value = reminderOpenFromResponse(response);
    if (!value || seen.has(value.responseKey)) return;
    seen.add(value.responseKey);
    try {
      onOpen(value);
    } catch (error) {
      seen.delete(value.responseKey);
      report(error);
    }
  };
  try {
    subscription = Notifications.addNotificationResponseReceivedListener(receive);
  } catch (error) {
    report(error);
  }
  try {
    void Notifications.getLastNotificationResponseAsync().then(receive, report);
  } catch (error) {
    report(error);
  }
  return () => {
    if (!active) return;
    active = false;
    subscription?.remove();
  };
}

/** Called after navigation; never clear a newer, unrelated notification response. */
export async function acknowledgeReminderOpen(responseKey: string): Promise<void> {
  const latest = reminderOpenFromResponse(await Notifications.getLastNotificationResponseAsync());
  if (latest?.responseKey === responseKey) await Notifications.clearLastNotificationResponseAsync();
}

let feedbackPlaying = false;
let confirmationGeneration = 0;
export async function confirmationFeedback(sound: boolean, vibrate: boolean, error: boolean) {
  if ((!sound && !vibrate) || feedbackPlaying) return;
  feedbackPlaying = true;
  try {
    if (Platform.OS === 'android') {
      // Notification usage routes through system channels, ringer and DND rather than media volume.
      if (!(await permission(false))) throw new Error('El permiso de avisos está desactivado.');
      const channelId = await channel(error ? 'error' : 'success', sound, vibrate);
      const generation = ++confirmationGeneration;
      const identifier = await Notifications.scheduleNotificationAsync({
        identifier: 'chema-local-confirmation',
        content: {
          title: 'Repartos Chema',
          body: error ? 'Revisá el aviso en la app.' : 'Operación guardada.',
          autoDismiss: true,
          sound: sound ? sounds[error ? 'error' : 'success'] : false,
          vibrate: vibrate ? [0, 100] : [0],
          data: { kind: 'confirmation', sound },
        },
        trigger: { channelId },
      });
      setTimeout(() => {
        if (generation === confirmationGeneration)
          void Notifications.dismissNotificationAsync(identifier).catch(() => undefined);
      }, 6500);
    } else {
      if (vibrate)
        await Haptics.notificationAsync(
          error
            ? Haptics.NotificationFeedbackType.Warning
            : Haptics.NotificationFeedbackType.Success,
        );
      if (sound) {
        await setAudioModeAsync({
          playsInSilentMode: false,
          shouldPlayInBackground: false,
          allowsRecording: false,
          interruptionMode: 'mixWithOthers',
        });
        const player = createAudioPlayer(
          error
            ? require('../../../assets/sounds/chema_atencion_suave.wav')
            : require('../../../assets/sounds/chema_confirmacion_sutil.wav'),
        );
        player.volume = 0.45;
        player.play();
        setTimeout(() => {
          try {
            player.remove();
          } catch {
            /* Already released by native teardown. */
          }
        }, 2000);
      }
    }
  } finally {
    setTimeout(() => {
      feedbackPlaying = false;
    }, 1000);
  }
}
