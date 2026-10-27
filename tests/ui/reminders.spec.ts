import { test, expect, type Page } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import AxeBuilder from '@axe-core/playwright';
import { seed } from '../../src/data/seed';
import type { AppState } from '../../src/types';
import type { FeedbackState, Reminder } from '../../src/services/feedback/reminders';
import { login } from './helpers';

const fixedNow = new Date('2026-10-23T15:00:00.000Z');
const captureDirectory = 'artifacts/capturas/cierre-1.7/avisos-1.6';
const feedbackKey = 'chema:local-feedback:v1';
const names = [
  'Cliente hoy',
  'Cliente mañana',
  'Cliente vencido',
  'Cliente futuro',
  'Cliente pendiente',
  'Cliente finalizado',
];

type LegacyFeedback = {
  version: 1;
  preferences: { confirmations: boolean; sound: boolean; vibration: boolean };
  reminders: Record<string, Reminder>;
};

async function fixture(page: Page, feedback?: LegacyFeedback) {
  const state = seed(fixedNow);
  const retirementDates = [
    '2026-10-23',
    '2026-10-24',
    '2026-10-21',
    '2026-10-28',
    '2026-10-30',
    '2026-10-20',
  ];
  state.obras.forEach((obra, index) => {
    obra.clienteNombre = names[index];
    obra.clienteTelefono = '';
    obra.direccion = `Dirección sintética ${index + 1}`;
    obra.localidadBarrio = 'Zona sintética';
    obra.fechaRetiroEstimada = retirementDates[index];
    delete obra.coordenadas;
  });
  const finished = state.obras[5];
  for (const [materialId, count] of Object.entries(finished.saldosEnObra)) {
    const material = state.materiales.find((item) => item.id === materialId)!;
    material.cantidadEnObra -= count;
    material.cantidadGalpon += count;
  }
  finished.saldosEnObra = {};
  finished.estadoProceso = 'REINGRESADO';
  finished.fechaRetiroEfectiva = '2026-10-20';
  state.responsables = ['Persona sintética'];
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: 'light' });
  await page.clock.setFixedTime(fixedNow);
  await page.addInitScript(
    ({ state, feedback, feedbackKey }) => {
      if (!localStorage.getItem('chema:demo:v1'))
        localStorage.setItem(
          'chema:demo:v1',
          JSON.stringify({ schema: 1, state, confirmed: state, queue: [] }),
        );
      if (!localStorage.getItem('chema:theme:v1')) localStorage.setItem('chema:theme:v1', 'light');
      if (feedback && !localStorage.getItem(feedbackKey))
        localStorage.setItem(feedbackKey, JSON.stringify(feedback));
    },
    { state, feedback, feedbackKey },
  );
  await login(page, 'Persona sintética');
}

async function inventory(page: Page): Promise<AppState> {
  return page.evaluate(() => JSON.parse(localStorage.getItem('chema:demo:v1')!).state);
}

async function readFeedback(page: Page): Promise<FeedbackState | null> {
  return page.evaluate((key) => {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  }, feedbackKey);
}

