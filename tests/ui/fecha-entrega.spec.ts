import { test, expect } from '@playwright/test';
import { seed } from '../../src/data/seed';
import type { AppState } from '../../src/types';
import { login } from './helpers';

test('entrega anticipada rechaza fecha incoherente sin perder formulario ni mover stock', async ({
  page,
}) => {
  const now = new Date('2026-10-24T15:00:00Z');
  const state = seed(now);
  state.responsables = ['Persona sintética'];
  state.obras.forEach((rental, index) => {
    rental.clienteNombre = `Cliente sintético ${index + 1}`;
    rental.direccion = `Dirección sintética ${index + 1}`;
    rental.localidadBarrio = 'Zona sintética';
    delete rental.coordenadas;
  });
  const pending = state.obras.find((rental) => rental.id === 'obra_5')!;
  pending.fechaEntrega = '2026-10-30';
  pending.fechaRetiroEstimada = '2026-11-01';
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: 'light' });
  await page.clock.setFixedTime(now);
  await page.addInitScript((state) => {
    if (!localStorage.getItem('chema:demo:v1'))
      localStorage.setItem(
        'chema:demo:v1',
        JSON.stringify({ schema: 1, state, confirmed: state, queue: [] }),
      );
  }, state);
  await login(page, 'Persona sintética');
  await page.goto('/obra/obra_5');
  const raw = () => page.evaluate(() => localStorage.getItem('chema:demo:v1'));
  const before = await raw();
  await page.getByRole('button', { name: 'Registrar entrega', exact: true }).last().click();
  await page.getByRole('button', { name: 'Persona sintética', exact: true }).click();
  await page.getByLabel('Recibió', { exact: true }).fill('Receptor sintético');
  const retirement = page.getByLabel('Retiro previsto · AAAA-MM-DD', { exact: true });
  await retirement.fill('2026-10-25');
  await page.getByRole('button', { name: 'Confirmar entrega', exact: true }).click();
  await expect(
    page
      .getByText('El retiro previsto no puede ser anterior a la entrega planificada.', {
        exact: true,
      })
      .last(),
  ).toBeVisible();
  expect(await raw()).toBe(before);
  await expect(page.getByLabel('Recibió', { exact: true })).toHaveValue('Receptor sintético');
  await expect(retirement).toHaveValue('25/10/2026');
  await retirement.fill('2026-10-30');
  await page.getByRole('button', { name: 'Confirmar entrega', exact: true }).click();
  await expect(retirement).toHaveCount(0);
  await page.reload();
  const saved: AppState = await page.evaluate(
    () => JSON.parse(localStorage.getItem('chema:demo:v1')!).state,
  );
  expect(saved.obras.find((rental) => rental.id === 'obra_5')).toMatchObject({
    estadoProceso: 'ENTREGADO',
    fechaEntrega: '2026-10-30',
    fechaEntregaEfectiva: '2026-10-24',
    fechaRetiroEstimada: '2026-10-30',
    recibidoPor: 'Receptor sintético',
    entregadoPor: ['Persona sintética'],
  });
  expect(saved.materiales.find((material) => material.id === 'marco130')).toMatchObject({
    cantidadGalpon: 48,
    cantidadEnObra: 72,
  });
  expect(saved.logs).toHaveLength(state.logs.length + 1);
});
