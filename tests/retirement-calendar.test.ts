import React from 'react';
import { act, create } from 'react-test-renderer';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  addCalendarDays,
  businessInstant,
  calendarDaysUntil,
  isCalendarDate,
  retirementCountdown,
} from '../src/utils/retirementCalendar';
import { useBusinessClock } from '../src/hooks/useBusinessClock';

const app = vi.hoisted(() => ({
  state: 'active',
  listeners: new Set<(state: string) => void>(),
}));
vi.mock('react-native', () => ({
  AppState: {
    get currentState() {
      return app.state;
    },
    addEventListener: (_: string, listener: (state: string) => void) => {
      app.listeners.add(listener);
      return { remove: () => app.listeners.delete(listener) };
    },
  },
}));

describe('calendario de retiros de Argentina', () => {
  it.each([
    ['2024-02-29', true],
    ['2000-02-29', true],
    ['1900-02-29', false],
    ['2026-02-29', false],
    ['2026-04-31', false],
    ['2026-13-01', false],
    ['2026-00-10', false],
    ['2026-10-00', false],
    ['2026-1-09', false],
    ['2026-10-09T00:00:00Z', false],
    [' 2026-10-09', false],
    ['', false],
    [null, false],
    [undefined, false],
    [20261009, false],
  ])('valida la fecha civil real %s', (value, expected) => {
    expect(isCalendarDate(value)).toBe(expected);
  });

  it.each([
    ['2024-02-28', 1, '2024-02-29'],
    ['2024-02-29', 1, '2024-03-01'],
    ['2026-02-28', 1, '2026-03-01'],
    ['2026-10-31', 1, '2026-11-01'],
    ['2026-12-31', 1, '2027-01-01'],
    ['2027-01-01', -1, '2026-12-31'],
    ['2026-02-30', 1, null],
    ['2026-10-09', 0.5, null],
    ['2026-10-09', Number.NaN, null],
    ['9999-12-31', 1, null],
  ])('suma %s + %s días sin normalizar entradas inválidas', (date, days, expected) => {
    expect(addCalendarDays(date, days)).toBe(expected);
  });

  it('cambia el contador a medianoche argentina, aunque resten segundos', () => {
    expect(calendarDaysUntil('2026-10-10', new Date('2026-10-10T02:59:59.999Z'))).toBe(1);
    expect(calendarDaysUntil('2026-10-10', new Date('2026-10-10T03:00:00Z'))).toBe(0);
    expect(calendarDaysUntil('2026-10-10', new Date('2026-10-11T03:00:00Z'))).toBe(-1);
    expect(calendarDaysUntil('2027-01-01', new Date('2026-12-31T03:00:00Z'))).toBe(1);
    expect(calendarDaysUntil('2024-03-01', new Date('2024-02-28T03:00:00Z'))).toBe(2);
  });

  it('no depende de la zona horaria local del dispositivo', () => {
    const previousZone = process.env.TZ;
    try {
      process.env.TZ = 'Asia/Tokyo';
      expect(calendarDaysUntil('2026-10-10', new Date('2026-10-10T02:00:00Z'))).toBe(1);
      expect(businessInstant('2026-10-10', '09:00')?.toISOString()).toBe(
        '2026-10-10T12:00:00.000Z',
      );
    } finally {
      if (previousZone === undefined) delete process.env.TZ;
      else process.env.TZ = previousZone;
    }
  });

  it.each([undefined, null, '', '2026-02-30'])(
    'devuelve null si falta o es inválida %s',
    (date) => {
      expect(calendarDaysUntil(date, new Date('2026-10-10T12:00:00Z'))).toBeNull();
    },
  );

  it('rechaza un instante actual inválido', () => {
    expect(calendarDaysUntil('2026-10-10', new Date(Number.NaN))).toBeNull();
  });

  it.each([
    ['2026-10-10', '00:00', '2026-10-10T03:00:00.000Z'],
    ['2026-12-31', '23:59', '2027-01-01T02:59:00.000Z'],
    ['2024-02-29', '09:30', '2024-02-29T12:30:00.000Z'],
  ])('convierte %s %s en un instante argentino', (date, time, expected) => {
    expect(businessInstant(date, time)?.toISOString()).toBe(expected);
  });

  it.each([
    ['2026-02-30', '09:00'],
    ['2026-10-10', '24:00'],
    ['2026-10-10', '09:60'],
    ['2026-10-10', '9:00'],
    ['2026-10-10', '09:00:00'],
  ])('rechaza la fecha/hora inexistente %s %s', (date, time) => {
    expect(businessInstant(date, time)).toBeNull();
  });

  it('rechaza una zona IANA inválida', () => {
    expect(businessInstant('2026-10-10', '09:00', 'invalid/zone')).toBeNull();
  });

  it('respeta DST y rechaza horas inexistentes sin mover la fecha elegida', () => {
    expect(businessInstant('2026-03-07', '09:00', 'America/New_York')?.toISOString()).toBe(
      '2026-03-07T14:00:00.000Z',
    );
    expect(businessInstant('2026-03-08', '09:00', 'America/New_York')?.toISOString()).toBe(
      '2026-03-08T13:00:00.000Z',
    );
    expect(businessInstant('2026-03-08', '02:30', 'America/New_York')).toBeNull();
    expect(businessInstant('2026-11-01', '01:30', 'America/New_York')?.toISOString()).toBe(
      '2026-11-01T05:30:00.000Z',
    );
  });

  it.each([
    ['2026-10-13', 'Retirar en 3 días', 3],
    ['2026-10-11', 'Retirar mañana', 1],
    ['2026-10-10', 'Retirar hoy', 0],
    ['2026-10-09', 'Retiro vencido hace 1 día', -1],
    ['2026-10-08', 'Retiro vencido hace 2 días', -2],
  ])('presenta el retiro %s con días civiles', (date, label, days) => {
    expect(
      retirementCountdown(
        { estadoProceso: 'ENTREGADO', fechaRetiroEstimada: date },
        new Date('2026-10-10T12:00:00Z'),
      ),
    ).toEqual({ label, days, finished: false, date });
  });

  it.each([
    ['RETIRADO', 'Retirado'],
    ['REINGRESADO', 'Reingresado'],
  ])('suprime el contador cuando el proceso está %s', (estadoProceso, label) => {
    expect(retirementCountdown({ estadoProceso, fechaRetiroEstimada: '2026-10-01' })).toEqual({
      label,
      days: null,
      finished: true,
      date: '2026-10-01',
    });
  });

  it.each([undefined, null, '', '2026-02-30'])('presenta ausencia de fecha válida %s', (date) => {
    expect(retirementCountdown({ estadoProceso: 'ENTREGADO', fechaRetiroEstimada: date })).toEqual({
      label: 'Sin fecha de retiro',
      days: null,
      finished: false,
      date: null,
    });
  });

  it('mantiene el objetivo de retiro en una entrega pendiente sin afirmar que está alquilada', () => {
    expect(
      retirementCountdown(
        { estadoProceso: 'PENDIENTE_ENTREGA', fechaRetiroEstimada: '2026-10-13' },
        new Date('2026-10-10T12:00:00Z'),
      ),
    ).toEqual({ label: 'Retirar en 3 días', days: 3, finished: false, date: '2026-10-13' });
  });
});

