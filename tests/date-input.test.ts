import { expect, it } from 'vitest';
import { displayDate, serializeDateInput } from '../src/utils/dateInput';
import { validDate } from '../src/domain/rules';
it('preserva borradores incompletos y serializa la fecha local sin huso ni conversión UTC', () => {
  expect(serializeDateInput('18/10/2026')).toBe('2026-10-18');
  expect(displayDate('2026-10-18')).toBe('18/10/2026');
  expect(serializeDateInput('18/1')).toBe('18/1');
  expect(serializeDateInput('2026-10-18')).toBe('2026-10-18');
  expect(serializeDateInput('')).toBe('');
  expect(() => validDate(serializeDateInput('31/02/2026'))).toThrow();
});
