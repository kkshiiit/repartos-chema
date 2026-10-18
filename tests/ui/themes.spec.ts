import { test, expect } from '@playwright/test';
import { loginSynthetic as login } from './helpers';
async function bg(page: import('@playwright/test').Page) {
  return page.evaluate(() => document.documentElement.style.colorScheme);
}
test('tema automático conserva formulario y no hay selectores repetidos en ventanas', async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await login(page);
  expect(await bg(page)).toBe('light');
  await page.getByRole('button', { name: 'Nuevo alquiler', exact: true }).click();
  await page.getByLabel('Nombre del cliente', { exact: true }).fill('Borrador sin perder');
  await expect(page.getByRole('button', { name: /Activar modo/ })).toHaveCount(0);
  await page.emulateMedia({ colorScheme: 'dark' });
  await expect.poll(() => bg(page)).toBe('dark');
  await expect(page.getByLabel('Nombre del cliente', { exact: true })).toHaveValue(
    'Borrador sin perder',
  );
  await page.getByLabel('Dirección', { exact: true }).fill('Dirección del borrador');
  await page.getByLabel('Barrio / localidad', { exact: true }).fill('Zona del borrador');
  await page.getByRole('button', { name: 'Continuar a carga', exact: true }).click();
  await page.getByRole('button', { name: 'Agregar material', exact: true }).last().click();
  await page.getByRole('button', { name: /^Detalles de / }).click();
  await page.getByLabel('Apodo de esta carga', { exact: true }).fill('Carga sin perder');
  await page.emulateMedia({ colorScheme: 'light' });
  await expect.poll(() => bg(page)).toBe('light');
  await expect(page.getByLabel('Apodo de esta carga', { exact: true })).toHaveValue(
    'Carga sin perder',
  );
  await page.getByRole('button', { name: 'Revisar alquiler', exact: true }).click();
  await page.emulateMedia({ colorScheme: 'dark' });
  await expect.poll(() => bg(page)).toBe('dark');
  await expect(page.getByText('Borrador sin perder', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Volver a carga', exact: true }).click();
  await page.getByRole('button', { name: /^Detalles de / }).click();
  await expect(page.getByLabel('Apodo de esta carga', { exact: true })).toHaveValue(
    'Carga sin perder',
  );
  await page.getByRole('button', { name: 'Volver a cliente', exact: true }).click();
  await expect(page.getByLabel('Dirección', { exact: true })).toHaveValue('Dirección del borrador');
  await expect(page.getByLabel('Nombre del cliente', { exact: true })).toHaveValue(
    'Borrador sin perder',
  );
  await page.goto('/');
  await page.getByRole('button', { name: 'Activar modo claro', exact: true }).click();
  await page.emulateMedia({ colorScheme: 'dark' });
  expect(await bg(page)).toBe('light');
  await page.reload();
  await expect.poll(() => bg(page)).toBe('light');
  await page.goto('/configuracion');
  await page.getByRole('button', { name: 'Apariencia', exact: true }).click();
  await page.getByRole('button', { name: 'Seguir sistema', exact: true }).click();
  await expect.poll(() => bg(page)).toBe('dark');
  await page.goto('/obra/obra_5');
  await page.getByRole('button', { name: 'Preparar carga', exact: true }).click();
  await expect(page.getByRole('button', { name: /Activar modo/ })).toHaveCount(0);
  await page
    .getByRole('button', { name: /^Detalles de / })
    .first()
    .click();
  await page.getByLabel('Apodo de esta carga', { exact: true }).first().fill('Borrador modal');
  await page.emulateMedia({ colorScheme: 'light' });
  await expect.poll(() => bg(page)).toBe('light');
  await expect(page.getByLabel('Apodo de esta carga', { exact: true }).first()).toHaveValue(
    'Borrador modal',
  );
});
for (const width of [320, 360, 390, 768, 1440])
  for (const theme of ['light', 'dark'] as const) {
    test(`pantallas ${width}px ${theme} sin recortes`, async ({ page }) => {
      test.setTimeout(180000);
      const errors: string[] = [];
      page.on('pageerror', (e) => errors.push(e.message));
      await page.setViewportSize({ width, height: width > 1000 ? 1000 : 844 });
      await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' });
      const { seed } = await import('../../src/data/seed');
      const fixture = seed();
      fixture.obras.forEach((o, i) => {
        o.clienteNombre = 'Cliente sintético ' + (i + 1);
        o.clienteTelefono = '';
        o.direccion = 'Dirección sintética ' + (i + 1);
        delete o.coordenadas;
      });
      await page.addInitScript((state) => {
        localStorage.setItem('chema:welcome:v2', 'done');
        if (!localStorage.getItem('chema:demo:v1'))
          localStorage.setItem(
            'chema:demo:v1',
            JSON.stringify({ schema: 1, state, confirmed: state, queue: [] }),
          );
      }, fixture);
      await page.goto('/');
      await expect(page.getByLabel('Tu nombre', { exact: true })).toBeVisible();
      async function capture(name: string) {
        expect(
          await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
          name,
        ).toBe(true);
        if (width === 390 || width === 1440)
          await page.screenshot({
            path: `artifacts/capturas/estructura-1.5/rutas-${width}-${theme}-${name}.png`,
            fullPage: true,
          });
      }
      await capture('login');
      await page.getByLabel('Tu nombre', { exact: true }).fill('Equipo de prueba');
      await page.getByRole('button', { name: 'Entrar', exact: true }).click();
      await expect(page.getByRole('heading', { name: 'Alquileres', exact: true })).toBeVisible();
      await capture('obras');
      for (const route of [
        'galpon',
        'mapa',
        'historial',
        'obra/nueva',
        'obra/obra_5',
        'combos',
        'configuracion',
        'exportar',
      ]) {
        await page.goto('/' + route);
        await expect(page.getByRole('heading').first()).toBeVisible();
        await expect(page.getByRole('button', { name: /Activar modo/ })).toHaveCount(
          ['galpon', 'mapa', 'historial'].includes(route) ? 1 : 0,
        );
        if (route === 'obra/obra_5') {
          for (const name of ['Preparar carga', 'Documento']) {
            const b = await page.getByRole('button', { name, exact: true }).boundingBox();
            expect(b).not.toBeNull();
            expect(b!.x).toBeGreaterThanOrEqual(0);
            expect(b!.x + b!.width).toBeLessThanOrEqual(width + 1);
          }
          await page.getByRole('button', { name: 'Más acciones', exact: true }).click();
          const location = await page
            .getByRole('button', { name: 'Ubicación', exact: true })
            .boundingBox();
          expect(location).not.toBeNull();
          expect(location!.x).toBeGreaterThanOrEqual(0);
          expect(location!.x + location!.width).toBeLessThanOrEqual(width + 1);
          await page.getByRole('button', { name: 'Cerrar', exact: true }).click();
        }
        if (route === 'galpon') {
          const box = await page.getByText('Marco de andamio', { exact: true }).boundingBox();
          expect(box).not.toBeNull();
          expect(box!.width).toBeGreaterThan(140);
          expect(box!.height).toBeLessThan(90);
          await expect(page.getByText('1.30m', { exact: true }).first()).toBeVisible();
        }
        await capture(route.replaceAll('/', '-'));
      }
      for (const [id, button, name] of [
        ['obra_5', 'Registrar entrega', 'entrega'],
        ['obra_1', 'Registrar retiro', 'retiro'],
      ]) {
        await page.goto('/obra/' + id);
        await page.getByRole('button', { name: button, exact: true }).last().click();
        await expect(
          page.getByRole('button', {
            name: name === 'entrega' ? 'Confirmar entrega' : 'Confirmar retiro',
            exact: true,
          }),
        ).toBeVisible();
        await expect(page.getByRole('button', { name: /Activar modo/ })).toHaveCount(0);
        await capture(name!);
      }
      expect(errors).toEqual([]);
    });
  }
