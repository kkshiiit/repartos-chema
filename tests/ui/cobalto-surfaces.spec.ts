import { expect, test } from '@playwright/test';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { loginSynthetic } from './helpers';

const directory = 'artifacts/capturas/estructura-1.5/superficies';

for (const theme of ['light', 'dark'] as const) {
  test(`Cobalto superficies secundarias ${theme}: formularios, selectores y revisiones con fixture sintético`, async ({
    page,
  }) => {
    test.setTimeout(180000);
    await mkdir(directory, { recursive: true });
    await mkdir('artifacts/validacion', { recursive: true });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' });
    await loginSynthetic(page, 'Persona sintética de capturas');
    const before = await page.evaluate(
      () => JSON.parse(localStorage.getItem('chema:demo:v1')!).state,
    );
    const captures: {
      name: string;
      route: string;
      documentWidth: number;
      viewportWidth: number;
    }[] = [];
    async function capture(name: string) {
      const layout = await page.evaluate(() => ({
        documentWidth: document.documentElement.scrollWidth,
        viewportWidth: innerWidth,
      }));
      await page.screenshot({ path: `${directory}/390-${theme}-${name}.png`, fullPage: true });
      captures.push({ name, route: new URL(page.url()).pathname, ...layout });
      expect(layout.documentWidth, name).toBeLessThanOrEqual(layout.viewportWidth + 1);
    }
    async function visit(route: string) {
      await page.goto(route);
      await expect(page.getByRole('heading').first()).toBeVisible();
    }
    async function closeUnchangedPanel() {
      const before = await page.getByRole('button', { name: 'Cerrar', exact: true }).count();
      await page.getByRole('button', { name: 'Cerrar', exact: true }).last().click();
      await expect(page.getByRole('button', { name: 'Cerrar', exact: true })).toHaveCount(
        before - 1,
      );
    }

    await test.step('Edición y los pasos Cliente, Carga y Revisar sin persistir', async () => {
      await visit('/obra/editar?id=obra_5');
      await expect(page.getByLabel('Nombre del cliente', { exact: true })).toHaveValue(
        'Cliente sintético 5',
      );
      await capture('editar-cliente');
      await page.getByRole('button', { name: 'Continuar a carga', exact: true }).click();
      await expect(page.getByRole('button', { name: /^Detalles de / }).first()).toBeVisible();
      await capture('wizard-carga');
      await page
        .getByRole('button', { name: /^Editar .*: / })
        .first()
        .click();
      await expect(page.getByLabel('Cantidad entera', { exact: true })).toBeVisible();
      await capture('contador-directo');
      await page.getByRole('button', { name: 'Cancelar', exact: true }).click();
      await page.getByRole('button', { name: 'Revisar alquiler', exact: true }).click();
      await expect(
        page.getByRole('button', { name: 'Guardar alquiler', exact: true }),
      ).toBeVisible();
      await capture('wizard-revisar');
    });

    await test.step('Filtros de zona y de historial con sus selectores', async () => {
      await visit('/');
      await page.getByRole('button', { name: 'Filtros', exact: true }).click();
      await page.getByRole('button', { name: 'Zona', exact: true }).click();
      await expect(page.getByRole('button', { name: 'Zona de prueba', exact: true })).toBeVisible();
      await capture('selector-zona');
      await closeUnchangedPanel();
      await visit('/historial');
      await page.getByRole('button', { name: 'Filtrar historial', exact: true }).click();
      await expect(page.getByLabel('Fecha · AAAA-MM-DD', { exact: true })).toBeVisible();
      await capture('filtros-historial');
      await page.getByRole('button', { name: 'Alquiler', exact: true }).click();
      await expect(
        page.getByRole('button', { name: 'Todos los alquileres', exact: true }),
      ).toBeVisible();
      await capture('selector-historial-alquiler');
      await closeUnchangedPanel();
      await page.getByRole('button', { name: 'Usuario', exact: true }).click();
      await expect(
        page.getByRole('button', { name: 'Todos los usuarios', exact: true }),
      ).toBeVisible();
      await capture('selector-historial-usuario');
    });

    await test.step('Opciones de pieza, edición, ajuste y movimiento sin guardar', async () => {
      await visit('/galpon');
      const options = page.getByRole('button', { name: /^Opciones de Marco de andamio / }).first();
      await options.click();
      await expect(page.getByRole('button', { name: 'Mover stock', exact: true })).toBeVisible();
      await capture('pieza-opciones');
      await page.getByRole('button', { name: 'Editar', exact: true }).click();
      await expect(page.getByLabel('Nombre del material', { exact: true })).toBeVisible();
      await capture('pieza-editar');
      await closeUnchangedPanel();
      await options.click();
      await page.getByRole('button', { name: 'Ajustar', exact: true }).click();
      await expect(page.getByLabel('Motivo y comprobante', { exact: true })).toBeVisible();
      await capture('pieza-ajuste');
      await closeUnchangedPanel();
      await options.click();
      await page.getByRole('button', { name: 'Mover stock', exact: true }).click();
      await expect(page.getByLabel('Cantidad a mover', { exact: true })).toBeVisible();
      await capture('pieza-mover');
    });

    await test.step('Editor de combo, materiales y contador', async () => {
      await visit('/combos');
      await page
        .getByRole('button', { name: /^Acciones de / })
        .first()
        .click();
      await page.getByRole('button', { name: 'Editar combo', exact: true }).first().click();
      await expect(page.getByLabel('Nombre del combo', { exact: true })).toBeVisible();
      await capture('combo-editor');
      await page.getByRole('button', { name: 'Material', exact: true }).click();
      await expect(page.getByRole('heading', { name: 'Material', exact: true })).toBeVisible();
      await capture('combo-selector-material');
    });

    await test.step('Detalle con fotos, incidencias y coordenadas manuales', async () => {
      await visit('/obra/obra_1');
      await page.getByRole('button', { name: 'Fotos', exact: true }).click();
      await expect(page.getByRole('button', { name: 'Elegir foto', exact: true })).toBeVisible();
      await capture('detalle-fotos');
      await page.getByRole('button', { name: 'Faltantes y recuperaciones', exact: true }).click();
      await expect(page.getByText('Sin faltantes registrados.', { exact: true })).toBeVisible();
      await capture('detalle-incidencias');
      await page.getByRole('button', { name: 'Más acciones', exact: true }).click();
      await page.getByRole('button', { name: 'Con faltante', exact: true }).click();
      await page.getByRole('button', { name: 'Agregar faltante', exact: true }).click();
      await expect(page.getByRole('button', { name: 'Dañado', exact: true })).toBeVisible();
      await capture('incidencia-editor');
      await visit('/obra/obra_1');
      await page.getByRole('button', { name: 'Más acciones', exact: true }).click();
      await page.getByRole('button', { name: 'Ubicación', exact: true }).click();
      await expect(page.getByLabel('Latitud', { exact: true })).toBeVisible();
      await expect(page.getByLabel('Longitud', { exact: true })).toBeVisible();
      await capture('ubicacion-editor');
    });

    await test.step('Revisión JSON real validada y cancelación sin reemplazar datos', async () => {
      await visit('/configuracion');
      await page.getByRole('button', { name: 'Copias y restauración', exact: true }).click();
      const raw = await readFile('tests/fixtures/whatsapp-five.json');
      const chooser = page.waitForEvent('filechooser');
      await page.getByRole('button', { name: 'Elegir copia', exact: true }).click();
      await (
        await chooser
      ).setFiles({
        name: 'copia-sintetica-validacion.json',
        mimeType: 'application/json',
        buffer: raw,
      });
      await expect(
        page.getByText('Archivo validado: 5 alquileres y 10 materiales.', { exact: true }),
      ).toBeVisible();
      await expect(
        page.getByRole('button', { name: 'Confirmar importación', exact: true }),
      ).toBeVisible();
      await capture('json-revision-confirmacion');
      await page.getByRole('button', { name: 'Cancelar importación', exact: true }).click();
      const after = await page.evaluate(
        () => JSON.parse(localStorage.getItem('chema:demo:v1')!).state,
      );
      expect(after).toEqual(before);
    });

    await test.step('Los cuatro pasos de bienvenida accesibles desde Ajustes', async () => {
      await closeUnchangedPanel();
      await page.getByRole('button', { name: 'Ver bienvenida', exact: true }).click();
      for (const [index, heading] of [
        'Tus alquileres, en un lugar',
        'Prepará la entrega',
        'Organizá el viaje',
        'Cerrá cada movimiento',
      ].entries()) {
        await expect(page.getByRole('heading', { name: heading, exact: true })).toBeVisible();
        await capture(`bienvenida-${index + 1}`);
        await page
          .getByRole('button', { name: index === 3 ? 'Empezar' : 'Siguiente', exact: true })
          .click();
      }
    });
    await writeFile(
      `artifacts/validacion/estructura-superficies-${theme}.json`,
      JSON.stringify(
        {
          environment:
            'Chromium web, fixture sintético, 390×844, movimiento reducido; no prueba de Android físico, permisos ni cámara.',
          captures,
        },
        null,
        2,
      ),
    );
  });
}
