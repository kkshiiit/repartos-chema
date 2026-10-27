import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { login } from './helpers';
test.skip(
  process.env.CHEMA_TEST_LOCAL !== 'true',
  'Recorrido exclusivo de la compilación individual LOCAL_ONLY.',
);
test('individual: vacío, stock, alquiler, entrega, retiro, JSON, documentos y offline', async ({
  page,
  context,
}) => {
  test.setTimeout(180000);
  const errors: string[] = [],
    cloudRequests: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('request', (r) => {
    if (/googleapis|firebaseio|cloudfunctions|workers\.dev/.test(r.url()))
      cloudRequests.push(r.url());
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await login(page, 'Persona local');
  const state = () => page.evaluate(() => JSON.parse(localStorage.getItem('chema:demo:v1')!).state);
  expect((await state()).obras).toEqual([]);
  expect((await state()).materiales).toEqual([]);
  await expect(page.getByText('Local · En este celular', { exact: true })).toBeVisible();
  await page.goto('/galpon');
  await page.getByRole('button', { name: 'Agregar material', exact: true }).click();
  await page.getByLabel('Nombre del material', { exact: true }).fill('Cuerpo de andamio');
  await page.getByRole('button', { name: '1.30m', exact: true }).click();
  await page.getByRole('button', { name: 'Guardar cambios', exact: true }).click();
  await page.getByRole('button', { name: 'Confirmar', exact: true }).click();
  await expect.poll(async () => (await state()).materiales.length).toBe(1);
  await page
    .getByRole('button', { name: 'Opciones de Cuerpo de andamio 1.30m', exact: true })
    .click();
  await page.getByRole('button', { name: 'Ajustar', exact: true }).click();
  await page.getByLabel('Diferencia entera (+ o −)', { exact: true }).fill('20');
  await page.getByLabel('Procedencia / destino', { exact: true }).fill('Inventario inicial');
  await page.getByLabel('Motivo y comprobante', { exact: true }).fill('Recuento físico');
  await page.getByRole('button', { name: 'Guardar cambios', exact: true }).click();
  await page.getByRole('button', { name: 'Confirmar', exact: true }).click();
  await expect.poll(async () => (await state()).materiales[0]?.cantidadGalpon).toBe(20);
  await page.goto('/obra/nueva');
  await page.getByLabel('Nombre del cliente', { exact: true }).fill('Cliente local de prueba');
  await page.getByLabel('Dirección', { exact: true }).fill('Dirección de prueba 123');
  await page.getByLabel('Barrio / localidad', { exact: true }).fill('Zona de prueba');
  await page.getByRole('button', { name: 'Continuar a carga', exact: true }).click();
  await page.getByRole('button', { name: 'Revisar alquiler', exact: true }).click();
  await page.getByRole('button', { name: 'Guardar alquiler', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Cliente local de prueba', exact: true }),
  ).toBeVisible();
  const detail = page.url();
  await page.getByRole('button', { name: 'Preparar carga', exact: true }).click();
  await page.getByRole('button', { name: 'Agregar material', exact: true }).last().click();
  await page.getByRole('button', { name: 'Guardar carga', exact: true }).click();
  await page.getByRole('button', { name: 'Registrar entrega', exact: true }).last().click();
  await expect(
    page.getByRole('button', { name: 'Agregar responsable', exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Agregar responsable', exact: true }).click();
  await page.getByLabel('Nombre del responsable', { exact: true }).fill('Persona local');
  await page.screenshot({
    path: 'artifacts/capturas/cierre-1.7/estructura-1.5/responsable.png',
    fullPage: true,
  });
  await page.getByRole('button', { name: 'Guardar responsable', exact: true }).click();
  await expect.poll(async () => (await state()).responsables).toEqual(['Persona local']);
  await page.getByLabel('Recibió', { exact: true }).fill('Receptor de prueba');
  await expect(page.getByRole('button', { name: 'Persona local', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await page.getByRole('button', { name: 'Confirmar entrega', exact: true }).click();
  await expect.poll(async () => (await state()).materiales[0]?.cantidadGalpon).toBe(19);
  expect((await state()).materiales[0].cantidadEnObra).toBe(1);
  await page.goto('/historial');
  await page
    .getByRole('button', {
      name: 'Ver movimiento: Confirmó la entrega · Cliente local de prueba',
      exact: true,
    })
    .click();
  await page.getByRole('button', { name: 'Deshacer', exact: true }).click();
  await page.getByRole('button', { name: 'Confirmar', exact: true }).click();
  await expect.poll(async () => (await state()).materiales[0]?.cantidadGalpon).toBe(20);
  await page.goto(detail);
  await page.getByRole('button', { name: 'Registrar entrega', exact: true }).last().click();
  await page.getByRole('button', { name: 'Persona local', exact: true }).click();
  await page.getByRole('button', { name: 'Confirmar entrega', exact: true }).click();
  await page.getByRole('button', { name: 'Registrar retiro', exact: true }).last().click();
  await page.getByRole('button', { name: 'Persona local', exact: true }).click();
  await page.getByRole('button', { name: 'Confirmar retiro', exact: true }).click();
  await expect.poll(async () => (await state()).materiales[0]?.cantidadGalpon).toBe(20);
  expect((await state()).materiales[0].cantidadEnObra).toBe(0);
  await page.getByRole('button', { name: 'Más acciones', exact: true }).click();
  await page.getByRole('button', { name: 'Reingresar', exact: true }).last().click();
  await page.getByRole('button', { name: 'Confirmar', exact: true }).click();
  await page.goto('/exportar');
  for (const [button, file] of [
    ['Exportar Excel', 'chema-reporte.xlsx'],
    ['Generar remito', 'chema-remito.docx'],
  ]) {
    if (button === 'Generar remito')
      await page.getByRole('tab', { name: 'Word', exact: true }).click();
    const pending = page.waitForEvent('download');
    await page.getByRole('button', { name: button!, exact: true }).click();
    const download = await pending;
    expect(download.suggestedFilename()).toBe(file);
    const bytes = await readFile((await download.path())!);
    expect(bytes.subarray(0, 2).toString()).toBe('PK');
  }
  await page.goto('/configuracion');
  await page.getByRole('button', { name: 'Copias y restauración', exact: true }).click();
  const pending = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Descargar copia', exact: true }).click();
  const download = await pending;
  const raw = await readFile((await download.path())!);
  expect(JSON.parse(raw.toString()).envelope.state.materiales[0]?.cantidadGalpon).toBe(20);
  const exportBeforeEmpty = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Empezar vacío', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Confirmar', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'Guardar copia', exact: true }).click();
  await exportBeforeEmpty;
  await page.getByRole('button', { name: 'Guardé el JSON fuera', exact: true }).click();
  await page.getByRole('button', { name: 'Confirmar', exact: true }).click();
  await expect.poll(async () => (await state()).materiales.length).toBe(0);
  await page.reload();
  await page.getByRole('button', { name: 'Copias y restauración', exact: true }).click();
  await page.getByRole('button', { name: 'Recuperar anterior', exact: true }).click();
  await page.getByRole('button', { name: 'Confirmar', exact: true }).click();
  await expect.poll(async () => (await state()).materiales[0]?.cantidadGalpon).toBe(20);
  const picker = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: 'Elegir copia', exact: true }).click();
  await (await picker).setFiles({ name: 'copia.json', mimeType: 'application/json', buffer: raw });
  await page.getByRole('button', { name: 'Restaurar esta copia', exact: true }).click();
  await expect(
    page.getByText('Importación completada: 1 alquiler guardado en este celular.', {
      exact: true,
    }),
  ).toBeVisible();
  await page.goto('/');
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Alquileres', exact: true })).toBeVisible();
  expect((await state()).materiales[0]?.cantidadGalpon).toBe(20);
  await context.setOffline(false);
  await page.screenshot({
    path: 'artifacts/capturas/cierre-1.7/estructura-1.5/local-alquileres.png',
    fullPage: true,
  });
  expect(errors).toEqual([]);
  expect(cloudRequests).toEqual([]);
});
test('remito Word no queda bloqueado por un filtro Excel inválido', async ({ page }) => {
  await login(page, 'Persona local');
  await page.goto('/obra/nueva');
  await page.getByLabel('Nombre del cliente', { exact: true }).fill('Cliente para remito');
  await page.getByLabel('Dirección', { exact: true }).fill('Dirección de prueba 123');
  await page.getByLabel('Barrio / localidad', { exact: true }).fill('Zona de prueba');
  await page.getByRole('button', { name: 'Continuar a carga', exact: true }).click();
  await page.getByRole('button', { name: 'Revisar alquiler', exact: true }).click();
  await page.getByRole('button', { name: 'Guardar alquiler', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Cliente para remito', exact: true }),
  ).toBeVisible();
  await page.goto('/exportar');
  await page.getByLabel('Entrega desde · AAAA-MM-DD', { exact: true }).fill('incorrecta');
  const pending = page.waitForEvent('download', { timeout: 5000 });
  await page.getByRole('tab', { name: 'Word', exact: true }).click();
  await page.getByRole('button', { name: 'Generar remito', exact: true }).click();
  expect((await pending).suggestedFilename()).toBe('chema-remito.docx');
});
test('temas locales persisten y conservan el formulario', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await login(page, 'Persona local');
  await page.goto('/obra/nueva');
  await page.getByLabel('Nombre del cliente', { exact: true }).fill('Borrador conservado');
  await page.emulateMedia({ colorScheme: 'dark' });
  await expect
    .poll(() => page.evaluate(() => document.documentElement.style.colorScheme))
    .toBe('dark');
  await expect(page.getByLabel('Nombre del cliente', { exact: true })).toHaveValue(
    'Borrador conservado',
  );
  await page.goto('/configuracion');
  await page.getByRole('button', { name: 'Apariencia', exact: true }).click();
  await page.getByRole('button', { name: 'Claro', exact: true }).click();
  await page.reload();
  await expect
    .poll(() => page.evaluate(() => document.documentElement.style.colorScheme))
    .toBe('light');
  await page.screenshot({
    path: 'artifacts/capturas/cierre-1.7/estructura-1.5/local-ajustes-claro.png',
    fullPage: true,
  });
  await page.getByRole('button', { name: 'Apariencia', exact: true }).click();
  await page.getByRole('button', { name: 'Oscuro', exact: true }).click();
  await expect
    .poll(() => page.evaluate(() => document.documentElement.style.colorScheme))
    .toBe('dark');
  await page.getByRole('button', { name: 'Seguir sistema', exact: true }).click();
  await page.emulateMedia({ colorScheme: 'light' });
  await expect
    .poll(() => page.evaluate(() => document.documentElement.style.colorScheme))
    .toBe('light');
});
