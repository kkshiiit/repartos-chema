import { expect, type Page } from '@playwright/test';
export async function login(page: Page, name = 'Persona de prueba') {
  await page.addInitScript(() => localStorage.setItem('chema:welcome:v2', 'done'));
  await page.goto('/');
  await page.getByLabel('Tu nombre', { exact: true }).fill(name);
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Alquileres', exact: true })).toBeVisible();
}
