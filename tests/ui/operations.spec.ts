import { loginSynthetic as login } from './helpers';
import { test, expect } from '@playwright/test';
test('retiro y reingreso conservan el total', async ({ page }) => {
  await login(page);
  await expect(page.getByRole('heading', { name: 'Alquileres' })).toBeVisible();
  const total = () =>
    page.evaluate(() => {
      const s = JSON.parse(localStorage.getItem('chema:demo:v1')!).state;
      return s.materiales.reduce(
        (
          n: number,
          m: {
            cantidadGalpon: number;
            cantidadEnObra: number;
            cantidadEnTaller: number;
            cantidadPerdido: number;
          },
        ) => n + m.cantidadGalpon + m.cantidadEnObra + m.cantidadEnTaller + m.cantidadPerdido,
        0,
      );
    });
  const before = await total();
  await page.goto('/obra/obra_1');
  await page.getByRole('button', { name: 'Retirar', exact: true }).last().click();
  await page.getByRole('button', { name: 'Fabián', exact: true }).click();
  await page.getByRole('button', { name: 'Confirmar operación', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Reingresar', exact: true }).last()).toBeVisible();
  expect(await total()).toBe(before);
  await page.getByRole('button', { name: 'Reingresar', exact: true }).last().click();
  await page.getByRole('button', { name: 'Confirmar', exact: true }).click();
  await expect(page.getByText('Reingresado', { exact: true }).last()).toBeVisible();
  expect(await total()).toBe(before);
  await page.reload();
  expect(await total()).toBe(before);
});

test('triangulación, daño y recuperación conservan existencias y procedencia', async ({ page }) => {
  const state = () => page.evaluate(() => JSON.parse(localStorage.getItem('chema:demo:v1')!).state);
  await login(page);
  await page.goto('/obra/obra_1');
  const before = await state();
  await page.getByRole('button', { name: 'Triangular', exact: true }).click();
  await page.getByRole('button', { name: 'Fabián', exact: true }).click();
  await page.getByRole('button', { name: 'Alquiler destino', exact: true }).click();
  await page.getByRole('button', { name: 'Cliente sintético 2', exact: true }).click();
  await page
    .getByLabel('Motivo de transferencia', { exact: true })
    .fill('Traslado directo de prueba');
  await page.getByRole('button', { name: 'Confirmar operación', exact: true }).click();
  await expect.poll(async () => (await state()).revision).toBe(before.revision + 1);
  const transferred = await state();
  expect(transferred.materiales).toEqual(before.materiales);
  expect(transferred.logs[0].movimientos[0]).toMatchObject({
    origen: 'obra:obra_1',
    destino: 'obra:obra_2',
    cantidad: 1,
  });
  await page.getByRole('button', { name: 'Con faltante', exact: true }).click();
  await page.getByRole('button', { name: 'Agregar faltante', exact: true }).click();
  await page.getByRole('button', { name: 'Dañado', exact: true }).click();
  await page.getByRole('button', { name: 'Confirmar operación', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Recuperar material', exact: true })).toBeVisible();
  const damaged = await state();
  expect(damaged.materiales[0].cantidadEnTaller).toBe(1);
  await page.getByRole('button', { name: 'Recuperar material', exact: true }).click();
  await page
    .getByLabel('Motivo de recuperación', { exact: true })
    .fill('Reparación completa de prueba');
  await page.getByRole('button', { name: 'Confirmar devolución', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Recuperar material', exact: true })).toHaveCount(
    0,
  );
  const recovered = await state();
  expect(recovered.materiales[0].cantidadEnTaller).toBe(0);
  expect(recovered.materiales[0].cantidadGalpon).toBe(before.materiales[0].cantidadGalpon + 1);
  expect(recovered.materiales[0].cantidadEnObra).toBe(before.materiales[0].cantidadEnObra - 1);
});

test('wizard prepara carga sin persistir al navegar y confirma un solo alquiler', async ({
  page,
}) => {
  await login(page);
  const state = () => page.evaluate(() => JSON.parse(localStorage.getItem('chema:demo:v1')!).state);
  const before = await state();
  await page.getByRole('button', { name: 'Nuevo alquiler', exact: true }).click();
  await page.getByLabel('Nombre del cliente', { exact: true }).fill('Cliente wizard sintético');
  await page.getByLabel('Dirección', { exact: true }).fill('Calle sintética 321');
  await page.getByLabel('Barrio / localidad', { exact: true }).fill('Zona sintética');
  await page.getByLabel('Observaciones', { exact: true }).fill('Conservar durante revisión');
  await page.getByRole('button', { name: 'Continuar a carga', exact: true }).click();
  await page.getByRole('button', { name: 'Agregar material', exact: true }).last().click();
  await page.getByLabel('Apodo de esta carga', { exact: true }).fill('Identificación sintética');
  await page.getByRole('button', { name: 'Revisar alquiler', exact: true }).click();
  expect(await state()).toEqual(before);
  await page.getByRole('button', { name: 'Volver a carga', exact: true }).click();
  await expect(page.getByLabel('Apodo de esta carga', { exact: true })).toHaveValue(
    'Identificación sintética',
  );
  await page.getByRole('button', { name: 'Volver a cliente', exact: true }).click();
  await expect(page.getByLabel('Observaciones', { exact: true })).toHaveValue(
    'Conservar durante revisión',
  );
  expect(await state()).toEqual(before);
  await page.getByRole('button', { name: 'Continuar a carga', exact: true }).click();
  await page.getByRole('button', { name: 'Revisar alquiler', exact: true }).click();
  await page
    .getByRole('button', { name: 'Guardar alquiler', exact: true })
    .click({ clickCount: 2 });
  await expect(
    page.getByRole('heading', { name: 'Cliente wizard sintético', exact: true }),
  ).toBeVisible();
  const after = await state();
  expect(
    after.obras.filter(
      (o: { clienteNombre: string }) => o.clienteNombre === 'Cliente wizard sintético',
    ),
  ).toHaveLength(1);
  const created = after.obras.find(
    (o: { clienteNombre: string }) => o.clienteNombre === 'Cliente wizard sintético',
  );
  expect(created.materialesCargados).toHaveLength(1);
  expect(created.materialesCargados[0].apodo).toBe('Identificación sintética');
  expect(created.observaciones).toBe('Conservar durante revisión');
  expect(after.materiales).toEqual(before.materiales);
  expect(after.revision).toBe(before.revision + 2);
});
