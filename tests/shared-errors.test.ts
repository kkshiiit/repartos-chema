import { expect, it } from 'vitest';
import { userError } from '../src/services/errors';
it('un JSON local ilegible se explica en español sin sugerir reiniciar datos', () => {
  let failure: unknown;
  try {
    JSON.parse('{roto');
  } catch (error) {
    failure = error;
  }
  expect(userError(failure)).toMatch(/original|conserv/);
  expect(userError(failure)).not.toMatch(/Unexpected|JSON at position/);
});
it('un rechazo de continuidad delta ofrece reintento, sin exponer códigos internos como mensaje', () => {
  const message = userError(new Error('DELTA_ORDER'));
  expect(message).toMatch(/cambios|copia/);
  expect(message).not.toContain('DELTA_ORDER');
});
