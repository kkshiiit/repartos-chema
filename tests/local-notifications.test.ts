import {
  acknowledgeReminderOpen,
  notificationAdapter,
  watchReminderOpens,
} from '../src/services/feedback/notification-adapter.native';
import {
  acknowledgeReminderOpen as acknowledgeWeb,
  watchReminderOpens as watchWeb,
} from '../src/services/feedback/notification-adapter.ts';
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
  addNotificationResponseReceivedListener: vi.fn(),
  getLastNotificationResponseAsync: vi.fn(),
  clearLastNotificationResponseAsync: vi.fn(),
  listeners: new Set<(value: unknown) => void>(),
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
const foregroundHandler = notifications.setNotificationHandler.mock.calls[0]![0];
beforeEach(() => {
  vi.resetAllMocks();
  notifications.listeners.clear();
  notifications.getPermissionsAsync.mockResolvedValue({ granted: true, canAskAgain: true });
  notifications.getLastNotificationResponseAsync.mockResolvedValue(null);
  notifications.clearLastNotificationResponseAsync.mockResolvedValue(undefined);
  notifications.addNotificationResponseReceivedListener.mockImplementation((listener) => {
    notifications.listeners.add(listener);
    return { remove: () => notifications.listeners.delete(listener) };
  });
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
        sound: 'chema_recordatorio_calido.wav',
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
        content: expect.objectContaining({
          title: 'Recordatorio de alquiler',
          body: 'Cliente sintético · Revisá el retiro previsto en Repartos Chema.',
          data: { obraId: 'synthetic', kind: 'reminder', sound: true },
        }),
        trigger: {
          type: 'date',
          date: new Date(reminder.at),
          channelId: 'chema-reminder-v1-s1-v0',
        },
      }),
    );
  });
  it('presenta el título y cuerpo concretos del retiro sin alterar fecha ni datos de apertura', async () => {
    await notificationAdapter.schedule('retirement-id', {
      ...reminder,
      notificationTitle: 'Retiro mañana · Cliente sintético',
      notificationBody: 'Calle 123 · Retiro previsto: 2030-01-01.',
    });
    expect(notifications.scheduleNotificationAsync).toHaveBeenCalledWith({
      identifier: 'retirement-id',
      content: {
        title: 'Retiro mañana · Cliente sintético',
        body: 'Calle 123 · Retiro previsto: 2030-01-01.',
        sound: 'chema_recordatorio_calido.wav',
        vibrate: [0],
        data: { obraId: 'synthetic', kind: 'reminder', sound: true },
      },
      trigger: { type: 'date', date: new Date(reminder.at), channelId: 'chema-reminder-v1-s1-v0' },
    });
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

function response(obraId = 'synthetic', identifier = 'reminder-id', date = 1_893_499_200_000) {
  return {
    actionIdentifier: 'expo.modules.notifications.actions.DEFAULT',
    notification: {
      date,
      request: {
        identifier,
        content: {
          title: 'Retiro hoy',
          body: 'Calle 123',
          data: { kind: 'reminder', obraId, sound: false },
        },
        trigger: null,
      },
    },
  };
}

function emitResponse(value: unknown) {
  for (const listener of notifications.listeners) listener(value);
}

describe('abrir obra desde recordatorio local', () => {
  it('muestra recordatorios en primer plano y mantiene la confirmación sin banner', async () => {
    expect(await foregroundHandler.handleNotification(response().notification)).toEqual({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    });
    expect(
      await foregroundHandler.handleNotification({
        request: { content: { data: { kind: 'confirmation', sound: true } } },
      }),
    ).toEqual({
      shouldShowBanner: false,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    });
  });

  it('suscribe antes de recuperar la apertura del arranque en frío', async () => {
    notifications.getLastNotificationResponseAsync.mockResolvedValue(response());
    const onOpen = vi.fn();
    const onError = vi.fn();
    const stop = watchReminderOpens(onOpen, onError);
    await Promise.resolve();
    expect(notifications.addNotificationResponseReceivedListener).toHaveBeenCalledBefore(
      notifications.getLastNotificationResponseAsync,
    );
    expect(onOpen).toHaveBeenCalledExactlyOnceWith({
      obraId: 'synthetic',
      responseKey: '["reminder-id",1893499200000,"expo.modules.notifications.actions.DEFAULT"]',
    });
    expect(onError).not.toHaveBeenCalled();
    stop();
  });

  it('recibe toques en vivo y deduplica la misma respuesta emitida y recuperada al arrancar', async () => {
    let resolveLast!: (value: ReturnType<typeof response>) => void;
    notifications.getLastNotificationResponseAsync.mockReturnValue(
      new Promise((resolve) => {
        resolveLast = resolve;
      }),
    );
    const onOpen = vi.fn();
    const stop = watchReminderOpens(onOpen, vi.fn());
    emitResponse(response());
    emitResponse(response());
    resolveLast(response());
    await Promise.resolve();
    expect(onOpen).toHaveBeenCalledTimes(1);
    emitResponse(response('otra-obra', 'other-reminder'));
    emitResponse(response('synthetic', 'reminder-id', 1_893_499_200_001));
    expect(onOpen.mock.calls.map(([value]) => value.obraId)).toEqual([
      'synthetic',
      'otra-obra',
      'synthetic',
    ]);
    stop();
  });

  it('ignora confirmaciones, datos incompletos e IDs con inyección de rutas', async () => {
    const onOpen = vi.fn();
    const stop = watchReminderOpens(onOpen, vi.fn());
    emitResponse(response('../otra'));
    emitResponse(response('obra%2Fotra'));
    const confirmation = response();
    confirmation.notification.request.content.data.kind = 'confirmation';
    emitResponse(confirmation);
    emitResponse(null);
    emitResponse({ notification: {} });
    await Promise.resolve();
    expect(onOpen).not.toHaveBeenCalled();
    stop();
  });

  it('el desmontaje elimina el listener y descarta una lectura de arranque aún pendiente', async () => {
    let resolveLast!: (value: ReturnType<typeof response>) => void;
    notifications.getLastNotificationResponseAsync.mockReturnValue(
      new Promise((resolve) => {
        resolveLast = resolve;
      }),
    );
    const onOpen = vi.fn();
    const stop = watchReminderOpens(onOpen, vi.fn());
    stop();
    expect(notifications.listeners.size).toBe(0);
    emitResponse(response());
    resolveLast(response());
    await Promise.resolve();
    expect(onOpen).not.toHaveBeenCalled();
  });

  it('informa fallas al leer el arranque y sigue escuchando toques en vivo', async () => {
    const failure = new Error('No se pudo recuperar el toque.');
    notifications.getLastNotificationResponseAsync.mockRejectedValue(failure);
    const onOpen = vi.fn();
    const onError = vi.fn();
    const stop = watchReminderOpens(onOpen, onError);
    await Promise.resolve();
    await Promise.resolve();
    expect(onError).toHaveBeenCalledExactlyOnceWith(failure.message);
    emitResponse(response());
    expect(onOpen).toHaveBeenCalledOnce();
    stop();
  });

  it('informa una falla al suscribir sin lanzar durante el montaje', async () => {
    const failure = new Error('Sin listener nativo.');
    notifications.addNotificationResponseReceivedListener.mockImplementation(() => {
      throw failure;
    });
    const onError = vi.fn();
    const stop = watchReminderOpens(vi.fn(), onError);
    expect(onError).toHaveBeenCalledExactlyOnceWith(failure.message);
    stop();
  });

  it('no borra la respuesta persistida antes de confirmar la navegación', async () => {
    notifications.getLastNotificationResponseAsync.mockResolvedValue(response());
    const stop = watchReminderOpens(vi.fn(), vi.fn());
    await Promise.resolve();
    expect(notifications.clearLastNotificationResponseAsync).not.toHaveBeenCalled();
    stop();
  });

  it('confirma y limpia sólo la respuesta cuya clave coincide', async () => {
    notifications.getLastNotificationResponseAsync.mockResolvedValue(response());
    await acknowledgeReminderOpen(
      '["reminder-id",1893499200000,"expo.modules.notifications.actions.DEFAULT"]',
    );
    expect(notifications.clearLastNotificationResponseAsync).toHaveBeenCalledOnce();
  });

  it('no limpia otro recordatorio más reciente ni una confirmación', async () => {
    notifications.getLastNotificationResponseAsync.mockResolvedValue(response('otra', 'newer'));
    await acknowledgeReminderOpen(
      '["reminder-id",1893499200000,"expo.modules.notifications.actions.DEFAULT"]',
    );
    const confirmation = response();
    confirmation.notification.request.content.data.kind = 'confirmation';
    notifications.getLastNotificationResponseAsync.mockResolvedValue(confirmation);
    await acknowledgeReminderOpen(
      '["reminder-id",1893499200000,"expo.modules.notifications.actions.DEFAULT"]',
    );
    expect(notifications.clearLastNotificationResponseAsync).not.toHaveBeenCalled();
  });

  it('propaga al consumidor una falla al confirmar para permitir reintentar', async () => {
    const failure = new Error('No se pudo confirmar la apertura.');
    notifications.getLastNotificationResponseAsync.mockRejectedValue(failure);
    await expect(acknowledgeReminderOpen('key')).rejects.toThrow(failure);
  });

  it('web mantiene suscripción y confirmación inertes', async () => {
    const onOpen = vi.fn();
    const onError = vi.fn();
    const stop = watchWeb(onOpen, onError);
    await acknowledgeWeb('key');
    stop();
    expect(onOpen).not.toHaveBeenCalled();
    expect(onError).not.toHaveBeenCalled();
    expect(notifications.addNotificationResponseReceivedListener).not.toHaveBeenCalled();
    expect(notifications.getLastNotificationResponseAsync).not.toHaveBeenCalled();
    expect(notifications.clearLastNotificationResponseAsync).not.toHaveBeenCalled();
  });
});
