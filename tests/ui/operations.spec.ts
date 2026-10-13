import { test, expect } from '@playwright/test';
test('retiro y reingreso conservan el total', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Administración', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Tus obras, al día.' })).toBeVisible();
  const total = () =>
    page.evaluate(() => {
      const s = JSON.parse(localStorage.getItem('chema:demo:v1')!).state;
      return s.materiales.reduce(
        (
          n: number,
          m: {
            cantidadGalpon: number;
            cantidadEnObra: number;
            cantidadEnTaller: number;
            cantidadPerdido: number;
          },
        ) => n + m.cantidadGalpon + m.cantidadEnObra + m.cantidadEnTaller + m.cantidadPerdido,
        0,
      );
    });
  const before = await total();
  await page.goto('/obra/obra_1');
  await page.getByRole('button', { name: 'Retirar', exact: true }).last().click();
  await page.getByRole('button', { name: 'Fabián', exact: true }).click();
  await page.getByRole('button', { name: 'Confirmar operación', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Reingresar', exact: true }).last()).toBeVisible();
  expect(await total()).toBe(before);
  await page.getByRole('button', { name: 'Reingresar', exact: true }).last().click();
  await page.getByRole('button', { name: 'Confirmar', exact: true }).click();
  await expect(page.getByText('Reingresado', { exact: true }).last()).toBeVisible();
  expect(await total()).toBe(before);
  await page.reload();
  expect(await total()).toBe(before);
});
