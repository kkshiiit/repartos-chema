import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
async function login(page: Page) {
  await page.goto('/');
  await page.getByRole('button', { name: 'Administración', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Tus obras, al día.' })).toBeVisible();
}
async function bg(page: Page) {
  return page.evaluate(() => document.documentElement.style.colorScheme);
}
test('tema sistema en vivo, alternancia manual, persistencia y formulario sin pérdida', async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await login(page);
  expect(await bg(page)).toBe('light');
  await page.emulateMedia({ colorScheme: 'dark' });
  await expect.poll(() => bg(page)).toBe('dark');
  const before = await page.evaluate(() => localStorage.getItem('chema:demo:v1'));
  await page.getByRole('button', { name: 'Nueva obra', exact: true }).click();
  await page.getByLabel('Nombre del cliente', { exact: true }).fill('Borrador sin perder');
  await page.getByRole('button', { name: 'Activar modo claro', exact: true }).last().click();
  expect(await bg(page)).toBe('light');
  await expect(page.getByLabel('Nombre del cliente', { exact: true })).toHaveValue(
    'Borrador sin perder',
  );
  await page.emulateMedia({ colorScheme: 'dark' });
  expect(await bg(page)).toBe('light');
  expect(await page.evaluate(() => localStorage.getItem('chema:demo:v1'))).toBe(before);
  await page.goto('/configuracion');
  await expect(page.getByRole('button', { name: 'Claro', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await page.reload();
  await expect(
    page.getByRole('button', { name: 'Activar modo oscuro', exact: true }).last(),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Seguir sistema', exact: true }).click();
  await expect.poll(() => bg(page)).toBe('dark');
  await page.emulateMedia({ colorScheme: 'light' });
  await expect.poll(() => bg(page)).toBe('light');
  await page.getByRole('button', { name: 'Activar modo oscuro', exact: true }).last().click();
  await expect.poll(() => bg(page)).toBe('dark');
  await page.goto('/obra/obra_5');
  await page.getByRole('button', { name: 'Preparar carga', exact: true }).last().click();
  await page.getByLabel('Apodo de esta carga', { exact: true }).first().fill('Borrador modal');
  await page.getByRole('button', { name: 'Activar modo claro', exact: true }).last().click();
  await expect(page.getByLabel('Apodo de esta carga', { exact: true }).first()).toHaveValue(
    'Borrador modal',
  );
  expect(await page.evaluate(() => localStorage.getItem('chema:demo:v1'))).toBe(before);
});
for (const width of [320, 360, 390, 768, 1440])
  for (const theme of ['light', 'dark'] as const) {
    test(`pantallas ${width}px ${theme} sin desbordamiento`, async ({ page }) => {
      test.setTimeout(180000);
      const errors: string[] = [];
      page.on('pageerror', (e) => errors.push(e.message));
      await page.setViewportSize({ width, height: width > 1000 ? 1000 : 844 });
      await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' });
      const capture = async (name: string) => {
        expect(
          await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
          name,
        ).toBe(true);
        if (width === 390 || width === 1440)
          await page.screenshot({
            path: `artifacts/capturas/${width}-${theme}-${name}.png`,
            fullPage: true,
          });
      };
      await page.goto('/');
      await expect(page.getByRole('button', { name: 'Administración', exact: true })).toBeVisible();
      await capture('login');
      await page.getByRole('button', { name: 'Administración', exact: true }).click();
      await expect(page.getByRole('heading', { name: 'Tus obras, al día.' })).toBeVisible();
      await capture('obras');
      const screens = [
        ['galpon', 'El galpón'],
        ['mapa', 'El viaje'],
        ['historial', 'Cada movimiento cuenta'],
        ['obra/nueva', 'Nueva obra'],
        ['obra/obra_5', 'Casa Los Aromos'],
        ['combos', 'Combos de carga'],
        ['configuracion', 'Configuración'],
        ['exportar', 'Documentos'],
      ] as const;
      for (const [route] of screens) {
        await page.goto('/' + route);
        await expect(
          page
            .getByRole('button', {
              name: theme === 'dark' ? 'Activar modo claro' : 'Activar modo oscuro',
              exact: true,
            })
            .last(),
        ).toBeVisible();
        await expect(page.getByRole('heading').last()).toBeVisible();
        await capture(route.replaceAll('/', '-'));
      }
      for (const [id, button, name] of [
        ['obra_5', 'Entregar', 'entrega'],
        ['obra_1', 'Retirar', 'retiro'],
      ]) {
        await page.goto('/obra/' + id);
        await page.getByRole('button', { name: button, exact: true }).last().click();
        await expect(
          page.getByRole('button', { name: 'Confirmar operación', exact: true }),
        ).toBeVisible();
        await capture(name!);
      }
      expect(errors).toEqual([]);
    });
  }