describe('reloj de negocio', () => {
  let view: ReturnType<typeof create> | undefined;
  let current: Date;
  const visibility = new EventTarget();
  let visibilityState = 'visible';

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-10T02:59:59Z'));
    app.state = 'active';
    visibilityState = 'visible';
    Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
    vi.stubGlobal('document', {
      get visibilityState() {
        return visibilityState;
      },
      addEventListener: visibility.addEventListener.bind(visibility),
      removeEventListener: visibility.removeEventListener.bind(visibility),
    });
  });

  afterEach(async () => {
    if (view) await act(async () => view!.unmount());
    view = undefined;
    vi.useRealTimers();
    vi.unstubAllGlobals();
    app.listeners.clear();
  });

  async function renderClock(timeZone?: string) {
    function Probe() {
      current = useBusinessClock(timeZone);
      return null;
    }
    await act(async () => {
      view = create(React.createElement(Probe));
    });
  }

  it('actualiza a medianoche argentina y libera suscripciones y temporizadores', async () => {
    await renderClock();
    expect(calendarDaysUntil('2026-10-10', current)).toBe(1);
    await act(async () => vi.advanceTimersByTime(1001));
    expect(calendarDaysUntil('2026-10-10', current)).toBe(0);
    expect(vi.getTimerCount()).toBe(1);
    await act(async () => view!.unmount());
    view = undefined;
    expect(vi.getTimerCount()).toBe(0);
    expect(app.listeners.size).toBe(0);
  });

  it('actualiza cuando una transición DST salta la medianoche de la zona elegida', async () => {
    vi.setSystemTime(new Date('2026-09-06T03:59:59Z'));
    await renderClock('America/Santiago');
    await act(async () => vi.advanceTimersByTime(1001));
    expect(current.toISOString()).toBe('2026-09-06T04:00:00.001Z');
    expect(vi.getTimerCount()).toBe(1);
  });

  it('pausa en segundo plano y recupera el calendario al activar la app', async () => {
    await renderClock();
    await act(async () => {
      for (const listener of app.listeners) listener('background');
    });
    expect(vi.getTimerCount()).toBe(0);
    vi.setSystemTime(new Date('2026-10-12T12:00:00Z'));
    await act(async () => {
      for (const listener of app.listeners) listener('active');
    });
    expect(calendarDaysUntil('2026-10-10', current)).toBe(-2);
    expect(vi.getTimerCount()).toBe(1);
  });

  it('recupera el día correcto al volver a mostrar una pestaña web', async () => {
    await renderClock();
    await act(async () => {
      visibilityState = 'hidden';
      visibility.dispatchEvent(new Event('visibilitychange'));
    });
    expect(vi.getTimerCount()).toBe(0);
    vi.setSystemTime(new Date('2026-10-11T12:00:00Z'));
    await act(async () => {
      visibilityState = 'visible';
      visibility.dispatchEvent(new Event('visibilitychange'));
    });
    expect(calendarDaysUntil('2026-10-10', current)).toBe(-1);
    expect(vi.getTimerCount()).toBe(1);
  });
});
