import { test, expect, type Page } from '@playwright/test';
import { seed } from '../../src/data/seed';
import { login } from './helpers';

async function fixture(page: Page, longList = false) {
  const s = seed(new Date('2026-12-31T15:00:00Z'));
  s.obras.forEach((o, i) => {
    o.clienteNombre = `Cliente sintético ${i + 1}`;
    o.direccion = `Dirección visible de prueba ${i + 1}`;
    o.localidadBarrio = i === 0 ? 'José León Suárez' : 'Zona sintética';
    o.clienteTelefono = '';
    delete o.coordenadas;
  });
  if (longList)
    for (let i = 0; i < 25; i++)
      s.obras.push({
        ...s.obras[4]!,
        id: `pending_synthetic_${i}`,
        clienteNombre: `Pendiente sintético ${i}`,
        fechaEntrega: '2027-01-02',
        fechaRetiroEstimada: '2027-01-09',
        saldosEnObra: {},
      });
  await page.clock.setFixedTime(new Date('2026-12-31T15:00:00Z'));
  await page.addInitScript((s) => {
    if (!localStorage.getItem('chema:demo:v1'))
      localStorage.setItem(
        'chema:demo:v1',
        JSON.stringify({ schema: 1, state: s, confirmed: s, queue: [] }),
      );
  }, s);
  await login(page, 'Persona sintética');
}

test('Hoy incluye entrega y retiros; fila expone dirección/material y filtro no contiene documentos', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await fixture(page);
  await page.getByRole('button', { name: 'Hoy', exact: true }).click();
  await expect(page.getByRole('button', { name: /^Abrir Cliente sintético/ })).toHaveCount(3);
  await expect(page.getByText('Entregar hoy', { exact: true })).toBeVisible();
  await expect(page.getByText('Retirar hoy', { exact: true })).toHaveCount(2);
  const row = page.getByRole('button', { name: 'Abrir Cliente sintético 2', exact: true });
  await expect(row).toContainText('Dirección visible de prueba 2');
  await expect(row).toContainText('Marco de andamio');
  await expect(row).toContainText('1.30m');
  await page.getByRole('button', { name: 'Filtros', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Exportar', exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Gestionar combos', exact: true })).toHaveCount(0);
});

test('búsqueda por localidad conserva contexto al volver del detalle y al recargar', async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await fixture(page);
  await page.getByLabel('Buscar alquileres', { exact: true }).fill('jose leon');
  const row = page.getByRole('button', { name: 'Abrir Cliente sintético 1', exact: true });
  await expect(row).toBeVisible();
  await expect(page.getByRole('button', { name: /^Abrir Cliente sintético/ })).toHaveCount(1);
  const raw = await page.evaluate(() => localStorage.getItem('chema:demo:v1'));
  await row.click();
  await expect(
    page.getByRole('heading', { name: 'Cliente sintético 1', exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Volver', exact: true }).click();
  await expect(page.getByLabel('Buscar alquileres', { exact: true })).toHaveValue('jose leon');
  await expect(row).toBeVisible();
  await page.reload();
  await expect(page.getByLabel('Buscar alquileres', { exact: true })).toHaveValue('jose leon');
  await expect(row).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('chema:demo:v1'))).toBe(raw);
});

test('vuelve del detalle al desplazamiento guardado de una lista larga', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await fixture(page, true);
  const readOffset = () =>
    page.evaluate(() => {
      const key = Object.keys(localStorage).find((k) => k.startsWith('chema:rental-list:v1:'));
      return key ? JSON.parse(localStorage.getItem(key)!).scroll : 0;
    });
  // A real list scroll, not page-level scrolling around a fixed header.
  const firstRow = page.getByRole('button', { name: 'Abrir Cliente sintético 1', exact: true });
  await firstRow.hover();
  await page.mouse.wheel(0, 600);
  await expect.poll(readOffset).toBeGreaterThan(100);
  const savedOffset = await readOffset();
  const name = await page
    .getByRole('button', { name: /^Abrir (Cliente|Pendiente) sintético/ })
    .evaluateAll((elements) => {
      const item = elements.find((element) => {
        const rect = element.getBoundingClientRect();
        return rect.top > 100 && rect.bottom < window.innerHeight - 120;
      });
      return item?.getAttribute('aria-label');
    });
  expect(name).toBeTruthy();
  await page.getByRole('button', { name: name!, exact: true }).click();
  await page.getByRole('button', { name: 'Volver', exact: true }).click();
  await expect(page.getByRole('button', { name: name!, exact: true })).toBeVisible();
  await expect.poll(readOffset).toBeGreaterThan(savedOffset - 80);
  await expect(page.getByLabel('Buscar alquileres', { exact: true })).toHaveValue('');
});
