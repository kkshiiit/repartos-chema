import { loginSynthetic as login } from './helpers';
import { test, expect } from '@playwright/test';
test('equipo crea, entrega, deshace y descarga documentos', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.setViewportSize({ width: 1440, height: 1000 });
  await login(page);
  await expect(page.getByRole('heading', { name: 'Alquileres', exact: true })).toBeVisible();
  await page.screenshot({
    path: 'artifacts/capturas/estructura-1.5/dashboard-desktop.png',
    fullPage: true,
  });
  await page.getByRole('button', { name: 'Nuevo alquiler', exact: true }).click();
  await page.getByLabel('Nombre del cliente', { exact: true }).fill('Obra de prueba UI');
  await page.getByLabel('Dirección', { exact: true }).fill('Dirección de demostración 123');
  await page.getByLabel('Barrio / localidad', { exact: true }).fill('Zona de prueba');
  await page.getByRole('button', { name: 'Continuar a carga', exact: true }).click();
  await page.getByRole('button', { name: 'Revisar alquiler', exact: true }).click();
  await page.getByRole('button', { name: 'Guardar alquiler', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Obra de prueba UI', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Preparar carga', exact: true }).click();
  await page.getByRole('button', { name: 'Agregar material', exact: true }).last().click();
  await page.getByRole('button', { name: 'Guardar carga', exact: true }).click();
  await expect(
    page.getByText('Preparadas', { exact: true }).locator('..').getByText('1', { exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Registrar entrega', exact: true }).last().click();
  await page.getByRole('button', { name: 'Fabián', exact: true }).click();
  await page.getByRole('button', { name: 'Confirmar entrega', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Registrar retiro', exact: true }).last(),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole('button', { name: 'Registrar retiro', exact: true }).last(),
  ).toBeVisible();
  await page.goto('/historial');
  await expect(page.getByText('Confirmó la entrega', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: /^Ver movimiento: Confirmó la entrega/ }).click();
  await page.getByRole('button', { name: 'Deshacer', exact: true }).click();
  await page.getByRole('button', { name: 'Confirmar', exact: true }).click();
  await page.getByRole('button', { name: 'Cerrar', exact: true }).last().click();
  await expect(page.getByText('Deshizo: Confirmó la entrega', { exact: true })).toBeVisible();
  await page.goto('/exportar');
  const excel = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Exportar Excel', exact: true }).click();
  expect((await excel).suggestedFilename()).toBe('chema-reporte.xlsx');
  await page.getByRole('tab', { name: 'Word', exact: true }).click();
  const word = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Generar remito', exact: true }).click();
  expect((await word).suggestedFilename()).toBe('chema-remito.docx');
  expect(errors).toEqual([]);
});
test('nombre identifica a la persona sin selector de roles; sesión persiste', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await login(page, 'Juan de prueba');
  await expect(page.getByRole('button', { name: 'Nuevo alquiler', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Cerradas', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Filtros', exact: true }).click();
  await page.getByRole('button', { name: 'Estado', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Cerradas', exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Retirados', exact: true })).toHaveCount(1);
  await page.getByRole('button', { name: 'Retirados', exact: true }).click();
  await page.getByRole('button', { name: 'Ver resultados', exact: true }).click();
  await page.getByRole('tab', { name: 'Depósito', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Depósito', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Agregar material', exact: true })).toBeVisible();
  await page.screenshot({
    path: 'artifacts/capturas/estructura-1.5/dashboard-mobile.png',
    fullPage: true,
  });
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Depósito', exact: true })).toBeVisible();
  await page.goto('/configuracion');
  await expect(page.getByText('Juan de prueba', { exact: true }).first()).toBeVisible();
});

test('demo permite reabrir el tablero sin conexión después de guardar la caché', async ({
  page,
  context,
}) => {
  await login(page);
  await expect(page.getByRole('heading', { name: 'Alquileres', exact: true })).toBeVisible();
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Alquileres', exact: true })).toBeVisible();
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Alquileres', exact: true })).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Abrir Cliente sintético 1', exact: true }),
  ).toBeVisible();
  await context.setOffline(false);
});
