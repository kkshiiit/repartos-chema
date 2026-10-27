import { afterEach, expect, it, vi } from 'vitest';
import {
  captureTripOrigin,
  needsTripLocationReview,
  TripLocationError,
  type TripLocationProvider,
} from '../src/services/tripLocation';
const now = Date.parse('2026-10-27T12:00:00Z');
function provider(overrides: Partial<TripLocationProvider> = {}): TripLocationProvider {
  return {
    servicesEnabled: async () => true,
    permission: async () => ({ granted: true, canAskAgain: true }),
    requestPermission: async () => ({ granted: true, canAskAgain: true }),
    currentPosition: async () => ({
      coords: { latitude: -34, longitude: -58, accuracy: 10 },
      timestamp: now,
    }),
    ...overrides,
  };
}
afterEach(() => vi.useRealTimers());
it('captura origen real y conserva precisión/fecha sin cambiar inventario', async () => {
  const origin = await captureTripOrigin(provider());
  expect(origin).toEqual({
    kind: 'GPS',
    coordinates: { lat: -34, lng: -58 },
    accuracy: 10,
    capturedAt: '2026-10-27T12:00:00.000Z',
  });
  expect(needsTripLocationReview(origin, now)).toBe(false);
});
it('servicio apagado no pide permiso ni intenta capturar GPS', async () => {
  const capture = vi.fn();
  await expect(
    captureTripOrigin(provider({ servicesEnabled: async () => false, currentPosition: capture })),
  ).rejects.toMatchObject({ reason: 'GPS_OFF' });
  expect(capture).not.toHaveBeenCalled();
});
it('permiso permanente denegado no vuelve a solicitarlo ni obtiene una posición', async () => {
  const request = vi.fn(),
    capture = vi.fn();
  await expect(
    captureTripOrigin(
      provider({
        permission: async () => ({ granted: false, canAskAgain: false }),
        requestPermission: request,
        currentPosition: capture,
      }),
    ),
  ).rejects.toMatchObject({ reason: 'PERMISSION_BLOCKED' });
  expect(request).not.toHaveBeenCalled();
  expect(capture).not.toHaveBeenCalled();
});
it('denegar la solicitud no devuelve un origen alternativo', async () => {
  await expect(
    captureTripOrigin(
      provider({
        permission: async () => ({ granted: false, canAskAgain: true }),
        requestPermission: async () => ({ granted: false, canAskAgain: true }),
      }),
    ),
  ).rejects.toMatchObject({ reason: 'PERMISSION_DENIED' });
});
it('timeout acotado no acepta el resultado GPS que llega tarde', async () => {
  vi.useFakeTimers();
  let resolve!: (position: Awaited<ReturnType<TripLocationProvider['currentPosition']>>) => void;
  const pending = captureTripOrigin(
    provider({
      currentPosition: () =>
        new Promise((r) => {
          resolve = r;
        }),
    }),
    { timeoutMs: 100 },
  );
  const rejected = expect(pending).rejects.toMatchObject({ reason: 'TIMEOUT' });
  await vi.advanceTimersByTimeAsync(100);
  await rejected;
  resolve({ coords: { latitude: -34, longitude: -58, accuracy: 2 }, timestamp: now });
  await vi.advanceTimersByTimeAsync(1);
});
it('cancelar mientras llega la posición descarta el resultado', async () => {
  let cancelled = false;
  const promise = captureTripOrigin(
    provider({
      currentPosition: async () => {
        cancelled = true;
        return { coords: { latitude: -34, longitude: -58, accuracy: 2 }, timestamp: now };
      },
    }),
    { isCancelled: () => cancelled },
  );
  await expect(promise).rejects.toMatchObject({ reason: 'CANCELLED' });
});
it('posición inválida y error del proveedor se traducen sin filtrar excepciones de infraestructura', async () => {
  await expect(
    captureTripOrigin(
      provider({
        currentPosition: async () => ({
          coords: { latitude: 100, longitude: 0, accuracy: 10 },
          timestamp: now,
        }),
      }),
    ),
  ).rejects.toMatchObject({ reason: 'INVALID' });
  await expect(
    captureTripOrigin(
      provider({
        currentPosition: async () => {
          throw Error('Native location provider failed');
        },
      }),
    ),
  ).rejects.toBeInstanceOf(TripLocationError);
});
it('capturas viejas, futuras, imprecisas o sin precisión requieren revisión explícita', () => {
  const origin = {
    kind: 'GPS' as const,
    coordinates: { lat: -34, lng: -58 },
    capturedAt: '2026-10-27T12:00:00Z',
    accuracy: 10,
  };
  expect(needsTripLocationReview(origin, now + 121000)).toBe(true);
  expect(needsTripLocationReview({ ...origin, accuracy: 500 }, now)).toBe(true);
  expect(needsTripLocationReview({ ...origin, accuracy: undefined }, now)).toBe(true);
  expect(needsTripLocationReview(origin, now - 61000)).toBe(true);
});
