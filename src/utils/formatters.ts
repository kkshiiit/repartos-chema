import { isCalendarDate } from './retirementCalendar';

/** Display civil dates without rolling invalid historical values into another date. */
export function formatDate(value: unknown, short = false, fallback = 'Sin fecha'): string {
  if (!isCalendarDate(value)) return fallback;
  return (short ? value.slice(5) : value).split('-').reverse().join('/');
}
