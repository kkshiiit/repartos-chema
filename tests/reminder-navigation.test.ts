import { describe, expect, it } from 'vitest';
import { reminderOpenFromResponse } from '../src/services/feedback/reminderNavigation';

function response(data: unknown = { kind: 'reminder', obraId: 'obra_1-A' }) {
  return {
    actionIdentifier: 'expo.modules.notifications.actions.DEFAULT',
    notification: {
      date: 1_893_499_200_000,
      request: {
        identifier: 'chema-local-reminder:obra_1-A:2030-01-01',
        content: { title: 'Retiro hoy', body: 'Dirección de la obra', data },
        trigger: null,
      },
    },
  };
}

describe('apertura validada de recordatorios', () => {
  it('extrae sólo el ID de obra y una clave estable de la respuesta local', () => {
    expect(reminderOpenFromResponse(response())).toEqual({
      obraId: 'obra_1-A',
      responseKey:
        '["chema-local-reminder:obra_1-A:2030-01-01",1893499200000,"expo.modules.notifications.actions.DEFAULT"]',
    });
  });

  it.each([
    '../otra',
    'obra/otra',
    'obra?admin=1',
    'obra#otra',
    'obra%2Fotra',
    '',
    'á',
    'a'.repeat(101),
  ])('rechaza IDs que no cumplen las reglas del dominio: %s', (obraId) => {
    expect(reminderOpenFromResponse(response({ kind: 'reminder', obraId }))).toBeNull();
  });

  it.each([null, {}, [], 'recordatorio', { kind: 'confirmation', obraId: 'obra_1-A' }])(
    'ignora datos ajenos a recordatorios válidos: %s',
    (data) => {
      expect(reminderOpenFromResponse(response(data))).toBeNull();
    },
  );

  it.each([null, {}, [], { notification: null }, { actionIdentifier: 'open' }])(
    'ignora respuestas incompletas sin lanzar errores: %s',
    (value) => {
      expect(reminderOpenFromResponse(value)).toBeNull();
    },
  );

  it.each([Number.NaN, Number.POSITIVE_INFINITY, -1, undefined, '2030-01-01'])(
    'exige una fecha numérica finita para deduplicar: %s',
    (date) => {
      const value = response();
      expect(
        reminderOpenFromResponse({ ...value, notification: { ...value.notification, date } }),
      ).toBeNull();
    },
  );

  it('distingue notificaciones, fechas de recepción y acciones diferentes', () => {
    const value = response();
    const original = reminderOpenFromResponse(value)!.responseKey;
    expect(
      reminderOpenFromResponse({ ...value, actionIdentifier: 'otra-accion' })!.responseKey,
    ).not.toBe(original);
    expect(
      reminderOpenFromResponse({
        ...value,
        notification: { ...value.notification, date: value.notification.date + 1 },
      })!.responseKey,
    ).not.toBe(original);
    expect(
      reminderOpenFromResponse({
        ...value,
        notification: {
          ...value.notification,
          request: { ...value.notification.request, identifier: 'otro-recordatorio' },
        },
      })!.responseKey,
    ).not.toBe(original);
  });

  it('rechaza identificadores de respuesta vacíos o ausentes', () => {
    const value = response();
    expect(reminderOpenFromResponse({ ...value, actionIdentifier: '' })).toBeNull();
    expect(
      reminderOpenFromResponse({
        ...value,
        notification: {
          ...value.notification,
          request: { ...value.notification.request, identifier: '' },
        },
      }),
    ).toBeNull();
  });
});
