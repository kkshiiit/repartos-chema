import { notificationAdapter } from '../src/services/feedback/notification-adapter.native';
import { beforeEach, describe, expect, it, vi } from 'vitest';
const os = vi.hoisted(() => ({ OS: 'android' }));
const notifications = vi.hoisted(() => ({
  setNotificationHandler: vi.fn(),
  getPermissionsAsync: vi.fn(),
  requestPermissionsAsync: vi.fn(),
  setNotificationChannelAsync: vi.fn(),
  getAllScheduledNotificationsAsync: vi.fn(),
  scheduleNotificationAsync: vi.fn(),
  cancelScheduledNotificationAsync: vi.fn(),
  dismissNotificationAsync: vi.fn(),
  AndroidImportance: { DEFAULT: 5 },
  AndroidNotificationVisibility: { PRIVATE: 2 },
  AndroidAudioUsage: { NOTIFICATION: 5 },
  AndroidAudioContentType: { SONIFICATION: 4 },
  SchedulableTriggerInputTypes: { DATE: 'date' },
}));
vi.mock('react-native', () => ({ Platform: os }));
vi.mock('expo-notifications', () => notifications);
vi.mock('expo-audio', () => ({ createAudioPlayer: vi.fn(), setAudioModeAsync: vi.fn() }));
vi.mock('expo-haptics', () => ({ notificationAsync: vi.fn() }));
const reminder = {
  obraId: 'synthetic',
  title: 'Cliente sintético',
  retirementDate: '2030-01-01',
  at: '2030-01-01T12:00:00Z',
  status: 'pending' as const,
  sound: true,
  vibrate: false,
};
beforeEach(() => {
  vi.clearAllMocks();
  notifications.getPermissionsAsync.mockResolvedValue({ granted: true, canAskAgain: true });
});
describe('adaptadores de notificaciones locales', () => {
  it('consultar permiso no dispara solicitud, incluso si está denegado', async () => {
    notifications.getPermissionsAsync.mockResolvedValue({ granted: false, canAskAgain: true });
    expect(await notificationAdapter.permission(false)).toBe(false);
    expect(notifications.requestPermissionsAsync).not.toHaveBeenCalled();
  });
  it('la activación solicita permiso con canal previo en Android 13', async () => {
    notifications.getPermissionsAsync.mockResolvedValue({ granted: false, canAskAgain: true });
    notifications.requestPermissionsAsync.mockResolvedValue({ granted: false });
    expect(await notificationAdapter.permission(true)).toBe(false);
    expect(notifications.setNotificationChannelAsync).toHaveBeenCalledBefore(
      notifications.requestPermissionsAsync,
    );
    expect(notifications.requestPermissionsAsync).toHaveBeenCalledOnce();
  });
  it('dos activaciones simultáneas comparten una sola solicitud de permiso', async () => {
    notifications.getPermissionsAsync.mockResolvedValue({ granted: false, canAskAgain: true });
    notifications.requestPermissionsAsync.mockResolvedValue({ granted: true });
    expect(
      await Promise.all([
        notificationAdapter.permission(true),
        notificationAdapter.permission(true),
      ]),
    ).toEqual([true, true]);
    expect(notifications.requestPermissionsAsync).toHaveBeenCalledOnce();
  });
  it('denegación definitiva no vuelve a pedir permiso', async () => {
    notifications.getPermissionsAsync.mockResolvedValue({ granted: false, canAskAgain: false });
    expect(await notificationAdapter.permission(true)).toBe(false);
    expect(notifications.requestPermissionsAsync).not.toHaveBeenCalled();
  });
  it('programa una fecha no recurrente con ID estable y tono local, sin eludir DND', async () => {
    await notificationAdapter.schedule('test-id', reminder);
    expect(notifications.setNotificationChannelAsync).toHaveBeenCalledWith(
      'chema-reminder-v1-s1-v0',
      expect.objectContaining({
        sound: '01_recordatorio_calido.wav',
        bypassDnd: false,
        enableVibrate: false,
        audioAttributes: expect.objectContaining({
          usage: 5,
          flags: expect.objectContaining({ enforceAudibility: false }),
        }),
      }),
    );
    expect(notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        identifier: 'test-id',
        trigger: {
          type: 'date',
          date: new Date(reminder.at),
          channelId: 'chema-reminder-v1-s1-v0',
        },
      }),
    );
  });
  it('opciones nuevas usan otro canal y apagar sonido no usa tono predeterminado', async () => {
    await notificationAdapter.schedule('test-id', { ...reminder, sound: false, vibrate: true });
    expect(notifications.setNotificationChannelAsync).toHaveBeenCalledWith(
      'chema-reminder-v1-s0-v1',
      expect.objectContaining({ sound: null, enableVibrate: true }),
    );
    expect(notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
      expect.objectContaining({ content: expect.objectContaining({ sound: false }) }),
    );
  });
  it('cancelar usa solo el identificador solicitado', async () => {
    await notificationAdapter.cancel('own-id');
    expect(notifications.cancelScheduledNotificationAsync).toHaveBeenCalledExactlyOnceWith(
      'own-id',
    );
  });
});
