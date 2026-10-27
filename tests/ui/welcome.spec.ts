import { test, expect } from '@playwright/test';
import { loginSynthetic as login } from './helpers';
test('bienvenida breve completa una vez y puede abrirse desde Ajustes', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('Tus alquileres, en un lugar', { exact: true })).toBeVisible();
  await page.screenshot({ path: 'artifacts/capturas/cierre-1.7/estructura-1.5/bienvenida-1.png' });
  for (let i = 0; i < 3; i++)
    await page.getByRole('button', { name: 'Siguiente', exact: true }).click();
  await page.getByRole('button', { name: 'Empezar', exact: true }).click();
  await page.getByLabel('Tu nombre', { exact: true }).fill('Ana de prueba');
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Alquileres', exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByText('Tus alquileres, en un lugar', { exact: true })).toHaveCount(0);
  await page.goto('/configuracion');
  await page.getByRole('button', { name: 'Ver bienvenida', exact: true }).click();
  await expect(page.getByText('Tus alquileres, en un lugar', { exact: true })).toBeVisible();
});
test('cambiar nombre local conserva inventario y autores sin cuentas ni invitaciones', async ({
  page,
}) => {
  await login(page, 'Persona A');
  const before = await page.evaluate(
    () => JSON.parse(localStorage.getItem('chema:demo:v1')!).state.obras.length,
  );
  await page.goto('/configuracion');
  await expect(page.getByRole('button', { name: 'Crear invitación', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Persona A', exact: true }).click();
  await page.getByRole('button', { name: 'Cambiar nombre', exact: true }).click();
  await page.getByLabel('Tu nombre', { exact: true }).fill('Persona B');
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Alquileres', exact: true })).toBeVisible();
  await page.goto('/obra/obra_5');
  await page.getByRole('button', { name: 'Registrar entrega', exact: true }).last().click();
  await page.getByRole('button', { name: 'Fabián', exact: true }).click();
  await page.getByRole('button', { name: 'Confirmar entrega', exact: true }).click();
  // A full document navigation must wait for the persisted operation's UI acknowledgement.
  await expect(
    page.getByRole('button', { name: 'Registrar retiro', exact: true }).last(),
  ).toBeVisible();
  await page.goto('/historial');
  await expect(page.getByText(/Persona B/).first()).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(
        () => JSON.parse(localStorage.getItem('chema:demo:v1')!).state.logs[0].usuarioNombre,
      ),
    )
    .toBe('Persona B');
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem('chema:demo:v1')!).state.obras.length,
    ),
  ).toBe(before);
});
