/**
 * Chema Andamios — recorrido completo contra el backend real (Supabase).
 * Crea un equipo de prueba con nombre "QA ..." que luego se borra con
 * `scripts/qa-cleanup.mjs` (necesita token de gestión, nunca se guarda en el repo).
 */
import { test, expect, type Page, type Browser } from '@playwright/test';

const shot = (name: string) => `docs/capturas/${name}.png`;
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
  await expect(a.getByRole('heading', { name: '¿Quién sos?' })).toBeVisible({ timeout: 30000 });
  await a.getByLabel('Tu nombre y apellido', { exact: true }).fill('Ana Gómez');
  await a.getByRole('button', { name: 'Entrar con este nombre', exact: true }).click();
  await expect(a.getByRole('heading', { name: 'Hoy', exact: true })).toBeVisible();
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
  await a.getByRole('button', { name: 'Ajustar cantidad', exact: true }).click();
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
  await expect(b.getByRole('heading', { name: 'Hoy', exact: true })).toBeVisible({ timeout: 30000 });
  await b.goto('/alquileres');
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

test('papelera: un alquiler cargado se borra de un toque con confirmación y queda auditado', async ({ browser }) => {
  test.setTimeout(150000);
  const { page: p, errors } = await phone(browser, 'light');
  await p.goto('/');
  await p.getByRole('button', { name: 'Crear un equipo nuevo', exact: true }).click();
  await p.getByLabel('Nombre del negocio', { exact: true }).fill(`QA Papelera ${Date.now()}`);
  await p.getByRole('button', { name: 'Crear equipo', exact: true }).click();
  await p.getByLabel('Tu nombre y apellido', { exact: true }).fill('Ana Gómez');
  await p.getByRole('button', { name: 'Entrar con este nombre', exact: true }).click();
  await expect(p.getByRole('heading', { name: 'Hoy', exact: true })).toBeVisible();
  await p.goto('/galpon');
  await p.getByRole('button', { name: 'Agregar material', exact: true }).click();
  await p.getByLabel('Nombre del material', { exact: true }).fill('Cuerpo de andamio');
  await p.getByRole('button', { name: '1.30m', exact: true }).click();
  await p.getByRole('button', { name: 'Guardar cambios', exact: true }).click();
  await p.getByRole('button', { name: 'Confirmar', exact: true }).click();
  await p.getByRole('button', { name: 'Opciones de Cuerpo de andamio 1.30m', exact: true }).click();
  await p.getByRole('button', { name: 'Ajustar cantidad', exact: true }).click();
  await p.getByLabel('Diferencia entera (+ o −)', { exact: true }).fill('20');
  await p.getByLabel('Procedencia / destino', { exact: true }).fill('Inventario inicial');
  await p.getByLabel('Motivo y comprobante', { exact: true }).fill('Recuento');
  await p.getByRole('button', { name: 'Guardar cambios', exact: true }).click();
  await p.getByRole('button', { name: 'Confirmar', exact: true }).click();
  await expect.poll(async () => (await data(p)).confirmed.materiales[0]?.cantidadGalpon, { timeout: 30000 }).toBe(20);
  await p.goto('/obra/nueva');
  await p.getByLabel('Nombre del cliente', { exact: true }).fill('Cliente Arrepentido');
  await p.getByLabel('Dirección', { exact: true }).fill('Calle Falsa 123');
  await p.getByLabel('Barrio / localidad', { exact: true }).fill('Centro');
  await p.getByRole('button', { name: 'Continuar a carga', exact: true }).click();
  await p.getByRole('button', { name: 'Revisar alquiler', exact: true }).click();
  await p.getByRole('button', { name: 'Guardar alquiler', exact: true }).click();
  await p.getByRole('button', { name: 'Preparar carga', exact: true }).click();
  await p.getByRole('button', { name: 'Agregar material', exact: true }).last().click();
  await p.getByRole('button', { name: 'Guardar carga', exact: true }).click();
  await expect.poll(async () => (await data(p)).confirmed.obras[0]?.materialesCargados.length, { timeout: 30000 }).toBe(1);
  await p.goto('/alquileres');
  const trash = p.getByRole('button', { name: 'Borrar alquiler de Cliente Arrepentido', exact: true });
  await expect(trash).toBeVisible();
  await p.screenshot({ path: shot('10-papelera-en-tarjeta') });
  await trash.click();
  await expect(p.getByText('¿Borrar este alquiler?', { exact: true })).toBeVisible();
  await p.waitForTimeout(500);
  await p.screenshot({ path: shot('11-papelera-confirmacion') });
  await p.getByRole('button', { name: 'Sí, borrar alquiler', exact: true }).click();
  await expect(trash).toHaveCount(0);
  await expect.poll(async () => (await data(p)).confirmed.obras.length, { timeout: 30000 }).toBe(0);
  expect((await data(p)).confirmed.materiales[0].cantidadGalpon).toBe(20);
  await p.goto('/historial');
  await expect(p.getByText('Borró el alquiler de Cliente Arrepentido', { exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});

test('papelera del depósito: un material se borra con confirmación y queda auditado', async ({ browser }) => {
  test.setTimeout(120000);
  const { page: p, errors } = await phone(browser, 'light');
  await p.goto('/');
  await p.getByRole('button', { name: 'Crear un equipo nuevo', exact: true }).click();
  await p.getByLabel('Nombre del negocio', { exact: true }).fill(`QA Material ${Date.now()}`);
  await p.getByRole('button', { name: 'Crear equipo', exact: true }).click();
  await p.getByLabel('Tu nombre y apellido', { exact: true }).fill('Ana Gómez');
  await p.getByRole('button', { name: 'Entrar con este nombre', exact: true }).click();
  await expect(p.getByRole('heading', { name: 'Hoy', exact: true })).toBeVisible({ timeout: 30000 });
  await p.goto('/galpon');
  await p.getByRole('button', { name: 'Agregar material', exact: true }).click();
  await p.getByLabel('Nombre del material', { exact: true }).fill('Rueda');
  await p.getByRole('button', { name: 'Guardar cambios', exact: true }).click();
  await p.getByRole('button', { name: 'Confirmar', exact: true }).click();
  const trash = p.getByRole('button', { name: /^Borrar material Rueda/ });
  await expect(trash).toBeVisible();
  await p.screenshot({ path: shot('12-papelera-deposito') });
  await trash.click();
  await expect(p.getByText('¿Borrar este material?', { exact: true })).toBeVisible();
  await p.waitForTimeout(500);
  await p.screenshot({ path: shot('13-papelera-deposito-confirmacion') });
  await p.getByRole('button', { name: 'Sí, borrar material', exact: true }).click();
  await expect(trash).toHaveCount(0);
  await expect.poll(async () => (await data(p)).confirmed.materiales.length, { timeout: 30000 }).toBe(0);
  await p.goto('/historial');
  await expect(p.getByText(/Borró el material Rueda/)).toBeVisible();
  expect(errors).toEqual([]);
});

test('cambiar código: el viejo deja de servir, el otro teléfono recibe aviso y vuelve a entrar sin perder nada', async ({ browser }) => {
  test.setTimeout(150000);
  const A = await phone(browser, 'light');
  const a = A.page;
  await a.goto('/');
  await a.getByRole('button', { name: 'Crear un equipo nuevo', exact: true }).click();
  await a.getByLabel('Nombre del negocio', { exact: true }).fill(`QA Código ${Date.now()}`);
  await a.getByRole('button', { name: 'Crear equipo', exact: true }).click();
  await a.getByLabel('Tu nombre y apellido', { exact: true }).fill('Ana Gómez');
  await a.getByRole('button', { name: 'Entrar con este nombre', exact: true }).click();
  await expect(a.getByRole('heading', { name: 'Hoy', exact: true })).toBeVisible({ timeout: 30000 });
  await synced(a);
  const oldCode = (await session(a)).code as string;

  const B = await phone(browser, 'dark');
  const b = B.page;
  await b.goto('/');
  await b.getByRole('button', { name: 'Unirme a un equipo', exact: true }).click();
  await b.getByLabel('Código del equipo (12 letras y números)', { exact: true }).fill(oldCode);
  await b.getByRole('button', { name: 'Entrar', exact: true }).click();
  await b.getByLabel('Tu nombre y apellido', { exact: true }).fill('Beto Ruiz');
  await b.getByRole('button', { name: 'Entrar con este nombre', exact: true }).click();
  await expect(b.getByRole('heading', { name: 'Hoy', exact: true })).toBeVisible({ timeout: 30000 });
  await synced(b);

  await a.goto('/configuracion');
  await a.getByRole('button', { name: 'Cambiar código', exact: true }).first().click();
  await a.getByRole('button', { name: 'Cambiar código', exact: true }).last().click();
  await expect.poll(async () => (await session(a)).code, { timeout: 30000 }).not.toBe(oldCode);
  const newCode = (await session(a)).code as string;
  await expect(a.getByText(newCode, { exact: true })).toBeVisible();
  await a.screenshot({ path: shot('14-codigo-cambiado') });

  // B: el próximo sincronizado detecta el código viejo y lo manda a la bienvenida con aviso.
  await b.getByRole('button', { name: /Tocar para sincronizar ahora/ }).click();
  await expect(b.getByText(/El código del equipo cambió/)).toBeVisible({ timeout: 30000 });
  await b.screenshot({ path: shot('15-aviso-codigo-cambiado') });
  await b.getByRole('button', { name: 'Unirme a un equipo', exact: true }).click();
  await b.getByLabel('Código del equipo (12 letras y números)', { exact: true }).fill(oldCode);
  await b.getByRole('button', { name: 'Entrar', exact: true }).click();
  await expect(b.getByText(/No existe un equipo con ese código/)).toBeVisible({ timeout: 20000 });
  await b.getByLabel('Código del equipo (12 letras y números)', { exact: true }).fill(newCode);
  await b.getByRole('button', { name: 'Entrar', exact: true }).click();
  await b.getByRole('button', { name: 'Entrar como Beto Ruiz', exact: true }).click();
  await expect(b.getByRole('heading', { name: 'Hoy', exact: true })).toBeVisible({ timeout: 30000 });
  await synced(b);

  // A sigue adentro y la auditoría registra el cambio.
  await a.goto('/historial');
  await synced(a);
  await expect(a.getByText('Cambió el código del equipo', { exact: true })).toBeVisible();
  expect(A.errors).toEqual([]);
  expect(B.errors).toEqual([]);
});

test('copias: se guarda la copia semanal y un borrado por error se deshace volviendo atrás desde la Auditoría', async ({ browser }) => {
  test.setTimeout(150000);
  const { page: p, errors } = await phone(browser, 'light');
  await p.goto('/');
  await p.getByRole('button', { name: 'Crear un equipo nuevo', exact: true }).click();
  await p.getByLabel('Nombre del negocio', { exact: true }).fill(`QA Copias ${Date.now()}`);
  await p.getByRole('button', { name: 'Crear equipo', exact: true }).click();
  await p.getByLabel('Tu nombre y apellido', { exact: true }).fill('Ana Gómez');
  await p.getByRole('button', { name: 'Entrar con este nombre', exact: true }).click();
  await expect(p.getByRole('heading', { name: 'Hoy', exact: true })).toBeVisible({ timeout: 30000 });
  await p.goto('/galpon');
  await p.getByRole('button', { name: 'Agregar material', exact: true }).click();
  await p.getByLabel('Nombre del material', { exact: true }).fill('Rueda');
  await p.getByRole('button', { name: 'Guardar cambios', exact: true }).click();
  await p.getByRole('button', { name: 'Confirmar', exact: true }).click();
  await p.getByRole('button', { name: /^Opciones de Rueda/ }).click();
  await p.getByRole('button', { name: 'Ajustar cantidad', exact: true }).click();
  await p.getByLabel('Diferencia entera (+ o −)', { exact: true }).fill('12');
  await p.getByLabel('Procedencia / destino', { exact: true }).fill('Compra');
  await p.getByLabel('Motivo y comprobante', { exact: true }).fill('Factura 1');
  await p.getByRole('button', { name: 'Guardar cambios', exact: true }).click();
  await p.getByRole('button', { name: 'Confirmar', exact: true }).click();
  await expect.poll(async () => (await data(p)).confirmed.materiales[0]?.cantidadGalpon, { timeout: 30000 }).toBe(12);

  // La copia semanal automática se guarda sola tras sincronizar con datos.
  await p.goto('/copias');
  await expect(p.getByText(/Copia semanal/).first()).toBeVisible({ timeout: 30000 });

  // "Error": se borra el material.
  await p.goto('/galpon');
  await p.getByRole('button', { name: /^Borrar material Rueda/ }).click();
  await p.getByRole('button', { name: 'Sí, borrar material', exact: true }).click();
  await expect.poll(async () => (await data(p)).confirmed.materiales.length, { timeout: 30000 }).toBe(0);

  // Recuperar desde la Auditoría.
  await p.goto('/historial');
  await p.getByRole('button', { name: /Ver movimiento: Borró el material Rueda/ }).click();
  await p.getByRole('button', { name: 'Volver a como estaba antes', exact: true }).click();
  await expect(p.getByText('Quedaría así', { exact: true })).toBeVisible({ timeout: 30000 });
  await p.waitForTimeout(400);
  await p.screenshot({ path: shot('16-volver-atras-confirmacion') });
  await p.getByRole('button', { name: 'Sí, restaurar', exact: true }).click();
  await expect.poll(async () => (await data(p)).confirmed.materiales[0]?.cantidadGalpon, { timeout: 30000 }).toBe(12);
  await expect(p.getByText(/Volvió a como estaba antes de “Borró el material Rueda”/)).toBeVisible();

  // Quedó una copia de "antes de restaurar" para poder deshacer la restauración.
  await p.goto('/copias');
  await expect(p.getByText(/Antes de una restauración · Ana Gómez/)).toBeVisible({ timeout: 30000 });
  await p.screenshot({ path: shot('17-copias'), fullPage: true });
  expect(errors).toEqual([]);
});

test('responsable con PIN: restaurar pide el PIN, rechaza uno equivocado y acepta el correcto', async ({ browser }) => {
  test.setTimeout(150000);
  const { page: p, errors } = await phone(browser, 'light');
  await p.goto('/');
  await p.getByRole('button', { name: 'Crear un equipo nuevo', exact: true }).click();
  await p.getByLabel('Nombre del negocio', { exact: true }).fill(`QA PIN ${Date.now()}`);
  await p.getByRole('button', { name: 'Crear equipo', exact: true }).click();
  await p.getByLabel('Tu nombre y apellido', { exact: true }).fill('Ana Gómez');
  await p.getByRole('button', { name: 'Entrar con este nombre', exact: true }).click();
  await expect(p.getByRole('heading', { name: 'Hoy', exact: true })).toBeVisible({ timeout: 30000 });

  // Designar responsable con PIN.
  await p.goto('/configuracion');
  await p.getByRole('button', { name: 'Elegir responsable y PIN', exact: true }).click();
  await p.getByLabel('PIN nuevo (4 a 8 números)', { exact: true }).fill('2468');
  await p.getByLabel('Repetir PIN nuevo', { exact: true }).fill('2468');
  await p.getByRole('button', { name: 'Guardar', exact: true }).click();
  await expect(p.getByText('Listo: las acciones importantes ahora piden el PIN.', { exact: true })).toBeVisible({ timeout: 20000 });
  await p.screenshot({ path: shot('18-responsable-pin') });

  // Material que después se borra "por error".
  await p.goto('/galpon');
  await p.getByRole('button', { name: 'Agregar material', exact: true }).click();
  await p.getByLabel('Nombre del material', { exact: true }).fill('Rueda');
  await p.getByRole('button', { name: 'Guardar cambios', exact: true }).click();
  await p.getByRole('button', { name: 'Confirmar', exact: true }).click();
  await p.getByRole('button', { name: /^Borrar material Rueda/ }).click();
  await p.getByRole('button', { name: 'Sí, borrar material', exact: true }).click();
  await expect.poll(async () => (await data(p)).confirmed.materiales.length, { timeout: 30000 }).toBe(0);

  await p.goto('/historial');
  await p.getByRole('button', { name: /Ver movimiento: Borró el material Rueda/ }).click();
  await p.getByRole('button', { name: 'Volver a como estaba antes', exact: true }).click();
  await p.getByRole('button', { name: 'Sí, restaurar', exact: true }).click();

  // Pide el PIN: uno equivocado se rechaza y la ventana sigue abierta.
  const pinBox = p.getByLabel('Escribí el PIN', { exact: true });
  await expect(pinBox).toBeVisible({ timeout: 20000 });
  await pinBox.fill('1111');
  await p.getByRole('button', { name: 'Autorizar', exact: true }).click();
  await expect(p.getByText('PIN incorrecto. Probá de nuevo.', { exact: true })).toBeVisible({ timeout: 20000 });
  await p.screenshot({ path: shot('19-pin-incorrecto') });
  expect((await data(p)).confirmed.materiales).toHaveLength(0);

  await pinBox.fill('2468');
  await p.getByRole('button', { name: 'Autorizar', exact: true }).click();
  await expect.poll(async () => (await data(p)).confirmed.materiales.length, { timeout: 30000 }).toBe(1);
  await expect(p.getByText(/Volvió a como estaba antes de “Borró el material Rueda”/)).toBeVisible();
  await expect(p.getByText(/Designó responsable a Ana Gómez/)).toBeVisible();
  expect(errors).toEqual([]);
});
