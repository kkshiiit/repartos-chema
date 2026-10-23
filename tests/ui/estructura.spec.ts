import { test, expect, type Page } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { seed } from '../../src/data/seed';
import { login } from './helpers';

const now = new Date('2026-10-18T15:00:00Z');
const output = 'artifacts/capturas/estructura-1.5';
async function fixture(page: Page, theme: string, reference = false) {
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
  if (reference) {
    state.materiales = state.materiales.filter((m) => ['marco130', 'tablon'].includes(m.id));
    state.obras = [state.obras[1], state.obras[0], state.obras[3]];
    const names = ['Obra Ballester', 'Obra San Martín', 'Obra Suárez'];
    const zones = ['Villa Ballester', 'San Martín', 'Villa Ballester'];
    state.obras.forEach((o, i) => {
      const amount = [8, 6, 2][i];
      o.clienteNombre = names[i];
      o.fechaEntrega = '2026-10-14';
      o.localidadBarrio = zones[i];
      o.fechaRetiroEstimada = ['2026-10-18', '2026-10-17', '2026-10-21'][i];
      o.materialesCargados = o.materialesCargados
        .filter((m) => ['marco130', 'tablon'].includes(m.materialId))
        .map((m) => ({
          ...m,
          cantidad: m.materialId === 'marco130' ? amount : amount / 2,
          apodo: undefined,
        }));
      o.saldosEnObra = Object.fromEntries(
        o.materialesCargados.map((m) => [m.materialId, m.cantidad]),
      );
    });
    state.materiales.forEach((m) => {
      m.cantidadGalpon = m.id === 'marco130' ? 24 : 16;
      m.cantidadEnObra = m.id === 'marco130' ? 16 : 8;
    });
    state.combos.forEach((c) => {
      c.items = c.items.filter((i) => ['marco130', 'tablon'].includes(i.materialId));
    });
    state.logs = state.logs.slice(0, 2);
    state.logs[0].accion = 'Retiro registrado';
    state.logs[0].obraNombre = 'Obra Centro';
    state.logs[1].accion = 'Entrega registrada';
    state.logs[1].obraNombre = 'Obra Norte';
    state.logs.forEach((l, i) => {
      l.usuarioNombre = 'Fabián';
      l.timestamp = i ? '2026-10-17T19:37:00Z' : '2026-10-17T13:24:00Z';
      l.movimientos[0].cantidad = i ? 6 : 8;
      l.movimientos.push({
        ...l.movimientos[0],
        materialId: 'tablon',
        materialNombre: 'Tablón metálico',
        cantidad: i ? 3 : 4,
      });
    });
  }
  await page.emulateMedia({
    reducedMotion: 'reduce',
    colorScheme: theme === 'dark' ? 'dark' : 'light',
  });
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
    { state, theme: reference ? 'system' : theme },
  );
  await login(page, reference ? 'Fabián' : 'Juan de prueba');
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

// Match each illustrated phone's crop dimensions without stretching either image.
for (const theme of ['light', 'dark'])
  test(`láminas de referencia ${theme}: mismas dimensiones y fixture`, async ({ page }) => {
    await mkdir(output, { recursive: true });
    await page.setViewportSize({ width: 444, height: 862 });
    await fixture(page, theme, true);
    const frames = [
      ['/', 'alquileres', 444, 862],
      ['/galpon', 'deposito', 446, 881],
      ['/mapa', 'viaje', 445, 812],
      ['/historial', 'historial', 446, 795],
      ['/obra/obra_2', 'detalle', 413, 934],
      ['/obra/nueva', 'nuevo', 424, 934],
      ['/obra/nueva', 'carga', 413, 902],
      ['/obra/obra_2', 'retiro', 424, 902],
      ['/configuracion', 'ajustes', 419, 994],
      ['/combos', 'combos', 420, 994],
      ['/exportar', 'documentos', 419, 836],
    ] as const;
    for (const [route, name, width, height] of frames) {
      await page.setViewportSize({ width, height });
      await page.goto(route);
      await expect(page.getByRole('heading').first()).toBeVisible();
      if (name === 'nuevo' || name === 'carga') {
        await page.getByLabel('Nombre del cliente', { exact: true }).fill('Obra Suárez');
        await page.getByLabel('Barrio / localidad', { exact: true }).fill('José León Suárez');
        await page.getByLabel('Alquilado hasta', { exact: true }).fill('2026-10-21');
      }
      if (name === 'carga') {
        await page.getByLabel('Dirección', { exact: true }).fill('Dirección de prueba 3');
        await page.getByRole('button', { name: 'Continuar a carga', exact: true }).click();
        await page.getByRole('button', { name: 'Usar combo', exact: true }).click();
        await page.getByRole('button', { name: 'Cargar combo', exact: true }).click();
        await page.getByRole('button', { name: 'Combo Torre 1.30m', exact: true }).click();
        await page.getByRole('button', { name: 'Revisar combo', exact: true }).click();
        await expect(
          page.getByRole('button', { name: 'Agregar materiales', exact: true }),
        ).toHaveAttribute('aria-expanded', 'false');
        const decrease = page.getByRole('button', { name: /^Reducir / });
        await decrease.nth(0).click();
        await decrease.nth(0).click();
        await decrease.nth(1).click();
      }
      if (name === 'retiro') {
        await page.getByRole('button', { name: 'Registrar retiro', exact: true }).click();
        await page.getByRole('button', { name: 'Fabián', exact: true }).click();
      }
      await page.screenshot({ path: `${output}/referencia-app-${name}-${theme}.png` });
    }
  });
