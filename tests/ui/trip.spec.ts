import { test, expect } from '@playwright/test';
import { loginSynthetic as login } from './helpers';
test('viaje vuelve al depósito fijo y recupera el cambio de Ajustes sin alterar inventario', async ({
  page,
}) => {
  await login(page);
  await page.goto('/mapa');
  await expect(page.getByText('Primero, los retiros', { exact: true })).toBeVisible();
  const inventory = await page.evaluate(() => localStorage.getItem('chema:demo:v1'));
  await page.evaluate(() => {
    (window as unknown as { chemaLinks: string[] }).chemaLinks = [];
    window.open = (url?: string | URL) => {
      (window as unknown as { chemaLinks: string[] }).chemaLinks.push(String(url));
      return null;
    };
  });
  await page.getByRole('button', { name: 'Volver al depósito', exact: true }).click();
  const first = await page.evaluate(() =>
    (window as unknown as { chemaLinks: string[] }).chemaLinks.at(-1)!,
  );
  expect(new URL(first).searchParams.get('destination')).toBe('-34.5530245,-58.5685218');
  await page.getByRole('button', { name: 'Abrir ajustes', exact: true }).click();
  const address = 'Depósito de prueba 123, Zona de prueba';
  await page.getByLabel('Dirección del depósito', { exact: true }).fill(address);
  await page.getByRole('button', { name: 'Guardar dirección', exact: true }).click();
  await expect(
    page.getByText('Dirección guardada en este dispositivo.', { exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Volver', exact: true }).click();
  await expect(page.getByText(address, { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Volver al depósito', exact: true }).click();
  const changed = await page.evaluate(() =>
    (window as unknown as { chemaLinks: string[] }).chemaLinks.at(-1)!,
  );
  expect(new URL(changed).searchParams.get('destination')).toBe(address);
  expect(await page.evaluate(() => localStorage.getItem('chema:demo:v1'))).toBe(inventory);
});
