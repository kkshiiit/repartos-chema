import { expect, type Page } from '@playwright/test';
export async function login(page: Page, name = 'Persona de prueba') {
  await page.addInitScript(() => localStorage.setItem('chema:welcome:v2', 'done'));
  await page.goto('/');
  await page.getByLabel('Tu nombre', { exact: true }).fill(name);
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Alquileres', exact: true })).toBeVisible();
}

export async function loginSynthetic(page: Page, name = 'Persona de prueba') {
  const { seed } = await import('../../src/data/seed');
  const state = seed();
  state.obras.forEach((o, i) => {
    o.clienteNombre = 'Cliente sintético ' + (i + 1);
    o.clienteTelefono = '';
    o.direccion = 'Dirección sintética ' + (i + 1);
    o.localidadBarrio = 'Zona de prueba';
    delete o.coordenadas;
  });
  await page.addInitScript((s) => {
    if (!localStorage.getItem('chema:demo:v1'))
      localStorage.setItem(
        'chema:demo:v1',
        JSON.stringify({ schema: 1, state: s, confirmed: s, queue: [] }),
      );
  }, state);
  await login(page, name);
}
