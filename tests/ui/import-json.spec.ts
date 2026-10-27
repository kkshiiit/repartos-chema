import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { login } from './helpers';
const raw = readFileSync('tests/fixtures/whatsapp-five.json');
test('seleccionar JSON abre revisión, cancelar conserva datos, confirmar persiste los cinco pedidos', async ({
  page,
}) => {
  await login(page, 'Importación local');
  await page.goto('/configuracion');
  await page.getByRole('button', { name: 'Copias y restauración', exact: true }).click();
  const before = await page.evaluate(() => localStorage.getItem('chema:demo:v1'));
  const select = async (buffer: Buffer, name = 'pedidos.json') => {
    const chooser = page.waitForEvent('filechooser');
    await page.getByRole('button', { name: 'Elegir copia', exact: true }).click();
    await (await chooser).setFiles({ name, mimeType: 'application/json', buffer });
  };
  await select(raw);
  await expect(
    page.getByText('Archivo validado: 5 alquileres y 10 materiales.', { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Restaurar esta copia', exact: true }),
  ).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('chema:demo:v1'))).toBe(before);
  await page.getByRole('button', { name: 'Cancelar importación', exact: true }).click();
  expect(await page.evaluate(() => localStorage.getItem('chema:demo:v1'))).toBe(before);
  await select(Buffer.from('{"format":'));
  await expect(page.getByText(/El archivo JSON está incompleto/)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Restaurar esta copia', exact: true })).toHaveCount(
    0,
  );
  expect(await page.evaluate(() => localStorage.getItem('chema:demo:v1'))).toBe(before);
  await select(raw);
  await page.getByRole('button', { name: 'Restaurar esta copia', exact: true }).click();
  await expect(
    page.getByText('Importación completada: 5 alquileres guardados en este celular.', {
      exact: true,
    }),
  ).toBeVisible();
  await page.reload();
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem('chema:demo:v1')!).state.obras.length,
    ),
  ).toBe(5);
  await page.getByRole('button', { name: 'Copias y restauración', exact: true }).click();
  await page.getByRole('button', { name: 'Deshacer última importación', exact: true }).click();
  await page.getByRole('button', { name: 'Confirmar', exact: true }).click();
  await expect(
    page.getByText('Se recuperaron los datos anteriores a la importación.', { exact: true }),
  ).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('chema:demo:v1'))).toBe(before);
});
