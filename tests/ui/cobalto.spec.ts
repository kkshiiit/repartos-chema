import { expect, test, type Page } from '@playwright/test';
import { AxeBuilder } from '@axe-core/playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import { loginSynthetic } from './helpers';

const captureDirectory = 'artifacts/capturas/estructura-1.5/matriz';
const reportDirectory = 'artifacts/validacion';
const routes = [
  ['/', 'alquileres'],
  ['/galpon', 'deposito'],
  ['/mapa', 'viaje'],
  ['/historial', 'historial'],
  ['/obra/nueva', 'nuevo'],
  ['/obra/obra_5', 'detalle'],
  ['/combos', 'combos'],
  ['/configuracion', 'ajustes'],
  ['/exportar', 'documentos'],
] as const;

async function inventory(page: Page) {
  return page.evaluate(() => JSON.parse(localStorage.getItem('chema:demo:v1')!).state);
}
async function assertNoOverflow(page: Page, description: string) {
  expect(
    await page.evaluate(() => ({
      width: innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      bodyWidth: document.body.scrollWidth,
    })),
    description,
  ).toEqual({
    width: page.viewportSize()!.width,
    documentWidth: page.viewportSize()!.width,
    bodyWidth: page.viewportSize()!.width,
  });
  // Check the actual visible action boxes, including fixed navigation, rather
  // than relying on document overflow (a root can hide overflowing children).
  const clipped = await page.getByRole('button').evaluateAll((buttons) =>
    buttons.flatMap((button) => {
      const rect = button.getBoundingClientRect();
      const style = getComputedStyle(button);
      if (
        !rect.width ||
        !rect.height ||
        style.visibility === 'hidden' ||
        rect.bottom < 0 ||
        rect.top > innerHeight
      )
        return [];
      // Horizontal scrollers intentionally expose controls beyond their viewport.
      let parent = button.parentElement;
      while (parent) {
        if (
          ['auto', 'scroll'].includes(getComputedStyle(parent).overflowX) &&
          parent.scrollWidth > parent.clientWidth
        )
          return [];
        parent = parent.parentElement;
      }
      return rect.left < -1 || rect.right > innerWidth + 1
        ? [
            {
              label: button.getAttribute('aria-label') || button.textContent,
              left: rect.left,
              right: rect.right,
            },
          ]
        : [];
    }),
  );
  expect(clipped, description).toEqual([]);
}

/** Browser text enlargement evidence; this does not emulate Android fontScale. */
async function enlargeText200(page: Page) {
  await page.evaluate(() => {
    const elements = Array.from(document.querySelectorAll<HTMLElement>('body *')).filter(
      (element) =>
        element.matches('input,textarea,button') ||
        Array.from(element.childNodes).some(
          (node) => node.nodeType === Node.TEXT_NODE && node.textContent?.trim(),
        ),
    );
    // Snapshot every computed value before changing ancestors to avoid cumulative
    // inheritance increasing nested text beyond the requested 200 percent.
    const values = elements.map((element) => ({
      element,
      font: parseFloat(getComputedStyle(element).fontSize),
      line: parseFloat(getComputedStyle(element).lineHeight),
    }));
    for (const { element, font, line } of values) {
      element.style.setProperty('font-size', `${font * 2}px`, 'important');
      if (Number.isFinite(line))
        element.style.setProperty('line-height', `${line * 2}px`, 'important');
    }
  });
}

async function openLoad(page: Page) {
  const prepare = page.getByRole('button', { name: 'Preparar carga', exact: true });
  await expect(prepare).toBeVisible();
  await prepare.click();
  await page
    .getByRole('button', { name: /^Detalles de / })
    .first()
    .click();
  await expect(page.getByLabel('Apodo de esta carga', { exact: true }).first()).toBeVisible();
}

test('Cobalto: el asistente conserva cliente, carga y observaciones al volver y cambiar tema', async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'reduce' });
  await loginSynthetic(page);
  const before = await inventory(page);
  await page.getByRole('button', { name: 'Nuevo alquiler', exact: true }).click();
  await page
    .getByLabel('Nombre del cliente', { exact: true })
    .fill('Cliente sintético con nombre largo para revisión');
  await page.getByLabel('Teléfono con país', { exact: true }).fill('+54 11 5555 0123');
  await page.getByLabel('Dirección', { exact: true }).fill('Dirección sintética 1234, planta baja');
  await page.getByLabel('Barrio / localidad', { exact: true }).fill('Localidad sintética');
  await page.getByRole('button', { name: 'Agregar observaciones', exact: true }).click();
  await page
    .getByLabel('Observaciones', { exact: true })
    .fill('Borrador que debe conservarse sin confirmar stock.');
  await page.getByRole('button', { name: 'Continuar a carga', exact: true }).click();
  await page.getByRole('button', { name: 'Agregar material', exact: true }).last().click();
  await page
    .getByRole('button', { name: /^Detalles de / })
    .first()
    .click();
  await page
    .getByLabel('Apodo de esta carga', { exact: true })
    .first()
    .fill('Carga sintética reservada');
  await page
    .getByRole('button', { name: /^Aumentar / })
    .first()
    .click();
  await page.getByRole('button', { name: 'Revisar alquiler', exact: true }).click();
  await expect(page.getByText(/Carga sintética reservada/)).toBeVisible();
  await page.emulateMedia({ colorScheme: 'dark' });
  await expect
    .poll(() => page.evaluate(() => document.documentElement.style.colorScheme))
    .toBe('dark');
  await page.getByRole('button', { name: '1 · Cliente', exact: true }).click();
  await expect(page.getByLabel('Nombre del cliente', { exact: true })).toHaveValue(
    'Cliente sintético con nombre largo para revisión',
  );
  await expect(page.getByLabel('Teléfono con país', { exact: true })).toHaveValue(
    '+54 11 5555 0123',
  );
  await expect(page.getByLabel('Dirección', { exact: true })).toHaveValue(
    'Dirección sintética 1234, planta baja',
  );
  await expect(page.getByLabel('Observaciones', { exact: true })).toHaveValue(
    'Borrador que debe conservarse sin confirmar stock.',
  );
  await page.getByRole('button', { name: 'Continuar a carga', exact: true }).click();
  await expect(page.getByLabel('Apodo de esta carga', { exact: true }).first()).toHaveValue(
    'Carga sintética reservada',
  );
  await expect(page.getByRole('button', { name: /Editar .*: 2$/ }).first()).toBeVisible();
  expect(await inventory(page)).toEqual(before);
});

