import { expect, it } from 'vitest';
import { actionSchema } from '../src/domain/schema';

it('rechaza una carga sobredimensionada antes de acumular errores por cada ítem', () => {
  const result = actionSchema.safeParse({
    type: 'SET_LOAD',
    obraId: 'obra_prueba',
    items: Array.from({ length: 101 }, () => ({})),
  });

  expect(result.success).toBe(false);
  if (result.success) throw new Error('Una carga de más de 100 ítems no es válida.');
  expect(result.error.issues).toHaveLength(1);
  expect(result.error.issues[0]).toMatchObject({
    code: 'too_big',
    maximum: 100,
    path: ['items'],
  });
});
