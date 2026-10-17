import { test, expect } from '@playwright/test';
import { loginSynthetic } from './helpers';
test('combo se crea, edita, fusiona sin IDs duplicados y elimina conservando la carga', async ({
  page,
}) => {
  const state = () => page.evaluate(() => JSON.parse(localStorage.getItem('chema:demo:v1')!).state);
  await loginSynthetic(page);
  await page.goto('/combos');
  await page.getByRole('button', { name: 'Nuevo combo', exact: true }).click();
  await page.getByLabel('Nombre del combo', { exact: true }).fill('Combo sintético');
  await page.getByRole('button', { name: 'Agregar material', exact: true }).click();
  await page.getByRole('button', { name: 'Agregar material', exact: true }).click();
  await page.getByRole('button', { name: 'Guardar combo', exact: true }).click();
  await expect.poll(async () => (await state()).combos.at(-1)?.nombreCombo).toBe('Combo sintético');
  expect((await state()).combos.at(-1).items).toHaveLength(1);
  expect((await state()).combos.at(-1).items[0].cantidad).toBe(2);
  await page.getByRole('button', { name: 'Editar combo', exact: true }).last().click();
  await page.getByLabel('Nombre del combo', { exact: true }).fill('Combo sintético editado');
  await page.getByRole('button', { name: 'Guardar combo', exact: true }).click();
  await expect(page.getByText('Combo sintético editado', { exact: true })).toBeVisible();
  const before = (await state()).obras.find((o: { id: string }) => o.id === 'obra_5');
  const first = (await state()).materiales[0].id;
  const prior =
    before.materialesCargados.find((m: { materialId: string }) => m.materialId === first)
      ?.cantidad || 0;
  await page.goto('/obra/obra_5');
  await page.getByRole('button', { name: 'Preparar carga', exact: true }).click();
  await page.getByRole('button', { name: 'Cargar combo', exact: true }).click();
  await page.getByRole('button', { name: 'Combo sintético editado', exact: true }).click();
  await page.getByRole('button', { name: 'Revisar combo', exact: true }).click();
  await page.getByRole('button', { name: 'Guardar carga', exact: true }).click();
  await expect
    .poll(
      async () =>
        (await state()).obras
          .find((o: { id: string }) => o.id === 'obra_5')
          .materialesCargados.find((m: { materialId: string }) => m.materialId === first).cantidad,
    )
    .toBe(prior + 2);
  const after = (await state()).obras.find((o: { id: string }) => o.id === 'obra_5');
  expect(
    after.materialesCargados.filter((m: { materialId: string }) => m.materialId === first),
  ).toHaveLength(1);
  expect(
    after.materialesCargados.find((m: { materialId: string }) => m.materialId === first).cantidad,
  ).toBe(prior + 2);
  await page.goto('/combos');
  await page.getByRole('button', { name: 'Eliminar', exact: true }).last().click();
  await page.getByRole('button', { name: 'Confirmar', exact: true }).click();
  await expect(page.getByText('Combo sintético editado', { exact: true })).toHaveCount(0);
  expect(
    (await state()).obras.find((o: { id: string }) => o.id === 'obra_5').materialesCargados,
  ).toEqual(after.materialesCargados);
});
