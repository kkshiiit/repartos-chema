import { businessDate } from '../domain/rules';
import { displayDate, serializeDateInput } from '../utils/dateInput';
import { BUSINESS_TIME_ZONE, businessInstant, isCalendarDate } from '../utils/retirementCalendar';

export type DateTimeFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
};

export type PickerMode = 'date' | 'time';

export function isClockTime(value: string): boolean {
  return /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value);
}

export function isPickerValue(value: string, mode: PickerMode): boolean {
  return mode === 'date' ? isCalendarDate(value) : isClockTime(value);
}

export function displayPickerValue(value: string, mode: PickerMode): string {
  return mode === 'date' ? displayDate(value) : value;
}

export function serializePickerDraft(value: string, mode: PickerMode): string {
  return mode === 'date' ? serializeDateInput(value) : value;
}

/** A fallback is only a starting point in the picker; it never changes the saved draft. */
export function pickerAnchor(value: string, mode: PickerMode): Date {
  const today = businessDate();
  if (mode === 'date') return new Date(`${isCalendarDate(value) ? value : today}T12:00:00Z`);
  return (
    businessInstant(today, isClockTime(value) ? value : '09:00') || new Date(`${today}T12:00:00Z`)
  );
}

/** Read the calendar shown by the picker, regardless of the device's timezone. */
export function serializePickerSelection(date: Date, mode: PickerMode): string | null {
  if (!Number.isFinite(date.getTime())) return null;
  try {
    if (mode === 'date') {
      const value = businessDate(date);
      return isCalendarDate(value) ? value : null;
    }
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: BUSINESS_TIME_ZONE,
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(date);
    const value = `${parts.find((part) => part.type === 'hour')?.value}:${parts.find((part) => part.type === 'minute')?.value}`;
    return isClockTime(value) ? value : null;
  } catch {
    return null;
  }
}
