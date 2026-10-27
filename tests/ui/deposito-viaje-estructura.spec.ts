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

test('viaje: borrador, posición directa, persistencia, deshacer y regreso sin mover stock', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await loginSynthetic(page);
  await page.goto('/mapa');
  const before = await page.evaluate(() => localStorage.getItem('chema:demo:v1'));
  await expect(page.getByRole('button', { name: 'Abrir recorrido', exact: true })).toBeVisible();
  const stops = page.getByRole('button', { name: /^Parada 1: / });
  const first = await stops.first().getAttribute('aria-label');
  const originalName = first!.split(': ')[1]!.split('. Ver detalles')[0]!;
  const edit = async () => {
    await page.getByRole('button', { name: 'Cambiar orden', exact: true }).first().click();
    await page
      .getByRole('button', { name: `Elegir posición de ${originalName}`, exact: true })
      .click();
    await page.getByLabel('Nueva posición', { exact: true }).fill('2');
    await page.getByRole('button', { name: 'Aplicar posición', exact: true }).click();
  };
  await edit();
  await page.getByRole('button', { name: 'Cancelar', exact: true }).last().click();
  await expect(stops.first()).toHaveAttribute('aria-label', first!);
  await edit();
  await page.getByRole('button', { name: 'Guardar orden', exact: true }).click();
  await expect(page.getByText('Orden guardado en este teléfono.', { exact: true })).toBeVisible();
  await expect(stops.first()).not.toHaveAttribute('aria-label', first!);
  const changed = await stops.first().getAttribute('aria-label');
  await page.reload();
  await expect(stops.first()).toHaveAttribute('aria-label', changed!);
  await page.getByRole('button', { name: 'Opciones del viaje', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Usar mi ubicación', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Deshacer último orden', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Volver al depósito', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Ver tramos del recorrido', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Abrir tramo 1', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Cerrar', exact: true }).last().click();
  await expect(stops.first()).toHaveAttribute('aria-label', first!);
  await page.getByRole('button', { name: 'Depósito: ver regreso', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Volver al depósito', exact: true })).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('chema:demo:v1'))).toBe(before);
});