test('Cobalto: X, Escape y fondo protegen la carga; descartar devuelve foco y no escribe inventario', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'reduce' });
  await loginSynthetic(page);
  await page.goto('/obra/obra_5');
  const before = await inventory(page);
  await openLoad(page);
  const draft = page.getByLabel('Apodo de esta carga', { exact: true }).first();
  await draft.fill('Borrador sintético sin guardar');
  for (const close of ['x', 'escape', 'backdrop']) {
    await test.step(`Cerrar mediante ${close}`, async () => {
      if (close === 'x')
        await page.getByRole('button', { name: 'Cerrar', exact: true }).last().click();
      if (close === 'escape') await page.keyboard.press('Escape');
      if (close === 'backdrop')
        await page
          .getByTestId('panel-backdrop')
          .last()
          .click({ position: { x: 5, y: 5 } });
      await expect(
        page.getByRole('heading', { name: '¿Descartar los cambios?', exact: true }),
      ).toBeVisible();
      await page.getByRole('button', { name: 'Seguir editando', exact: true }).click();
      await expect(draft).toHaveValue('Borrador sintético sin guardar');
      expect(await inventory(page)).toEqual(before);
    });
  }
  await page.getByRole('button', { name: 'Cerrar', exact: true }).last().click();
  await page.getByRole('button', { name: 'Descartar cambios', exact: true }).click();
  await expect(page.getByLabel('Apodo de esta carga', { exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Preparar carga', exact: true })).toBeFocused();
  expect(await inventory(page)).toEqual(before);
  await openLoad(page);
  await expect(page.getByLabel('Apodo de esta carga', { exact: true }).first()).not.toHaveValue(
    'Borrador sintético sin guardar',
  );
});

for (const width of [320, 360, 390, 412])
  for (const theme of ['light', 'dark'] as const) {
    test(`Cobalto ${width}dp ${theme}: contraste renderizado, bordes y texto 200%`, async ({
      page,
    }) => {
      test.setTimeout(240000);
      await mkdir(captureDirectory, { recursive: true });
      await mkdir(reportDirectory, { recursive: true });
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' });
      const errors: string[] = [];
      page.on('pageerror', (error) => errors.push(error.message));
      await loginSynthetic(page, 'Persona sintética de validación');
      const reports = [];
      for (const [route, label] of routes) {
        await page.goto(route);
        await expect(page.getByRole('heading').first()).toBeVisible();
        await assertNoOverflow(page, `${label} ${width} ${theme}`);
        const result = await new AxeBuilder({ page }).withRules(['color-contrast']).analyze();
        reports.push({
          route,
          label,
          width,
          theme,
          textPercent: 100,
          violations: result.violations,
          incomplete: result.incomplete,
        });
        await page.screenshot({
          path: `${captureDirectory}/${width}-${theme}-${label}.png`,
          fullPage: true,
        });
        // Enlarge every surface from its fresh rendered values, not CSS zoom:
        // viewport and tap areas keep their original dimensions while text grows.
        await enlargeText200(page);
        await assertNoOverflow(page, `${label} ${width} ${theme} texto200`);
        await page.screenshot({
          path: `${captureDirectory}/${width}-${theme}-${label}-texto200.png`,
          fullPage: true,
        });
      }
      await page.goto('/obra/obra_5');
      await openLoad(page);
      await assertNoOverflow(page, `panel carga ${width} ${theme}`);
      const panelResult = await new AxeBuilder({ page }).withRules(['color-contrast']).analyze();
      reports.push({
        route: '/obra/obra_5#carga',
        label: 'panel-carga',
        width,
        theme,
        textPercent: 100,
        violations: panelResult.violations,
        incomplete: panelResult.incomplete,
      });
      await page.screenshot({
        path: `${captureDirectory}/${width}-${theme}-panel-carga.png`,
        fullPage: true,
      });
      await enlargeText200(page);
      await assertNoOverflow(page, `panel carga ${width} ${theme} texto200`);
      await page.screenshot({
        path: `${captureDirectory}/${width}-${theme}-panel-carga-texto200.png`,
        fullPage: true,
      });
      await writeFile(
        `${reportDirectory}/estructura-contraste-${width}-${theme}.json`,
        JSON.stringify(
          {
            note: 'Navegador con fixture sintético. Texto 200% simulado; no es prueba de fontScale, TalkBack o teclado Android. Incomplete de Axe requiere revisión visual.',
            errors,
            reports,
          },
          null,
          2,
        ),
      );
      expect(errors).toEqual([]);
      expect(
        reports.flatMap((report) =>
          report.violations.map((violation) => ({
            route: report.route,
            id: violation.id,
            nodes: violation.nodes.map((node) => node.target),
          })),
        ),
      ).toEqual([]);
    });
  }
