import { test, expect } from '@playwright/test';
test('administración crea, entrega, deshace y descarga documentos', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Administración', exact: true }).click();
  await expect(page.getByText('Tus obras, al día.')).toBeVisible();
  await page.screenshot({ path: 'artifacts/dashboard-desktop.png', fullPage: true });
  await page.getByRole('button', { name: 'Nueva obra', exact: true }).click();
  await page.getByLabel('Nombre del cliente', { exact: true }).fill('Obra de prueba UI');
  await page.getByLabel('Dirección', { exact: true }).fill('Dirección de demostración 123');
  await page.getByLabel('Barrio / localidad', { exact: true }).fill('Zona de prueba');
  await page.getByRole('button', { name: 'Guardar obra', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Obra de prueba UI', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Preparar carga', exact: true }).click();
  await page.getByRole('button', { name: 'Agregar material', exact: true }).last().click();
  await page.getByRole('button', { name: 'Guardar carga', exact: true }).click();
  await expect(page.getByText('×1', { exact: true }).last()).toBeVisible();
  await page.getByRole('button', { name: 'Entregar', exact: true }).last().click();
  await page.getByRole('button', { name: 'Fabián', exact: true }).click();
  await page.getByRole('button', { name: 'Confirmar operación', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Retirar', exact: true }).last()).toBeVisible();
  await page.reload();
  await expect(page.getByRole('button', { name: 'Retirar', exact: true }).last()).toBeVisible();
  await page.goto('/historial');
  await expect(page.getByText('Confirmó la entrega', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Deshacer', exact: true }).click();
  await page.getByRole('button', { name: 'Confirmar', exact: true }).click();
  await expect(page.getByText('Deshizo: Confirmó la entrega', { exact: true })).toBeVisible();
  await page.goto('/exportar');
  const excel = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Exportar Excel', exact: true }).click();
  expect((await excel).suggestedFilename()).toBe('chema-reporte.xlsx');
  const word = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Generar remito', exact: true }).click();
  expect((await word).suggestedFilename()).toBe('chema-remito.docx');
  expect(errors).toEqual([]);
});
test('operador móvil navega y conserva sesión sin acceso al stock maestro', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Operación', exact: true }).click();
  await expect(page.getByText('Tus obras, al día.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Nueva obra', exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Cerradas', exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Retiradas', exact: true })).toHaveCount(1);
  await page.screenshot({ path: 'artifacts/dashboard-mobile.png', fullPage: true });
  await page.getByRole('tab', { name: 'Galpón', exact: true }).click();
  await expect(page.getByText('El galpón', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Nuevo material', exact: true })).toHaveCount(0);
  await page.getByRole('tab', { name: 'Viaje', exact: true }).click();
  await expect(page.getByText('Lista de viaje', { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByText('Lista de viaje', { exact: true })).toBeVisible();
  await page.goto('/combos');
  await expect(page.getByText('Sección exclusiva de administración.')).toBeVisible();
  expect(errors).toEqual([]);
});

test('demo permite reabrir el tablero sin conexión después de guardar la caché', async ({
  page,
  context,
}) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Administración', exact: true }).click();
  await expect(page.getByText('Tus obras, al día.')).toBeVisible();
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await expect(page.getByText('Tus obras, al día.')).toBeVisible();
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByText('Tus obras, al día.')).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Abrir Edificio Las Heras', exact: true }),
  ).toBeVisible();
  await context.setOffline(false);
});
