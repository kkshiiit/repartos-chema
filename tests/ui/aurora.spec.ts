import { test, expect } from '@playwright/test';
import { loginSynthetic } from './helpers';
for (const mode of ['light', 'dark'] as const)
  test(`Cobalto ${mode}: pantallas y ventanas con datos sintéticos`, async ({ page }) => {
    test.setTimeout(180000);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.emulateMedia({ colorScheme: mode, reducedMotion: 'reduce' });
    await page.addInitScript(() => localStorage.setItem('chema:welcome:v2', 'done'));
    await page.goto('/');
    await expect(page.getByLabel('Tu nombre', { exact: true })).toBeVisible();
    await page.screenshot({
      path: `artifacts/capturas/cobalto-rutas-390-${mode}-login.png`,
      fullPage: true,
    });
    await loginSynthetic(page);
    for (const [route, name] of [
      ['/', 'alquileres'],
      ['/galpon', 'deposito'],
      ['/mapa', 'viaje'],
      ['/historial', 'historial'],
      ['/obra/nueva', 'nuevo'],
      ['/obra/obra_1', 'detalle'],
      ['/combos', 'combos'],
      ['/configuracion', 'ajustes'],
      ['/exportar', 'documentos'],
    ]) {
      await page.goto(route!);
      await expect(page.getByRole('heading').first()).toBeVisible();
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
      ).toBe(true);
      await page.screenshot({
        path: `artifacts/capturas/cobalto-rutas-390-${mode}-${name}.png`,
        fullPage: true,
      });
    }
    for (const [id, action, name] of [
      ['obra_5', 'Entregar', 'entrega'],
      ['obra_1', 'Retirar', 'retiro'],
    ]) {
      await page.goto('/obra/' + id);
      await page.getByRole('button', { name: action!, exact: true }).last().click();
      await expect(
        page.getByRole('button', { name: 'Confirmar operación', exact: true }),
      ).toBeVisible();
      await expect(page.getByRole('button', { name: /Activar modo/ })).toHaveCount(0);
      await page.screenshot({
        path: `artifacts/capturas/cobalto-rutas-390-${mode}-${name}.png`,
        fullPage: true,
      });
    }
    await page.goto('/configuracion');
    await page.getByRole('button', { name: 'Estático', exact: true }).click();
    await page.reload();
    await expect(page.getByRole('button', { name: 'Estático', exact: true })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto('/');
    await page.screenshot({
      path: `artifacts/capturas/cobalto-rutas-1440-${mode}-alquileres.png`,
      fullPage: true,
    });
  });
test('un error de GPS queda visible dentro de la ventana y conserva coordenadas manuales', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => {
    navigator.geolocation.getCurrentPosition = (_ok, fail) => {
      fail?.({
        code: 1,
        message: 'Permiso denegado',
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3,
      });
    };
  });
  await loginSynthetic(page);
  await page.goto('/obra/obra_1');
  await page.getByRole('button', { name: 'Ubicación', exact: true }).click();
  await page.getByLabel('Latitud', { exact: true }).fill('-34.5');
  await page.getByRole('button', { name: 'Usar mi GPS', exact: true }).click();
  const sheet = page.locator('[aria-modal="true"]').last();
  await expect(
    sheet.getByText('Sin permiso de ubicación. Ingresa coordenadas manualmente.', { exact: true }),
  ).toBeVisible();
  await expect(page.getByLabel('Latitud', { exact: true })).toHaveValue('-34.5');
  await page.screenshot({ path: 'artifacts/capturas/cobalto-rutas-390-error-gps.png', fullPage: true });
});
