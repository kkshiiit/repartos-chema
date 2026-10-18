import { test, expect, type Page } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { seed } from '../../src/data/seed';
import { login } from './helpers';

const now = new Date('2026-10-18T15:00:00Z');
const output = 'artifacts/capturas/estructura-1.5';
async function fixture(page: Page, theme: string) {
  const state = seed(now);
  const clients = [
    'Obra San Martín',
    'Obra Ballester',
    'Obra Suárez',
    'Obra Mitre',
    'Obra Italia',
    'Obra Los Aromos',
  ];
  state.obras.forEach((o, i) => {
    o.clienteNombre = clients[i];
    o.direccion = `Dirección de prueba ${i + 1}`;
    o.clienteTelefono = '';
    delete o.coordenadas;
  });
  state.logs = [0, 1, 2, 3].map((n) => ({
    id: `visual_log_${n}`,
    operationId: `visual_op_${n}`,
    timestamp: `2026-10-17T${18 - n}:30:00Z`,
    usuarioUid: 'fixture',
    usuarioNombre: n % 2 ? 'Ana de prueba' : 'Juan de prueba',
    accion: n % 2 ? 'Retiro registrado' : 'Entrega registrada',
    obraId: state.obras[n].id,
    obraNombre: clients[n],
    movimientos: [
      {
        materialId: 'marco130',
        materialNombre: 'Marco de andamio',
        cantidad: 4,
        origen: n % 2 ? `obra:${state.obras[n].id}` : 'galpon',
        destino: n % 2 ? 'galpon' : `obra:${state.obras[n].id}`,
        motivo: 'Movimiento sintético para comparación visual',
      },
    ],
  }));
  await page.clock.setFixedTime(now);
  await page.addInitScript(
    ({ state, theme }) => {
      if (!localStorage.getItem('chema:demo:v1'))
        localStorage.setItem(
          'chema:demo:v1',
          JSON.stringify({ schema: 1, state, confirmed: state, queue: [] }),
        );
      localStorage.setItem('chema:theme:v1', theme);
    },
    { state, theme },
  );
  await login(page, 'Juan de prueba');
}

for (const theme of ['light', 'dark'])
  test(`comparación estructural ${theme}`, async ({ page }) => {
    await mkdir(output, { recursive: true });
    await page.setViewportSize({ width: 430, height: 840 });
    await fixture(page, theme);
    const baseline = process.env.CHEMA_CAPTURE_BASELINE === 'true';
    const measurements: object[] = [];
    const routes = baseline
      ? [
          ['/', 'alquileres'],
          ['/galpon', 'deposito'],
          ['/mapa', 'viaje'],
          ['/historial', 'historial'],
        ]
      : [
          ['/', 'alquileres'],
          ['/galpon', 'deposito'],
          ['/mapa', 'viaje'],
          ['/historial', 'historial'],
          ['/obra/obra_1', 'detalle'],
          ['/obra/nueva', 'nuevo'],
          ['/configuracion', 'ajustes'],
          ['/combos', 'combos'],
          ['/exportar', 'documentos'],
        ];
    for (const [route, name] of routes) {
      await page.goto(route);
      await expect(page.getByRole('heading').first()).toBeVisible();
      await page.screenshot({
        path: `${output}/${baseline ? 'antes' : 'despues'}-${name}-${theme}.png`,
      });
      if (!baseline && name === 'alquileres') {
        const rows = page.getByRole('button', { name: /^Abrir Obra/ });
        await expect(rows).toHaveCount(6);
        const boxes = await rows.evaluateAll((els) =>
          els.map((e) => {
            const b = e.getBoundingClientRect();
            return { top: b.top, height: b.height, width: b.width };
          }),
        );
        expect(boxes[0].height).toBeLessThan(145);
        expect(boxes[0].top).toBeLessThan(340);
        expect(boxes.filter((b) => b.top + b.height < 700).length).toBeGreaterThanOrEqual(3);
        expect(await page.getByRole('button', { name: 'GPS', exact: true }).count()).toBe(0);
        await page.getByRole('button', { name: 'Filtros', exact: true }).click();
        await expect(page.getByRole('button', { name: 'Zona', exact: true })).toBeVisible();
        await page.screenshot({ path: `${output}/despues-filtros-${theme}.png` });
        await page.getByRole('button', { name: 'Cerrar', exact: true }).last().click();
        measurements.push({ screen: name, boxes });
      }
      if (!baseline && name === 'historial') {
        await page.getByRole('button', { name: 'Filtrar historial', exact: true }).click();
        await expect(page.getByRole('button', { name: 'Usuario', exact: true })).toBeVisible();
        await page.screenshot({ path: `${output}/despues-filtros-historial-${theme}.png` });
      }
    }
    if (!baseline)
      await writeFile(
        `artifacts/validacion/estructura-${theme}.json`,
        JSON.stringify(measurements, null, 2),
      );
  });
