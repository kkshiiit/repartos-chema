import { businessDate } from '../domain/rules';

export const BUSINESS_TIME_ZONE = 'America/Argentina/Buenos_Aires';
const DAY_MS = 86_400_000;

/** Accepts only an existing ISO civil date; invalid days never roll into another month. */
export function isCalendarDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T12:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function calendarOrdinal(iso: string): number {
  // UTC is only an ordinal for civil dates here, never the duration of a business day.
  return Date.parse(`${iso}T00:00:00Z`) / DAY_MS;
}

export function addCalendarDays(iso: string, days: number): string | null {
  if (!isCalendarDate(iso) || !Number.isSafeInteger(days)) return null;
  const result = new Date((calendarOrdinal(iso) + days) * DAY_MS);
  if (!Number.isFinite(result.getTime())) return null;
  const date = result.toISOString().slice(0, 10);
  return isCalendarDate(date) ? date : null;
}

export function calendarDaysUntil(
  date: string | undefined | null,
  now: Date = new Date(),
): number | null {
  if (!isCalendarDate(date) || !Number.isFinite(now.getTime())) return null;
  const today = businessDate(now);
  if (!isCalendarDate(today)) return null;
  return calendarOrdinal(date) - calendarOrdinal(today);
}

type CivilTime = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
};

function civilTime(formatter: Intl.DateTimeFormat, instant: Date): CivilTime {
  const parts = formatter.formatToParts(instant);
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value);
  const year = value('year');
  return {
    year: parts.find((part) => part.type === 'era')?.value === 'BC' ? 1 - year : year,
    month: value('month'),
    day: value('day'),
    hour: value('hour'),
    minute: value('minute'),
    second: value('second'),
  };
}

function civilEpoch(value: CivilTime): number {
  // setUTCFullYear preserves years 0000–0099, unlike Date.UTC's 1900 offset.
  const date = new Date(0);
  date.setUTCFullYear(value.year, value.month - 1, value.day);
  date.setUTCHours(value.hour, value.minute, value.second, 0);
  return date.getTime();
}

/**
 * Converts an exact local date and time using IANA rules. A skipped time returns null;
 * a time repeated when clocks move back resolves to its first occurrence.
 */
export function businessInstant(
  iso: string,
  timeHHMM: string,
  zone = BUSINESS_TIME_ZONE,
): Date | null {
  if (
    !isCalendarDate(iso) ||
    typeof timeHHMM !== 'string' ||
    !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(timeHHMM)
  )
    return null;

  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: zone,
      calendar: 'gregory',
      numberingSystem: 'latn',
      era: 'short',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
    });
    const target: CivilTime = {
      year: Number(iso.slice(0, 4)),
      month: Number(iso.slice(5, 7)),
      day: Number(iso.slice(8, 10)),
      hour: Number(timeHHMM.slice(0, 2)),
      minute: Number(timeHHMM.slice(3, 5)),
      second: 0,
    };
    const targetEpoch = civilEpoch(target);
    const offsets = new Set<number>();
    // Inspect both sides of nearby offset changes, including the repeated DST hour.
    for (const hours of [-36, -24, -12, 0, 12, 24, 36]) {
      const sample = new Date(targetEpoch + hours * 3_600_000);
      offsets.add(civilEpoch(civilTime(formatter, sample)) - sample.getTime());
    }
    let earliest: number | null = null;
    for (const offset of offsets) {
      const candidate = targetEpoch - offset;
      if (civilEpoch(civilTime(formatter, new Date(candidate))) === targetEpoch)
        earliest = earliest === null ? candidate : Math.min(earliest, candidate);
    }
    return earliest === null ? null : new Date(earliest);
  } catch {
    // Unsupported/invalid IANA zones must not silently use the device's calendar.
    return null;
  }
}

export function retirementCountdown(
  obra: { estadoProceso: string; fechaRetiroEstimada?: string | null },
  now: Date = new Date(),
): { label: string; days: number | null; finished: boolean; date: string | null } {
  const date = isCalendarDate(obra.fechaRetiroEstimada) ? obra.fechaRetiroEstimada : null;
  if (obra.estadoProceso === 'RETIRADO' || obra.estadoProceso === 'REINGRESADO')
    return {
      label: obra.estadoProceso === 'RETIRADO' ? 'Retirado' : 'Reingresado',
      days: null,
      finished: true,
      date,
    };
  const days = calendarDaysUntil(date, now);
  const label =
    days === null
      ? 'Sin fecha de retiro'
      : days < 0
        ? `Retiro vencido hace ${-days} ${days === -1 ? 'día' : 'días'}`
        : days === 0
          ? 'Retirar hoy'
          : days === 1
            ? 'Retirar mañana'
            : `Retirar en ${days} días`;
  return { label, days, finished: false, date };
}
