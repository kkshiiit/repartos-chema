/** Preferences and reminders deliberately live outside the stock database. */
export const FEEDBACK_KEY = 'chema:local-feedback:v1';
export const REMINDER_PREFIX = 'chema-local-reminder:';
export interface RentalReference {
  id: string;
  clienteNombre: string;
  fechaRetiroEstimada: string;
  estadoProceso: string;
}
export interface Reminder {
  obraId: string;
  title: string;
  retirementDate: string;
  at: string;
  sound: boolean;
  vibrate: boolean;
  status: 'pending' | 'scheduled' | 'cancelled' | 'elapsed';
  reason?: string;
}
export interface FeedbackPreferences {
  confirmations: boolean;
  sound: boolean;
  vibration: boolean;
}
export interface FeedbackState {
  version: 1;
  preferences: FeedbackPreferences;
  reminders: Record<string, Reminder>;
}
export const initialFeedbackState = (): FeedbackState => ({
  version: 1,
  preferences: { confirmations: false, sound: false, vibration: false },
  reminders: {},
});
export interface ReminderAdapter {
  supported: boolean;
  permission(request: boolean): Promise<boolean>;
  scheduled(): Promise<string[]>;
  schedule(identifier: string, reminder: Reminder): Promise<void>;
  cancel(identifier: string): Promise<void>;
}
export interface PreferenceStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
}
export function parseFeedback(raw: string | null): FeedbackState {
  if (!raw) return initialFeedbackState();
  const data = JSON.parse(raw) as FeedbackState;
  if (
    !data ||
    typeof data !== 'object' ||
    data.version !== 1 ||
    !data.preferences ||
    !data.reminders ||
    Array.isArray(data.reminders) ||
    typeof data.reminders !== 'object' ||
    ['confirmations', 'sound', 'vibration'].some(
      (k) => typeof data.preferences[k as keyof FeedbackPreferences] !== 'boolean',
    )
  )
    throw new Error('Las preferencias de avisos no tienen un formato válido. No se modificaron.');
  for (const [key, reminder] of Object.entries(data.reminders)) {
    if (
      !reminder ||
      key !== reminder.obraId ||
      typeof reminder.title !== 'string' ||
      typeof reminder.retirementDate !== 'string' ||
      typeof reminder.at !== 'string' ||
      !Number.isFinite(Date.parse(reminder.at)) ||
      typeof reminder.sound !== 'boolean' ||
      typeof reminder.vibrate !== 'boolean' ||
      !['pending', 'scheduled', 'cancelled', 'elapsed'].includes(reminder.status)
    )
      throw new Error('No se pudieron validar los recordatorios guardados. No se modificaron.');
  }
  return data;
}
export function cancellationReason(
  reminder: Reminder,
  obra: RentalReference | undefined,
): string | undefined {
  if (!obra) return 'Se canceló porque el alquiler se eliminó o ya no está en el inventario.';
  if (['RETIRADO', 'REINGRESADO'].includes(obra.estadoProceso))
    return 'Se canceló porque el alquiler ya fue retirado o reingresado.';
  if (obra.fechaRetiroEstimada !== reminder.retirementDate)
    return 'Cambió la fecha de retiro. El aviso anterior se canceló; elegí una nueva fecha y hora.';
}
/** Serialized durable intents: retries use the same OS identifier, including after process interruption. */
export class ReminderService {
  private value = initialFeedbackState();
  private loaded = false;
  private queue: Promise<unknown> = Promise.resolve();
  constructor(
    private storage: PreferenceStorage,
    readonly adapter: ReminderAdapter,
    private now = () => Date.now(),
  ) {}
  snapshot() {
    return this.value;
  }
  private serial<T>(operation: () => Promise<T>): Promise<T> {
    const result = this.queue.catch(() => undefined).then(operation);
    this.queue = result;
    return result;
  }
  private async load() {
    if (!this.loaded) {
      this.value = parseFeedback(await this.storage.getItem(FEEDBACK_KEY));
      this.loaded = true;
    }
  }
  private async save(next: FeedbackState) {
    await this.storage.setItem(FEEDBACK_KEY, JSON.stringify(next));
    this.value = next;
  }
  initialize() {
    return this.serial(async () => {
      await this.load();
      return this.value;
    });
  }
  preferences(patch: Partial<FeedbackPreferences>) {
    return this.serial(async () => {
      await this.load();
      await this.save({ ...this.value, preferences: { ...this.value.preferences, ...patch } });
      return this.value;
    });
  }
  enable(obra: RentalReference, at: string, sound: boolean, vibrate: boolean) {
    return this.serial(async () => {
      await this.load();
      if (!this.adapter.supported)
        throw new Error(
          'Los recordatorios locales están disponibles en Android/iOS. La versión web no programa notificaciones.',
        );
      if (!Number.isFinite(Date.parse(at)) || Date.parse(at) <= this.now())
        throw new Error('Elegí una fecha y una hora futuras.');
      if (['RETIRADO', 'REINGRESADO'].includes(obra.estadoProceso))
        throw new Error('Este alquiler ya está finalizado.');
      if (!(await this.adapter.permission(true)))
        throw new Error(
          'No se autorizó el permiso de notificaciones. Podés habilitarlo en Ajustes del dispositivo y reintentar.',
        );
      const reminder: Reminder = {
        obraId: obra.id,
        title: obra.clienteNombre,
        retirementDate: obra.fechaRetiroEstimada,
        at,
        sound,
        vibrate,
        status: 'pending',
      };
      const previous = this.value.reminders[obra.id];
      if (
        previous?.status === 'scheduled' &&
        previous.at === at &&
        previous.retirementDate === reminder.retirementDate &&
        previous.sound === sound &&
        previous.vibrate === vibrate
      )
        return this.value;
      await this.save({
        ...this.value,
        reminders: { ...this.value.reminders, [obra.id]: reminder },
      });
      // Always cancel before replacement; intent stays pending if the OS operation fails.
      await this.adapter.cancel(REMINDER_PREFIX + obra.id);
      await this.adapter.schedule(REMINDER_PREFIX + obra.id, reminder);
      await this.save({
        ...this.value,
        reminders: { ...this.value.reminders, [obra.id]: { ...reminder, status: 'scheduled' } },
      });
      return this.value;
    });
  }
  cancel(obraId: string) {
    return this.serial(async () => {
      await this.load();
      const reminder = this.value.reminders[obraId];
      if (!reminder) return this.value;
      await this.save({
        ...this.value,
        reminders: {
          ...this.value.reminders,
          [obraId]: { ...reminder, status: 'cancelled', reason: 'Recordatorio desactivado.' },
        },
      });
      await this.adapter.cancel(REMINDER_PREFIX + obraId);
      return this.value;
    });
  }
  reconcile(obras: RentalReference[]) {
    return this.serial(async () => {
      await this.load();
      if (!this.adapter.supported) return this.value;
      const pending = new Set(await this.adapter.scheduled());
      const allowed = await this.adapter.permission(false);
      const errors: unknown[] = [];
      for (const [id, original] of Object.entries(this.value.reminders)) {
        try {
          const identifier = REMINDER_PREFIX + id;
          let reminder = original;
          if (['pending', 'scheduled'].includes(reminder.status)) {
            const reason = cancellationReason(
              reminder,
              obras.find((o) => o.id === id),
            );
            if (reason || !allowed)
              reminder = {
                ...reminder,
                status: 'cancelled',
                reason:
                  reason ||
                  'El permiso de notificaciones está desactivado. Activá nuevamente el aviso para reintentar.',
              };
            else if (
              Date.parse(reminder.at) <= this.now() &&
              (reminder.status === 'pending' || !pending.has(identifier))
            )
              reminder = {
                ...reminder,
                status: 'elapsed',
                reason: 'La hora elegida ya pasó. No se repite automáticamente.',
              };
            if (reminder !== original) {
              try {
                await this.save({
                  ...this.value,
                  reminders: { ...this.value.reminders, [id]: reminder },
                });
              } catch (error) {
                // Domain invalidation remains authoritative even when preference storage is full.
                // A later reconcile sees the same changed/deleted rental and cannot revive this intent.
                if (reason && pending.has(identifier)) await this.adapter.cancel(identifier);
                throw error;
              }
            }
          }
          if (reminder.status === 'cancelled' || reminder.status === 'elapsed') {
            if (pending.has(identifier)) await this.adapter.cancel(identifier);
          } else if (reminder.status === 'pending' || !pending.has(identifier)) {
            await this.adapter.cancel(identifier);
            await this.adapter.schedule(identifier, reminder);
            await this.save({
              ...this.value,
              reminders: { ...this.value.reminders, [id]: { ...reminder, status: 'scheduled' } },
            });
          }
        } catch (error) {
          errors.push(error);
        }
      }
      for (const identifier of pending) {
        if (
          identifier.startsWith(REMINDER_PREFIX) &&
          !this.value.reminders[identifier.slice(REMINDER_PREFIX.length)]
        )
          try {
            await this.adapter.cancel(identifier);
          } catch (error) {
            errors.push(error);
          }
      }
      if (errors.length) throw errors[0];
      return this.value;
    });
  }
}
/** Strict local entry; Date must not silently normalize 31/02 or skipped DST times. */
export function parseReminderDate(date: string, time: string): Date | null {
  const d = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(date),
    t = /^(\d{2}):(\d{2})$/.exec(time);
  if (!d || !t) return null;
  const day = Number(d[1]),
    month = Number(d[2]),
    year = Number(d[3]),
    hour = Number(t[1]),
    minute = Number(t[2]);
  const result = new Date(year, month - 1, day, hour, minute);
  return result.getFullYear() === year &&
    result.getMonth() === month - 1 &&
    result.getDate() === day &&
    result.getHours() === hour &&
    result.getMinutes() === minute
    ? result
    : null;
}
