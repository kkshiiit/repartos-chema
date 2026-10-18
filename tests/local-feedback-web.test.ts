import { expect, it } from 'vitest';
import {
  notificationAdapter,
  confirmationFeedback,
  requestFeedbackPermission,
} from '../src/services/feedback/notification-adapter';
it('web no simula soporte nativo, sonidos o permisos de notificación', async () => {
  expect(notificationAdapter.supported).toBe(false);
  expect(await notificationAdapter.permission(true)).toBe(false);
  expect(await requestFeedbackPermission()).toBe(false);
  await expect(confirmationFeedback(true, true, false)).resolves.toBeUndefined();
  await expect(
    notificationAdapter.schedule('id', {
      obraId: 'test',
      title: 'Sintético',
      retirementDate: '2030-01-01',
      at: '2030-01-01T12:00:00Z',
      sound: false,
      vibrate: false,
      status: 'pending',
    }),
  ).rejects.toThrow('web');
});
