/**
 * Repartos Chema 2.0 — recorrido completo contra el backend real (Supabase).
 * Crea un equipo de prueba con nombre "QA ..." que luego se borra con
 * `scripts/qa-cleanup.mjs` (necesita token de gestión, nunca se guarda en el repo).
 */
import { test, expect, type Page, type Browser } from '@playwright/test';

const shot = (name: string) => `artifacts/capturas/2.0/${name}.png`;
async function phone(browser: Browser, scheme: 'light' | 'dark') {
  const ctx = await browser.newContext({
    viewport: { width: 400, height: 860 },
    colorScheme: scheme,
    locale: 'es-AR',
    baseURL: 'http://127.0.0.1:8081',
    ...(process.env.HTTPS_PROXY ? { ignoreHTTPSErrors: true } : {}),
  });
  const page = await ctx.newPage();
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  return { page, errors };
}
const session = (p: Page) =>
  p.evaluate(() => JSON.parse(localStorage.getItem('chema2:session') || 'null'));
const data = async (p: Page) => {
  const s = await session(p);
  return p.evaluate((id) => JSON.parse(localStorage.getItem(`chema2:data:${id}`) || 'null'), s.teamId);
};
async function synced(p: Page) {
  await expect(p.getByText('Sincronizado', { exact: true })).toBeVisible({ timeout: 30000 });
}

test('dos teléfonos: equipo, nombres, stock, alquiler, entrega, ticket, retiro y auditoría', async ({ browser }) => {
  test.setTimeout(240000);
  const A = await phone(browser, 'light');
  const a = A.page;
  await a.goto('/');
  await a.screenshot({ path: shot('01-bienvenida-sol') });
  await a.getByRole('button', { name: 'Crear un equipo nuevo', exact: true }).click();
  await a.getByLabel('Nombre del negocio', { exact: true }).fill(`QA Andamios ${Date.now()}`);
  await a.getByRole('button', { name: 'Crear equipo', exact: true }).click();
  await expect(a.getByRole('heading', { name: '¿Quién sos?' })).toBeVisible();
  await a.getByLabel('Tu nombre y apellido', { exact: true }).fill('Ana Gómez');
  await a.getByRole('button', { name: 'Entrar con este nombre', exact: true }).click();
  await expect(a.getByRole('heading', { name: 'Alquileres', exact: true })).toBeVisible();
  await synced(a);
  const code = (await session(a)).code as string;
  expect(code).toMatch(/^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/);

  // Stock inicial
  await a.goto('/galpon');
  await a.getByRole('button', { name: 'Agregar material', exact: true }).click();
  await a.getByLabel('Nombre del material', { exact: true }).fill('Cuerpo de andamio');
  await a.getByRole('button', { name: '1.30m', exact: true }).click();
  await a.getByRole('button', { name: 'Guardar cambios', exact: true }).click();
  await a.getByRole('button', { name: 'Confirmar', exact: true }).click();
  await a.getByRole('button', { name: 'Opciones de Cuerpo de andamio 1.30m', exact: true }).click();
  await a.getByRole('button', { name: 'Ajustar', exact: true }).click();
  await a.getByLabel('Diferencia entera (+ o −)', { exact: true }).fill('20');
  await a.getByLabel('Procedencia / destino', { exact: true }).fill('Inventario inicial');
  await a.getByLabel('Motivo y comprobante', { exact: true }).fill('Recuento físico');
  await a.getByRole('button', { name: 'Guardar cambios', exact: true }).click();
  await a.getByRole('button', { name: 'Confirmar', exact: true }).click();
  await expect.poll(async () => (await data(a)).confirmed.materiales[0]?.cantidadGalpon, { timeout: 30000 }).toBe(20);

  // Alquiler nuevo
  await a.goto('/obra/nueva');
  await a.getByLabel('Nombre del cliente', { exact: true }).fill('Constructora Prueba');
  await a.getByLabel('Teléfono', { exact: false }).first().fill('+54 9 11 5555 0000');
  await a.getByLabel('Dirección', { exact: true }).fill('Av. Siempre Viva 742');
  await a.getByLabel('Barrio / localidad', { exact: true }).fill('Centro');
  await a.getByRole('button', { name: 'Continuar a carga', exact: true }).click();
  await a.getByRole('button', { name: 'Revisar alquiler', exact: true }).click();
  await a.getByRole('button', { name: 'Guardar alquiler', exact: true }).click();
  await expect(a.getByRole('heading', { name: 'Constructora Prueba', exact: true })).toBeVisible();
  await a.getByRole('button', { name: 'Preparar carga', exact: true }).click();
  await a.getByRole('button', { name: 'Agregar material', exact: true }).last().click();
  await a.getByRole('button', { name: 'Aumentar Cuerpo de andamio 1.30m', exact: false }).first().click().catch(() => undefined);
  await a.getByRole('button', { name: 'Guardar carga', exact: true }).click();
  await a.getByRole('button', { name: 'Registrar entrega', exact: true }).last().click();
  await a.getByRole('button', { name: 'Ana Gómez', exact: true }).click();
  await a.getByLabel('Recibió', { exact: true }).fill('Capataz Juan');
  await a.getByRole('button', { name: 'Confirmar entrega', exact: true }).click();
  await expect.poll(async () => (await data(a)).confirmed.materiales[0]?.cantidadEnObra, { timeout: 30000 }).toBeGreaterThan(0);
  await a.screenshot({ path: shot('03-detalle-entregado-sol'), fullPage: true });

  // Ticket
  await a.getByRole('button', { name: 'Compartir ticket', exact: true }).click();
  await expect(a.getByText('Comprobante de alquiler N°', { exact: false })).toBeVisible();
  await a.waitForTimeout(600);
  await a.screenshot({ path: shot('04-ticket-formatos') });
  await a.keyboard.press('Escape');

  // Teléfono B (noche) se une y ve lo mismo
  const B = await phone(browser, 'dark');
  const b = B.page;
  await b.goto('/');
  await b.getByRole('button', { name: 'Unirme a un equipo', exact: true }).click();
  await b.getByLabel('Código del equipo (12 letras y números)', { exact: true }).fill(code.toLowerCase());
  await b.getByRole('button', { name: 'Entrar', exact: true }).click();
  await expect(b.getByRole('button', { name: 'Entrar como Ana Gómez', exact: true })).toBeVisible();
  await b.screenshot({ path: shot('05-quien-noche') });
  await b.getByLabel('Tu nombre y apellido', { exact: true }).fill('Beto Ruiz');
  await b.getByRole('button', { name: 'Entrar con este nombre', exact: true }).click();
  await expect(b.getByRole('button', { name: /Abrir Constructora Prueba/ })).toBeVisible({ timeout: 30000 });
  await synced(b);
  await b.screenshot({ path: shot('06-inicio-noche') });

  // B retira; A lo ve con autor en la auditoría
  await b.getByRole('button', { name: /Abrir Constructora Prueba/ }).click();
  await b.getByRole('button', { name: 'Registrar retiro', exact: true }).last().click();
  await b.getByRole('button', { name: 'Beto Ruiz', exact: true }).click();
  await b.getByRole('button', { name: 'Confirmar retiro', exact: true }).click();
  await expect.poll(async () => (await data(b)).pending.length, { timeout: 30000 }).toBe(0);
  await a.goto('/historial');
  await expect(a.getByText('Beto Ruiz', { exact: true }).first()).toBeVisible({ timeout: 40000 });
  await expect.poll(async () => (await data(a)).confirmed.materiales[0]?.cantidadGalpon, { timeout: 30000 }).toBe(20);
  await a.screenshot({ path: shot('07-auditoria-sol') });
  await b.goto('/configuracion');
  await b.screenshot({ path: shot('08-ajustes-noche') });
  await a.goto('/guia');
  await a.screenshot({ path: shot('09-guia-sol') });
  const states = [JSON.stringify((await data(a)).confirmed.materiales), JSON.stringify((await data(b)).confirmed.materiales)];
  expect(states[0]).toBe(states[1]);
  expect(A.errors).toEqual([]);
  expect(B.errors).toEqual([]);
});

