import { test, expect } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { seed } from '../../src/data/seed';

const folder = 'artifacts/capturas/cierre-1.7/maestro-etapa2';
const fixedNow = new Date('2026-12-31T15:00:00Z');
for (const version of [
  {
    label: 'antes',
    origin: 'http://127.0.0.1:8082',
    source:
      'Web release 1.6.1, runtime f9f018d; ZIP SHA256 3509f0bc01a8e7b06181fac0dea5fe32dca7c798f1648cc1a7594ce21ee8b493',
  },
  {
    label: 'despues',
    origin: 'http://127.0.0.1:8081',
    source: 'Cierre etapa3, fuente53a30d1 más cambios documentados; web, no Android',
  },
])
  for (const theme of ['light', 'dark'])
    test(`comparación web etiquetada ${version.label} ${theme}`, async ({ page }) => {
      const s = seed(fixedNow);
      s.obras.forEach((o, i) => {
        o.clienteNombre = `Cliente sintético ${i + 1}`;
        o.direccion = `Dirección de prueba ${i + 1}`;
        o.localidadBarrio = ['San Martín', 'Villa Ballester', 'José León Suárez'][i % 3]!;
        o.clienteTelefono = '';
        delete o.coordenadas;
      });
      await page.setViewportSize({ width: 390, height: 844 });
      await page.emulateMedia({
        colorScheme: theme === 'dark' ? 'dark' : 'light',
        reducedMotion: 'reduce',
      });
      await page.clock.setFixedTime(fixedNow);
      await page.addInitScript(
        ({ s, theme }) => {
          if (!localStorage.getItem('chema:demo:v1'))
            localStorage.setItem(
              'chema:demo:v1',
              JSON.stringify({ schema: 1, state: s, confirmed: s, queue: [] }),
            );
          localStorage.setItem('chema:welcome:v2', 'done');
          localStorage.setItem('chema:theme:v1', theme);
        },
        { s, theme },
      );
      await page.goto(version.origin);
      await page.getByLabel('Tu nombre', { exact: true }).fill('Persona sintética');
      await page.getByRole('button', { name: 'Entrar', exact: true }).click();
      await expect(page.getByRole('heading', { name: 'Alquileres', exact: true })).toBeVisible();
      await mkdir(folder, { recursive: true });
      const captures: { route: string; path: string }[] = [];
      async function capture(name: string) {
        await page.evaluate(async () => {
          await document.fonts.ready;
        });
        const path = `${folder}/${version.label}-390-${theme}-${name}.png`;
        await page.screenshot({ path });
        captures.push({ route: page.url(), path });
      }
      await capture('alquileres');
      await page.getByRole('button', { name: 'Filtros', exact: true }).click();
      await capture('filtros');
      await page.getByRole('button', { name: 'Cerrar', exact: true }).last().click();
      await page.goto(`${version.origin}/obra/obra_1`);
      await expect(
        page.getByRole('heading', { name: 'Cliente sintético 1', exact: true }),
      ).toBeVisible();
      await capture('detalle');
      await page.getByRole('button', { name: 'Registrar retiro', exact: true }).last().click();
      await page.getByRole('button', { name: 'Fabián', exact: true }).click();
      await capture('retiro');
      await page.getByRole('button', { name: 'Cerrar', exact: true }).last().click();
      // No operation is confirmed. Each screenshot is of the actual rendered app.
      await page.goto(`${version.origin}/obra/nueva`);
      await page.getByLabel('Nombre del cliente', { exact: true }).fill('Cliente sintético nuevo');
      await page.getByLabel('Dirección', { exact: true }).fill('Dirección sintética nueva 1200');
      await page.getByLabel('Barrio / localidad', { exact: true }).fill('Villa Ballester');
      await page.getByLabel('Alquilado hasta', { exact: true }).fill('2027-01-07');
      await capture('alta');
      await page.getByRole('button', { name: 'Continuar a carga', exact: true }).click();
      await capture('carga');
      await page.getByRole('button', { name: 'Revisar alquiler', exact: true }).click();
      await capture('revision');
      await writeFile(
        `${folder}/${version.label}-390-${theme}-origen.json`,
        JSON.stringify(
          {
            platform: 'Chromium / React Native Web, NO Android físico',
            source: version.source,
            capturedUTC: new Date().toISOString(),
            businessClockFixture: fixedNow.toISOString(),
            viewport: { width: 390, height: 844 },
            theme,
            syntheticData: true,
            captures,
          },
          null,
          2,
        ),
      );
    });
