import { expect, test } from '@playwright/test';
import { loginSynthetic } from './helpers';

test('depósito: filas y menú conservan las operaciones y el inventario al cancelar', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await loginSynthetic(page);
  await page.goto('/galpon');
  const before = await page.evaluate(() => localStorage.getItem('chema:demo:v1'));
  await expect(page.getByRole('button', { name: 'Agregar material', exact: true })).toBeVisible();
  const options = page.getByRole('button', { name: /^Opciones de / }).first();
  await options.click();
  await expect(
    page.getByRole('heading', { name: 'Opciones de la pieza', exact: true }),
  ).toBeVisible();
  for (const action of ['Editar', 'Mover stock', 'Ajustar']) {
    await expect(page.getByRole('button', { name: action, exact: true })).toBeVisible();
  }
  await page.getByRole('button', { name: 'Mover stock', exact: true }).click();
  await expect(page.getByLabel('Cantidad a mover', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Cerrar', exact: true }).last().click();
  expect(await page.evaluate(() => localStorage.getItem('chema:demo:v1'))).toBe(before);
});

test('viaje: secuencia, orden manual, tramos y regreso siguen accesibles desde los detalles', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await loginSynthetic(page);
  await page.goto('/mapa');
  const before = await page.evaluate(() => localStorage.getItem('chema:demo:v1'));
  await expect(page.getByRole('button', { name: 'Abrir recorrido', exact: true })).toBeVisible();
  const stops = page.getByRole('button', { name: /^Parada \d+: / });
  const first = await stops.first().getAttribute('aria-label');
  await stops.first().click();
  await expect(page.getByRole('button', { name: 'Subir parada 1', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'Bajar parada 1', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Parada 2', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Cómo llegar', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Cerrar', exact: true }).last().click();
  expect(await stops.first().getAttribute('aria-label')).not.toBe(first);
  await page.getByRole('button', { name: 'Opciones del viaje', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Usar mi ubicación', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Restablecer orden', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Volver al depósito', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Ver tramos del recorrido', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Abrir tramo 1', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Cerrar', exact: true }).last().click();
  expect(await stops.first().getAttribute('aria-label')).toBe(first);
  await page.getByRole('button', { name: 'Depósito: ver regreso', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Volver al depósito', exact: true })).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('chema:demo:v1'))).toBe(before);
});