async function openSettings(page: Page) {
  await page.goto('/configuracion');
  await page.getByRole('button', { name: 'Avisos y sonidos', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Avisos de retiro', exact: true })).toBeVisible();
  await expect(page.getByLabel('Horario de los avisos', { exact: true })).toBeEnabled();
}

async function openRentalReminders(page: Page, id = 'obra_4') {
  await page.goto(`/obra/${id}`);
  await page.getByRole('button', { name: 'Recordatorios', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Avisos de este alquiler', exact: true }),
  ).toBeVisible();
}

async function saveGeneralTime(page: Page, time: string) {
  await openSettings(page);
  await page.getByLabel('Horario de los avisos', { exact: true }).fill(time);
  await page.getByRole('button', { name: 'Guardar horario y días', exact: true }).click();
  await expect.poll(async () => (await readFeedback(page))?.globalPolicy.time).toBe(time);
  await expect(
    page.getByRole('button', { name: 'Guardar horario y días', exact: true }),
  ).toBeDisabled();
}

function assertNoScheduled(feedback: FeedbackState | null) {
  expect(feedback).not.toBeNull();
  expect(Object.values(feedback!.reminders).filter((item) => item.status === 'scheduled')).toEqual(
    [],
  );
}

test('contador civil muestra hoy, mañana, vencido y cierre sin cuenta activa', async ({ page }) => {
  await fixture(page);
  const rows = [
    ['Cliente hoy', 'Retirar hoy'],
    ['Cliente mañana', 'Retirar mañana'],
    ['Cliente vencido', 'Retiro atrasado · 2 días'],
    ['Cliente futuro', 'Retirar en 5 días'],
  ];
  for (const [name, countdown] of rows) {
    const row = page.getByRole('button', { name: `Abrir ${name}`, exact: true });
    await expect(row).toContainText(countdown);
  }
  const finished = page.getByRole('button', { name: 'Abrir Cliente finalizado', exact: true });
  await expect(finished).toContainText('Reingresado');
  await expect(finished).not.toContainText(/Retirar|Retiro vencido/);
  for (const [id, countdown] of [
    ['obra_1', 'Retirar hoy'],
    ['obra_2', 'Retirar mañana'],
    ['obra_3', 'Retiro vencido hace 2 días'],
  ]) {
    await page.goto(`/obra/${id}`);
    await expect(page.getByText('Alquilado hasta', { exact: true })).toBeVisible();
    await expect(page.getByText(countdown, { exact: true })).toBeVisible();
  }
  await page.goto('/obra/obra_6');
  await expect(page.getByText('Reingresado', { exact: true })).toBeVisible();
  await expect(
    page.getByText(/Retirar hoy|Retirar mañana|Retiro vencido|Retirar en \d/),
  ).toHaveCount(0);
});

test('Alquilado hasta usa calendario, admite escritura y persiste al crear y editar', async ({
  page,
}) => {
  await fixture(page);
  await page.goto('/obra/nueva');
  await page.getByLabel('Nombre del cliente', { exact: true }).fill('Cliente calendario sintético');
  await page.getByLabel('Dirección', { exact: true }).fill('Dirección sintética nueva');
  await page.getByLabel('Barrio / localidad', { exact: true }).fill('Zona sintética');
  const retirement = page.getByLabel('Alquilado hasta', { exact: true });
  await expect(retirement).toHaveAttribute('type', 'date');
  await retirement.fill('2026-10-29');
  await page.getByRole('button', { name: 'Continuar a carga', exact: true }).click();
  await page.getByRole('button', { name: 'Revisar alquiler', exact: true }).click();
  await expect(
    page.getByText('Entrega prevista: 23/10/2026 · Alquilado hasta: 29/10/2026', { exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Guardar alquiler', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Cliente calendario sintético', exact: true }),
  ).toBeVisible();
  await expect
    .poll(
      async () =>
        (await inventory(page)).obras.find(
          (obra) => obra.clienteNombre === 'Cliente calendario sintético',
        )?.fechaRetiroEstimada,
    )
    .toBe('2026-10-29');
  await page.getByRole('button', { name: 'Editar alquiler', exact: true }).click();
  await expect(retirement).toHaveValue('2026-10-29');
  await retirement
    .locator('..')
    .getByRole('button', { name: 'Escribir fecha', exact: true })
    .click();
  await expect(retirement).toHaveAttribute('type', 'text');
  await retirement.fill('30/10/2026');
  await page.getByRole('button', { name: 'Continuar a carga', exact: true }).click();
  await page.getByRole('button', { name: 'Revisar alquiler', exact: true }).click();
  await page.getByRole('button', { name: 'Guardar alquiler', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Cliente calendario sintético', exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(page.getByText('30/10/2026', { exact: true }).first()).toBeVisible();
  const created = (await inventory(page)).obras.filter(
    (obra) => obra.clienteNombre === 'Cliente calendario sintético',
  );
  expect(created).toHaveLength(1);
  expect(created[0].fechaRetiroEstimada).toBe('2026-10-30');
});

test('ajustes muestran 08:00 y cuatro días antes de activar; web guarda intención sin programar', async ({
  page,
}) => {
  await fixture(page);
  await openSettings(page);
  const time = page.getByLabel('Horario de los avisos', { exact: true });
  const requested = page.getByRole('switch', { name: 'Solicitar avisos de retiro', exact: true });
  await expect(time).toHaveValue('08:00');
  await expect(time).toHaveAttribute('type', 'time');
  await expect(requested).not.toBeChecked();
  for (const name of ['3 días antes', '2 días antes', '1 día antes', 'El mismo día']) {
    const day = page.getByRole('checkbox', { name, exact: true });
    await expect(day).toBeChecked();
    await day.uncheck();
  }
  await expect(requested).toBeDisabled();
  for (const name of ['3 días antes', '2 días antes', '1 día antes', 'El mismo día'])
    await page.getByRole('checkbox', { name, exact: true }).check();
  await time.fill('09:15');
  await requested.check();
  await expect
    .poll(async () => (await readFeedback(page))?.globalPolicy)
    .toEqual({
      enabled: true,
      time: '09:15',
      offsets: [3, 2, 1, 0],
    });
  await expect(
    page.getByText('Sin avisos activos en este navegador.', { exact: true }),
  ).toBeVisible();
  await expect(page.getByText(/La versión web no programa notificaciones/).first()).toBeVisible();
  let saved = await readFeedback(page);
  assertNoScheduled(saved);
  expect(Object.values(saved!.reminders).some((item) => item.status === 'pending')).toBe(true);
  await time.fill('10:20');
  await page.getByRole('button', { name: 'Guardar horario y días', exact: true }).click();
  await expect.poll(async () => (await readFeedback(page))?.globalPolicy.time).toBe('10:20');
  await page.reload();
  await page.getByRole('button', { name: 'Avisos y sonidos', exact: true }).click();
  await expect(time).toHaveValue('10:20');
  await expect(requested).toBeChecked();
  await expect(
    page.getByText('Sin avisos activos en este navegador.', { exact: true }),
  ).toBeVisible();
  saved = await readFeedback(page);
  assertNoScheduled(saved);
  expect(
    Object.values(saved!.reminders).every(
      (item) => !item.at.endsWith('T12:15:00.000Z') || item.status === 'cancelled',
    ),
  ).toBe(true);
});

test('personalización se conserva ante cambios generales y puede volver a heredar', async ({
  page,
}) => {
  await fixture(page);
  await openRentalReminders(page);
  await expect(page.getByText('Usa la configuración general', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Personalizar avisos', exact: true }).click();
  const time = page.getByLabel('Horario de los avisos', { exact: true });
  await time.fill('11:30');
  await page.getByRole('checkbox', { name: '3 días antes', exact: true }).uncheck();
  await page.getByRole('button', { name: 'Cerrar', exact: true }).last().click();
  await expect(page.getByText('¿Descartar los cambios?', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Seguir editando', exact: true }).click();
  await expect(time).toHaveValue('11:30');
  await page.getByRole('button', { name: 'Guardar avisos del alquiler', exact: true }).click();
  await expect(page.getByText('Configuración personalizada', { exact: true })).toBeVisible();
  const custom = { mode: 'custom', enabled: false, time: '11:30', offsets: [2, 1, 0] };
  await expect.poll(async () => (await readFeedback(page))?.rentalPolicies.obra_4).toEqual(custom);
  await saveGeneralTime(page, '09:00');
  expect((await readFeedback(page))!.rentalPolicies.obra_4).toEqual(custom);
  expect((await readFeedback(page))!.rentalPolicies.obra_2).toBeUndefined();
  await openRentalReminders(page, 'obra_2');
  await expect(
    page.getByText('3, 2, 1 día antes y el mismo día · 09:00', { exact: true }),
  ).toBeVisible();
  await openRentalReminders(page);
  await expect(
    page.getByText('2, 1 día antes y el mismo día · 11:30', { exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Usar configuración general', exact: true }).click();
  await expect(page.getByText('Usa la configuración general', { exact: true })).toBeVisible();
  await saveGeneralTime(page, '10:00');
  await openRentalReminders(page);
  await expect(
    page.getByText('3, 2, 1 día antes y el mismo día · 10:00', { exact: true }),
  ).toBeVisible();
  expect((await readFeedback(page))!.rentalPolicies.obra_4).toEqual({ mode: 'general' });
  assertNoScheduled(await readFeedback(page));
});

test('aviso manual anterior permanece protegido y la transición muestra cancelación pendiente', async ({
  page,
}) => {
  const manual: Reminder = {
    obraId: 'obra_4',
    title: 'Cliente futuro',
    retirementDate: '2026-10-28',
    at: '2026-10-27T11:00:00.000Z',
    sound: false,
    vibrate: false,
    status: 'scheduled',
  };
  await fixture(page, {
    version: 1,
    preferences: { confirmations: false, sound: false, vibration: false },
    reminders: { obra_4: manual },
  });
  await openRentalReminders(page);
  await expect(page.getByText('Aviso anterior conservado', { exact: true })).toBeVisible();
  await expect(page.getByText(/Registrado como programado en la app/)).toBeVisible();
  expect((await readFeedback(page))!.reminders.obra_4).toEqual(manual);
  expect(Object.keys((await readFeedback(page))!.reminders)).toEqual(['obra_4']);
  await page.getByRole('button', { name: 'Usar configuración general', exact: true }).click();
  await expect(page.getByText('Usa la configuración general', { exact: true })).toBeVisible();
  await expect(page.getByText(/Cancelación pendiente/)).toBeVisible();
  const saved = await readFeedback(page);
  expect(saved!.version).toBe(2);
  expect(saved!.rentalPolicies.obra_4).toEqual({ mode: 'general' });
  expect(saved!.reminders.obra_4).toMatchObject({ status: 'cancelled', cancellationPending: true });
  expect(Object.keys(saved!.reminders)).toEqual(['obra_4']);
  await page.reload();
  await page.getByRole('button', { name: 'Recordatorios', exact: true }).click();
  await expect(page.getByText(/Cancelación pendiente/)).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Reintentar programación o cancelación', exact: true }),
  ).toBeVisible();
});

test('capturas reales de principal, detalle, ajustes y personalización en claro y oscuro', async ({
  page,
}) => {
  await fixture(page);
  await mkdir(captureDirectory, { recursive: true });
  for (const theme of ['light', 'dark']) {
    if (theme === 'dark') {
      await page.goto('/configuracion');
      await page.getByRole('button', { name: 'Apariencia', exact: true }).click();
      await page.getByRole('button', { name: 'Oscuro', exact: true }).click();
      await page.getByRole('button', { name: 'Cerrar', exact: true }).last().click();
      await expect
        .poll(() => page.evaluate(() => localStorage.getItem('chema:theme:v1')))
        .toBe('dark');
    }
    const capture = async (screen: string) => {
      const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
      await writeFile(
        `artifacts/validacion/cierre-1.7/avisos-axe-${theme}-${screen}.json`,
        JSON.stringify({ violations: result.violations, incomplete: result.incomplete }, null, 2) +
          '\n',
      );
      expect(result.violations, `${theme} ${screen}: accesibilidad automatizada`).toEqual([]);
      expect(result.incomplete, `${theme} ${screen}: comprobaciones sin resolver`).toEqual([]);
      await page.screenshot({ path: `${captureDirectory}/390-${theme}-${screen}.png` });
    };
    await page.goto('/');
    await expect(
      page.getByRole('button', { name: 'Abrir Cliente hoy', exact: true }),
    ).toBeVisible();
    await capture('principal');
    await page.goto('/obra/obra_4');
    await expect(page.getByText('Retirar en 5 días', { exact: true })).toBeVisible();
    await capture('detalle');
    await openSettings(page);
    await expect(page.getByLabel('Horario de los avisos', { exact: true })).toHaveValue('08:00');
    await capture('ajustes');
    await openRentalReminders(page);
    await page.getByRole('button', { name: 'Personalizar avisos', exact: true }).click();
    await expect(
      page.getByRole('button', { name: 'Guardar avisos del alquiler', exact: true }),
    ).toBeVisible();
    await capture('personalizado');
  }
});
