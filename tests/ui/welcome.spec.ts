import { test, expect } from '@playwright/test';
import { loginSynthetic as login } from './helpers';
test('bienvenida breve completa una vez y puede abrirse desde Ajustes', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('Tus alquileres, en un lugar', { exact: true })).toBeVisible();
  await page.screenshot({ path: 'artifacts/capturas/bienvenida-1.png' });
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
test('equipo compartido local conserva alquileres, autores y permite quitar un acceso', async ({
  page,
}) => {
  await login(page, 'Ana');
  await page.goto('/configuracion');
  await page.getByRole('button', { name: 'Crear invitación', exact: true }).click();
  const invite = await page.getByLabel('Enlace de invitación', { exact: true }).inputValue();
  expect(invite).toContain('repartoschema://equipo/unirse?token=');
  await page.getByRole('button', { name: 'Salir del equipo', exact: true }).click();
  await page.getByLabel('Tu nombre', { exact: true }).fill('Juan');
  await page.getByRole('button', { name: 'Tengo una invitación', exact: true }).click();
  await page.getByLabel('Enlace de invitación', { exact: true }).fill(invite);
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await page.goto('/obra/obra_5');
  await page.getByRole('button', { name: 'Entregar', exact: true }).click();
  await page.getByLabel('Recibió', { exact: true }).fill('Cliente de prueba');
  await page.getByRole('button', { name: 'Fabián', exact: true }).click();
  await page.getByRole('button', { name: 'Confirmar operación', exact: true }).click();
  await expect(page.getByText('Cliente de prueba', { exact: true })).toBeVisible();
  await page.goto('/configuracion');
  await expect(page.getByRole('button', { name: 'Crear invitación', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Salir del equipo', exact: true }).click();
  await page.getByLabel('Tu nombre', { exact: true }).fill('Ana');
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await page.goto('/historial');
  await expect(page.getByText(/^Juan ·/).first()).toBeVisible();
  await page.goto('/configuracion');
  await page.getByRole('button', { name: 'Quitar a Juan', exact: true }).click();
  await page.getByRole('button', { name: 'Confirmar', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Quitar a Juan', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Salir del equipo', exact: true }).click();
  await page.getByLabel('Tu nombre', { exact: true }).fill('Juan');
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await expect(page.getByText(/Este nombre fue quitado/)).toBeVisible();
});
