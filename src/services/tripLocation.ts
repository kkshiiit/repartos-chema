import { coordinateOrNull } from '../domain/tripOrder';
import type { TripOrigin } from './tripPreferences';
export interface TripLocationProvider {
  servicesEnabled(): Promise<boolean>;
  permission(): Promise<{ granted: boolean; canAskAgain: boolean }>;
  requestPermission(): Promise<{ granted: boolean; canAskAgain: boolean }>;
  currentPosition(): Promise<{
    coords: { latitude: number; longitude: number; accuracy: number | null };
    timestamp: number;
  }>;
}
export class TripLocationError extends Error {
  constructor(
    readonly reason:
      | 'GPS_OFF'
      | 'PERMISSION_BLOCKED'
      | 'PERMISSION_DENIED'
      | 'TIMEOUT'
      | 'CANCELLED'
      | 'INVALID'
      | 'PROVIDER',
    message: string,
  ) {
    super(message);
  }
}
export async function captureTripOrigin(
  provider: TripLocationProvider,
  options: { timeoutMs?: number; isCancelled?: () => boolean } = {},
): Promise<TripOrigin> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const check = () => {
    if (options.isCancelled?.())
      throw new TripLocationError(
        'CANCELLED',
        'La captura se canceló. El origen anterior sigue intacto.',
      );
  };
  try {
    check();
    const enabled = await provider.servicesEnabled();
    check();
    if (!enabled)
      throw new TripLocationError(
        'GPS_OFF',
        'La ubicación del teléfono está apagada. Podés usar el depósito o el orden manual.',
      );
    let permission = await provider.permission();
    check();
    if (!permission.granted && permission.canAskAgain) {
      permission = await provider.requestPermission();
      check();
    }
    if (!permission.granted)
      throw new TripLocationError(
        permission.canAskAgain ? 'PERMISSION_DENIED' : 'PERMISSION_BLOCKED',
        permission.canAskAgain
          ? 'No habilitaste la ubicación. Podés usar el depósito o el orden manual.'
          : 'El permiso de ubicación está bloqueado. Podés abrir los permisos del teléfono o usar el depósito.',
      );
    const position = await Promise.race([
      provider.currentPosition(),
      new Promise<never>((_resolve, reject) => {
        timer = setTimeout(
          () =>
            reject(
              new TripLocationError(
                'TIMEOUT',
                'La ubicación tardó demasiado. Reintentá o usá el depósito; no cambiamos el origen.',
              ),
            ),
          options.timeoutMs ?? 15000,
        );
      }),
    ]);
    check();
    const coordinates = coordinateOrNull({
      lat: position.coords.latitude,
      lng: position.coords.longitude,
    });
    const date = new Date(position.timestamp);
    if (
      !coordinates ||
      !Number.isFinite(position.timestamp) ||
      !Number.isFinite(date.getTime()) ||
      (position.coords.accuracy !== null &&
        (!Number.isFinite(position.coords.accuracy) || position.coords.accuracy < 0))
    )
      throw new TripLocationError(
        'INVALID',
        'El teléfono no devolvió una ubicación válida. No cambiamos el origen.',
      );
    return {
      kind: 'GPS',
      coordinates,
      capturedAt: date.toISOString(),
      ...(position.coords.accuracy !== null ? { accuracy: position.coords.accuracy } : {}),
    };
  } catch (e) {
    if (e instanceof TripLocationError) throw e;
    throw new TripLocationError(
      'PROVIDER',
      'No pudimos obtener la ubicación del teléfono. Revisá el GPS o usá el depósito; no cambiamos el origen.',
    );
  } finally {
    if (timer) clearTimeout(timer);
  }
}
export function needsTripLocationReview(origin: TripOrigin, now = Date.now()): boolean {
  const age = now - Date.parse(origin.capturedAt);
  return (
    !Number.isFinite(age) || age > 120000 || age < -60000 || (origin.accuracy ?? Infinity) > 100
  );
}
