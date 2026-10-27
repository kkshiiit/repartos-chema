import {
  BUSINESS_TIME_ZONE,
  addCalendarDays,
  businessInstant,
  isCalendarDate,
} from '../../utils/retirementCalendar';

/** Preferences and durable notification intents deliberately live outside the stock database. */
export const FEEDBACK_KEY = 'chema:local-feedback:v1';
export const REMINDER_PREFIX = 'chema-local-reminder:';
const SUSPENDED_SCOPES_KEY = 'chema:reminder-suspensions:v1';
const storageQueues = new WeakMap<PreferenceStorage, Promise<unknown>>();
export interface RentalReference {
  id: string;
  clienteNombre: string;
  fechaRetiroEstimada: string;
  estadoProceso: string;
  direccion?: string;
}
export interface RetirementPolicy {
  enabled: boolean;
  time: string;
  offsets: number[];
}
export type RentalReminderPolicy =
  { mode: 'general' } | ({ mode: 'custom' } & RetirementPolicy) | { mode: 'legacy' };
export interface Reminder {
  obraId: string;
  title: string;
  retirementDate: string;
  at: string;
  sound: boolean;
  vibrate: boolean;
  status: 'pending' | 'scheduled' | 'cancelled' | 'elapsed';
  reason?: string;
  offset?: number;
  notificationTitle?: string;
  notificationBody?: string;
  direccion?: string;
  scope?: string;
  /** Kept until native cancellation succeeds, including across process restarts. */
  cancellationPending?: boolean;
}
export interface FeedbackPreferences {
  confirmations: boolean;
  sound: boolean;
  vibration: boolean;
}
export interface FeedbackState {
  version: 2;
  preferences: FeedbackPreferences;
  globalPolicy: RetirementPolicy;
  rentalPolicies: Record<string, RentalReminderPolicy>;
  reminders: Record<string, Reminder>;
}
export const defaultRetirementPolicy = (): RetirementPolicy => ({
  enabled: false,
  time: '08:00',
  offsets: [3, 2, 1, 0],
});
export const initialFeedbackState = (): FeedbackState => ({
  version: 2,
  preferences: { confirmations: false, sound: false, vibration: false },
  globalPolicy: defaultRetirementPolicy(),
  rentalPolicies: {},
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
const record = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value);
const validOffset = (value: unknown): value is number =>
  typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 3;
function validPolicy(value: unknown): value is RetirementPolicy {
  return (
    record(value) &&
    typeof value.enabled === 'boolean' &&
    typeof value.time === 'string' &&
    /^([01]\d|2[0-3]):[0-5]\d$/.test(value.time) &&
    Array.isArray(value.offsets) &&
    value.offsets.every(validOffset) &&
    new Set(value.offsets).size === value.offsets.length &&
    (!value.enabled || value.offsets.length > 0)
  );
}
function policyCopy(value: RetirementPolicy): RetirementPolicy {
  if (!validPolicy(value)) throw new Error('Elegí una hora válida y al menos un día de aviso.');
  return { enabled: value.enabled, time: value.time, offsets: [...value.offsets] };
}
function validRentalPolicy(value: unknown): value is RentalReminderPolicy {
  return (
    record(value) &&
    (value.mode === 'general' ||
      value.mode === 'legacy' ||
      (value.mode === 'custom' && validPolicy(value)))
  );
}
export function parseFeedback(raw: string | null): FeedbackState {
  if (!raw) return initialFeedbackState();
  const data: unknown = JSON.parse(raw);
  if (
    !record(data) ||
    (data.version !== 1 && data.version !== 2) ||
    !record(data.preferences) ||
    !record(data.reminders) ||
    ['confirmations', 'sound', 'vibration'].some(
      (key) => typeof (data.preferences as Record<string, unknown>)[key] !== 'boolean',
    )
  )
    throw new Error('Las preferencias de avisos no tienen un formato válido. No se modificaron.');
  for (const [key, reminder] of Object.entries(data.reminders)) {
    if (
      !record(reminder) ||
      typeof reminder.obraId !== 'string' ||
      (reminder.offset === undefined
        ? key !== reminder.obraId
        : !validOffset(reminder.offset) || key !== `${reminder.obraId}:d${reminder.offset}`) ||
      (data.version === 1 && reminder.offset !== undefined) ||
      typeof reminder.title !== 'string' ||
      typeof reminder.retirementDate !== 'string' ||
      typeof reminder.at !== 'string' ||
      !Number.isFinite(Date.parse(reminder.at)) ||
      typeof reminder.sound !== 'boolean' ||
      typeof reminder.vibrate !== 'boolean' ||
      !['pending', 'scheduled', 'cancelled', 'elapsed'].includes(String(reminder.status)) ||
      (reminder.cancellationPending !== undefined &&
        typeof reminder.cancellationPending !== 'boolean') ||
      ['reason', 'notificationTitle', 'notificationBody', 'direccion'].some(
        (field) => reminder[field] !== undefined && typeof reminder[field] !== 'string',
      )
    )
      throw new Error('No se pudieron validar los recordatorios guardados. No se modificaron.');
  }
  if (data.version === 2) {
    if (
      !validPolicy(data.globalPolicy) ||
      !record(data.rentalPolicies) ||
      !Object.values(data.rentalPolicies).every(validRentalPolicy)
    )
      throw new Error('Las políticas de avisos no tienen un formato válido. No se modificaron.');
    return data as unknown as FeedbackState;
  }
  // Migration only changes the in-memory representation until the next successful write.
  // A protected legacy policy prevents general defaults from duplicating an existing manual alarm.
  return {
    ...data,
    version: 2,
    preferences: data.preferences as unknown as FeedbackPreferences,
    reminders: data.reminders as unknown as Record<string, Reminder>,
    globalPolicy: defaultRetirementPolicy(),
    rentalPolicies: Object.fromEntries(
      Object.keys(data.reminders).map((id) => [id, { mode: 'legacy' as const }]),
    ),
  };
}
export function cancellationReason(reminder: Reminder, obra: RentalReference | undefined) {
  if (!obra) return 'Se canceló porque el alquiler se eliminó o ya no está en el inventario.';
  if (['RETIRADO', 'REINGRESADO'].includes(obra.estadoProceso))
    return 'Se canceló porque el alquiler ya fue retirado o reingresado.';
  if (obra.fechaRetiroEstimada !== reminder.retirementDate)
    return 'Cambió la fecha de retiro. El aviso anterior se canceló; elegí una nueva fecha y hora.';
}
const permissionMessage =
  'No se autorizó el permiso de notificaciones. Podés habilitarlo en Ajustes del dispositivo y reintentar.';
const webMessage =
  'Los recordatorios locales están disponibles en Android/iOS. La versión web no programa notificaciones.';
const active = (reminder: Reminder) => ['pending', 'scheduled'].includes(reminder.status);
const same = (left: unknown, right: unknown) => JSON.stringify(left) === JSON.stringify(right);
/** One serialized service owns policies, manual reminders and native notification identifiers. */
export class ReminderService {
  private readonly storageKey: string;
  private readonly prefix: string;
  private readonly scope?: string;
  private value = initialFeedbackState();
  private loaded = false;
  constructor(
    private storage: PreferenceStorage,
    readonly adapter: ReminderAdapter,
    private now = () => Date.now(),
    options?: { storageKey?: string; identifierPrefix?: string; scope?: string },
  ) {
    this.storageKey = options?.storageKey || FEEDBACK_KEY;
    this.prefix = options?.identifierPrefix || REMINDER_PREFIX;
    this.scope = options?.scope;
  }
  /** Journal before touching the OS: another account/restart must finish failed cancellations. */
  suspend() {
    return this.serial(async () => {
      if (!this.adapter.supported) return;
      const prefixes = await this.suspendedPrefixes();
      if (!prefixes.includes(this.prefix)) {
        prefixes.push(this.prefix);
        await this.storage.setItem(SUSPENDED_SCOPES_KEY, JSON.stringify(prefixes));
      }
      await this.finishSuspensions();
    });
  }
  private async suspendedPrefixes(): Promise<string[]> {
    const raw = await this.storage.getItem(SUSPENDED_SCOPES_KEY);
    if (raw === null) return [];
    try {
      const data: unknown = JSON.parse(raw);
      if (
        !Array.isArray(data) ||
        data.length > 1000 ||
        !data.every((v) => typeof v === 'string' && v.length > 0 && v.length <= 1000)
      )
        throw new Error('FORMAT');
      return [...new Set(data)] as string[];
    } catch {
      throw new Error(
        'No pudimos leer las cancelaciones pendientes. Se conservan; reintentá antes de activar avisos.',
      );
    }
  }
  private async finishSuspensions() {
    if (!this.adapter.supported) return;
    const prefixes = await this.suspendedPrefixes();
    if (!prefixes.length) return;
    const scheduled = await this.adapter.scheduled();
    for (const prefix of prefixes) {
      for (const id of scheduled) if (id.startsWith(prefix)) await this.adapter.cancel(id);
    }
    await this.storage.setItem(SUSPENDED_SCOPES_KEY, '[]');
  }
  private scoped(reminder: Reminder): Reminder {
    return this.scope ? { ...reminder, scope: this.scope } : reminder;
  }
  snapshot() {
    return this.value;
  }
  private serial<T>(operation: () => Promise<T>): Promise<T> {
    const result = (storageQueues.get(this.storage) || Promise.resolve())
      .catch(() => undefined)
      .then(operation);
    storageQueues.set(this.storage, result);
    return result;
  }
  private async load() {
    if (!this.loaded) {
      this.value = parseFeedback(await this.storage.getItem(this.storageKey));
      this.loaded = true;
    }
  }
  private async save(next: FeedbackState) {
    await this.storage.setItem(this.storageKey, JSON.stringify(next));
    this.value = next;
  }
  private async put(id: string, reminder: Reminder) {
    await this.save({ ...this.value, reminders: { ...this.value.reminders, [id]: reminder } });
  }
  private effective(state: FeedbackState, obraId: string): RetirementPolicy | null {
    const policy = state.rentalPolicies[obraId];
    return policy?.mode === 'legacy'
      ? null
      : policy?.mode === 'custom'
        ? policy
        : state.globalPolicy;
  }
  private plan(state: FeedbackState, obras: RentalReference[]): FeedbackState {
    const reminders = { ...state.reminders };
    const desired = new Set<string>();
    for (const obra of obras) {
      const policy = this.effective(state, obra.id);
      if (!policy?.enabled || ['RETIRADO', 'REINGRESADO'].includes(obra.estadoProceso)) continue;
      if (!isCalendarDate(obra.fechaRetiroEstimada)) continue;
      for (const offset of policy.offsets) {
        const day = addCalendarDays(obra.fechaRetiroEstimada, -offset);
        const instant = day ? businessInstant(day, policy.time, BUSINESS_TIME_ZONE) : null;
        if (!instant) continue;
        const key = `${obra.id}:d${offset}`;
        desired.add(key);
        const when = offset === 0 ? 'hoy' : offset === 1 ? 'mañana' : `en ${offset} días`;
        const date = obra.fechaRetiroEstimada.split('-').reverse().join('/');
        const content = {
          obraId: obra.id,
          title: obra.clienteNombre,
          retirementDate: obra.fechaRetiroEstimada,
          at: instant.toISOString(),
          // Confirmation preferences are independent of automatic retirement notices.
          sound: false,
          vibrate: false,
          offset,
          notificationTitle: `Retiro ${when} · ${obra.clienteNombre}`,
          notificationBody: `${obra.direccion ? `${obra.direccion} · ` : ''}Retiro previsto: ${date}.`,
          ...(obra.direccion ? { direccion: obra.direccion } : {}),
        };
        const previous = reminders[key];
        const unchanged =
          previous &&
          Object.entries(content).every(
            ([field, value]) => previous[field as keyof Reminder] === value,
          );
        if (unchanged && (active(previous) || previous.status === 'elapsed')) {
          reminders[key] = previous;
        } else {
          reminders[key] = {
            ...content,
            status: instant.getTime() > this.now() ? 'pending' : 'elapsed',
            ...(instant.getTime() <= this.now()
              ? { reason: 'La hora prevista ya pasó. No se repite automáticamente.' }
              : {}),
            cancellationPending: true,
          };
        }
      }
    }
    for (const [key, reminder] of Object.entries(reminders)) {
      const obra = obras.find((item) => item.id === reminder.obraId);
      const manualProtected = state.rentalPolicies[reminder.obraId]?.mode === 'legacy';
      const reason =
        reminder.offset === undefined
          ? manualProtected
            ? cancellationReason(reminder, obra)
            : 'Se reemplazó el aviso manual por la política de retiro.'
          : !desired.has(key)
            ? cancellationReason(reminder, obra) || 'Aviso desactivado por la política de retiro.'
            : undefined;
      if (reason && active(reminder)) {
        reminders[key] = { ...reminder, status: 'cancelled', reason, cancellationPending: true };
      }
    }
    return { ...state, reminders };
  }
  initialize() {
    return this.serial(async () => {
      await this.finishSuspensions();
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
  configureGeneral(policy: RetirementPolicy, obras: RentalReference[]) {
    return this.serial(async () => {
      await this.load();
      const globalPolicy = policyCopy(policy);
      await this.save(this.plan({ ...this.value, globalPolicy }, obras));
      return this.applyNative(globalPolicy.enabled, globalPolicy.enabled);
    });
  }
  configureRental(obraId: string, policy: RentalReminderPolicy, obras: RentalReference[]) {
    return this.serial(async () => {
      await this.load();
      if (!validRentalPolicy(policy))
        throw new Error('La política de avisos no tiene un formato válido.');
      const rentalPolicy: RentalReminderPolicy =
        policy.mode === 'custom'
          ? { mode: 'custom', ...policyCopy(policy) }
          : { mode: policy.mode };
      const next = {
        ...this.value,
        rentalPolicies: { ...this.value.rentalPolicies, [obraId]: rentalPolicy },
      };
      await this.save(this.plan(next, obras));
      const enabled = this.effective(next, obraId)?.enabled ?? false;
      return this.applyNative(enabled, enabled);
    });
  }
  enable(obra: RentalReference, at: string, sound: boolean, vibrate: boolean) {
    return this.serial(async () => {
      await this.load();
      if (!this.adapter.supported) throw new Error(webMessage);
      if (!Number.isFinite(Date.parse(at)) || Date.parse(at) <= this.now())
        throw new Error('Elegí una fecha y una hora futuras.');
      if (['RETIRADO', 'REINGRESADO'].includes(obra.estadoProceso))
        throw new Error('Este alquiler ya está finalizado.');
      // Preserve the public manual API: denial never writes a manual intent.
      if (!(await this.adapter.permission(true))) throw new Error(permissionMessage);
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
      const reminders = { ...this.value.reminders, [obra.id]: reminder };
      for (const [key, item] of Object.entries(reminders)) {
        if (item.obraId === obra.id && item.offset !== undefined && active(item))
          reminders[key] = {
            ...item,
            status: 'cancelled',
            cancellationPending: true,
            reason: 'Se eligió un aviso manual.',
          };
      }
      await this.save({
        ...this.value,
        reminders,
        rentalPolicies: { ...this.value.rentalPolicies, [obra.id]: { mode: 'legacy' } },
      });
      for (const [key, item] of Object.entries(reminders)) {
        if (item.obraId === obra.id && item.offset !== undefined && item.cancellationPending) {
          await this.adapter.cancel(this.prefix + key);
          await this.put(key, { ...item, cancellationPending: false });
        }
      }
      await this.adapter.cancel(this.prefix + obra.id);
      await this.adapter.schedule(this.prefix + obra.id, this.scoped(reminder));
      await this.put(obra.id, { ...reminder, status: 'scheduled' });
      return this.value;
    });
  }
  cancel(obraId: string) {
    return this.serial(async () => {
      await this.load();
      const targets = Object.entries(this.value.reminders).filter(
        ([, item]) => item.obraId === obraId,
      );
      if (!targets.length) return this.value;
      const reminders = { ...this.value.reminders };
      for (const [key, item] of targets)
        reminders[key] = {
          ...item,
          status: 'cancelled',
          reason: 'Recordatorio desactivado.',
          cancellationPending: true,
        };
      const effective = this.effective(this.value, obraId);
      await this.save({
        ...this.value,
        reminders,
        rentalPolicies: effective
          ? {
              ...this.value.rentalPolicies,
              [obraId]: { mode: 'custom', ...effective, enabled: false },
            }
          : this.value.rentalPolicies,
      });
      const errors: unknown[] = [];
      for (const [key] of targets) {
        try {
          await this.adapter.cancel(this.prefix + key);
          await this.put(key, { ...this.value.reminders[key]!, cancellationPending: false });
        } catch (error) {
          errors.push(error);
        }
      }
      if (errors.length) throw errors[0];
      return this.value;
    });
  }
  reconcile(obras: RentalReference[]) {
    return this.serial(async () => {
      await this.load();
      const next = this.plan(this.value, obras);
      if (!same(next, this.value)) {
        try {
          await this.save(next);
        } catch (error) {
          // A domain invalidation still cancels a stale native alarm when storage is full.
          if (this.adapter.supported) {
            for (const [key, reminder] of Object.entries(this.value.reminders)) {
              if (
                active(reminder) &&
                cancellationReason(
                  reminder,
                  obras.find((o) => o.id === reminder.obraId),
                )
              ) {
                try {
                  await this.adapter.cancel(this.prefix + key);
                } catch {
                  /* Retry on the next reconciliation. */
                }
              }
            }
          }
          throw error;
        }
      }
      return this.applyNative(false, false);
    });
  }
  private async applyNative(requestPermission: boolean, explicitActivation: boolean) {
    await this.finishSuspensions();
    if (!this.adapter.supported) {
      if (explicitActivation) throw new Error(webMessage);
      return this.value;
    }
    const scheduled = new Set(await this.adapter.scheduled());
    const orphans = [...scheduled].filter(
      (identifier) =>
        identifier.startsWith(this.prefix) &&
        !this.value.reminders[identifier.slice(this.prefix.length)],
    );
    if (orphans.length) {
      const reminders = { ...this.value.reminders };
      for (const identifier of orphans) {
        const key = identifier.slice(this.prefix.length);
        const automatic = /^(.+):d([0-3])$/.exec(key);
        reminders[key] = {
          obraId: automatic?.[1] ?? key,
          title: 'Aviso anterior',
          retirementDate: '',
          at: new Date(this.now()).toISOString(),
          sound: false,
          vibrate: false,
          status: 'cancelled',
          cancellationPending: true,
          reason: 'Se canceló un aviso anterior sin configuración local.',
          ...(automatic ? { offset: Number(automatic[2]) } : {}),
        };
      }
      await this.save({ ...this.value, reminders });
    }
    const errors: unknown[] = [];
    const blocked = new Set<string>();
    const blockedManual = new Set<string>();
    // Complete removals before adding anything. A failed manual cancellation blocks all new
    // automatic alarms for that rental, avoiding legacy + automatic duplicates.
    for (const [key, reminder] of Object.entries(this.value.reminders)) {
      if (active(reminder)) continue;
      const identifier = this.prefix + key;
      if (!reminder.cancellationPending && !scheduled.has(identifier)) continue;
      try {
        await this.adapter.cancel(identifier);
        scheduled.delete(identifier);
        if (reminder.cancellationPending)
          await this.put(key, { ...reminder, cancellationPending: false });
      } catch (error) {
        errors.push(error);
        blockedManual.add(reminder.obraId);
        if (reminder.offset === undefined) blocked.add(reminder.obraId);
      }
    }
    const allowed = await this.adapter.permission(requestPermission);
    let deniedAutomatic = explicitActivation && !allowed;
    for (const [key, original] of Object.entries(this.value.reminders)) {
      if (!active(original)) continue;
      const identifier = this.prefix + key;
      let reminder = original;
      try {
        if (
          Date.parse(reminder.at) <= this.now() &&
          (reminder.status === 'pending' || !scheduled.has(identifier) || !allowed)
        ) {
          reminder = {
            ...reminder,
            status: 'elapsed',
            reason: 'La hora prevista ya pasó. No se repite automáticamente.',
            cancellationPending: true,
          };
          await this.put(key, reminder);
          await this.adapter.cancel(identifier);
          scheduled.delete(identifier);
          await this.put(key, { ...reminder, cancellationPending: false });
          continue;
        }
        if (!allowed) {
          const automatic = reminder.offset !== undefined;
          deniedAutomatic ||= automatic && Date.parse(reminder.at) > this.now();
          reminder = {
            ...reminder,
            status: automatic ? 'pending' : 'cancelled',
            reason: permissionMessage,
            cancellationPending: true,
          };
          await this.put(key, reminder);
          await this.adapter.cancel(identifier);
          scheduled.delete(identifier);
          await this.put(key, { ...reminder, cancellationPending: false });
          continue;
        }
        if (
          blocked.has(reminder.obraId) ||
          (reminder.offset === undefined && blockedManual.has(reminder.obraId))
        )
          continue;
        if (reminder.status === 'pending' || !scheduled.has(identifier)) {
          reminder = {
            ...reminder,
            status: 'pending',
            reason: undefined,
            cancellationPending: true,
          };
          await this.put(key, reminder);
          await this.adapter.cancel(identifier);
          scheduled.delete(identifier);
          // Native cancellation can take long enough to cross the intended minute.
          if (Date.parse(reminder.at) <= this.now()) {
            await this.put(key, {
              ...reminder,
              status: 'elapsed',
              reason: 'La hora prevista ya pasó. No se repite automáticamente.',
              cancellationPending: false,
            });
            continue;
          }
          await this.adapter.schedule(identifier, this.scoped(reminder));
          scheduled.add(identifier);
          await this.put(key, { ...reminder, status: 'scheduled', cancellationPending: false });
        }
      } catch (error) {
        errors.push(error);
      }
    }
    if (deniedAutomatic) errors.push(new Error(permissionMessage));
    if (errors.length) throw errors[0];
    return this.value;
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