test('los datos de la versión anterior se pasan al equipo con un toque y quedan auditados', async ({ browser }) => {
  test.setTimeout(120000);
  const { seed } = await import('../../src/data/seed');
  const legacy = seed();
  const { page, errors } = await phone(browser, 'light');
  await page.addInitScript((st) => {
    if (!localStorage.getItem('chema:demo:v1'))
      localStorage.setItem('chema:demo:v1', JSON.stringify({ schema: 1, state: st, confirmed: st, queue: [] }));
  }, legacy);
  await page.goto('/');
  await page.getByRole('button', { name: 'Crear un equipo nuevo', exact: true }).click();
  await page.getByLabel('Nombre del negocio', { exact: true }).fill(`QA Migración ${Date.now()}`);
  await page.getByRole('button', { name: 'Crear equipo', exact: true }).click();
  await page.getByLabel('Tu nombre y apellido', { exact: true }).fill('Chema');
  await page.getByRole('button', { name: 'Entrar con este nombre', exact: true }).click();
  await expect(page.getByText('Datos de la versión anterior', { exact: true })).toBeVisible({ timeout: 20000 });
  await page.screenshot({ path: shot('02-migracion-version-anterior') });
  await page.getByRole('button', { name: 'Pasar datos al equipo', exact: true }).click();
  await expect.poll(async () => (await data(page)).confirmed.obras.length, { timeout: 30000 }).toBe(legacy.obras.length);
  await synced(page);
  await page.screenshot({ path: shot('02b-inicio-con-datos-sol') });
  await page.goto('/historial');
  await expect(page.getByText(/Importó una copia completa/).first()).toBeVisible();
  expect(errors).toEqual([]);
});
