import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { addCalendarDays, businessInstant, BUSINESS_TIME_ZONE } from '../utils/retirementCalendar';

/** Refreshes civil-day displays at business midnight and whenever the app becomes visible. */
export function useBusinessClock(timeZone = BUSINESS_TIME_ZONE): Date {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    let disposed = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let active = AppState.currentState !== 'background' && AppState.currentState !== 'inactive';
    const webDocument = typeof document === 'undefined' ? undefined : document;
    const visible = () => webDocument?.visibilityState !== 'hidden';
    const clearTimer = () => {
      if (timer !== undefined) clearTimeout(timer);
      timer = undefined;
    };

    const refresh = () => {
      clearTimer();
      if (disposed || !active || !visible()) return;
      const current = new Date();
      setNow(current);
      try {
        const formatter = new Intl.DateTimeFormat('en-CA', {
          timeZone,
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        });
        const dateAt = (instant: Date) => {
          const parts = formatter.formatToParts(instant);
          const part = (type: Intl.DateTimeFormatPartTypes) =>
            parts.find((value) => value.type === type)!.value;
          return `${part('year')}-${part('month')}-${part('day')}`;
        };
        const today = dateAt(current);
        const tomorrow = addCalendarDays(today, 1);
        let boundary = tomorrow ? businessInstant(tomorrow, '00:00', timeZone) : null;
        if (!boundary) {
          // Some IANA dates start after 00:00 (or are skipped entirely). Locate the
          // first instant whose civil date differs, rather than leaving the clock stopped.
          for (let days = 1; days <= 3 && !boundary; days++) {
            const date = addCalendarDays(today, days);
            const noon = date ? businessInstant(date, '12:00', timeZone) : null;
            if (!noon || noon.getTime() <= current.getTime()) continue;
            let lower = current.getTime();
            let upper = noon.getTime();
            while (upper - lower > 1) {
              const middle = Math.floor((lower + upper) / 2);
              if (dateAt(new Date(middle)) === today) lower = middle;
              else upper = middle;
            }
            boundary = new Date(upper);
          }
        }
        if (boundary) {
          // The extra millisecond prevents an early timer from retaining yesterday's date.
          timer = setTimeout(refresh, Math.max(1, boundary.getTime() - current.getTime() + 1));
        }
      } catch {
        // An unavailable timezone still refreshes on the next foreground/visibility event.
      }
    };

    const appSubscription = AppState.addEventListener('change', (state) => {
      active = state === 'active';
      refresh();
    });
    webDocument?.addEventListener('visibilitychange', refresh);
    refresh();

    return () => {
      disposed = true;
      clearTimer();
      appSubscription.remove();
      webDocument?.removeEventListener('visibilitychange', refresh);
    };
  }, [timeZone]);

  return now;
}
