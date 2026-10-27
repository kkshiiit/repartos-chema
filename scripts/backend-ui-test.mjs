// Sólo identidades sintéticas ya creadas por backend-remote-test; nunca registrar credenciales ni trazas.
import { chromium } from '@playwright/test';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
const qa = JSON.parse(
  readFileSync(process.env.CHEMA_REMOTE_QA_FILE || '/tmp/chema-remote-qa-private.json', 'utf8'),
);
if (!/^chema-qa-[a-f0-9]+@example\.invalid$/.test(qa.email) || !qa.completed)
  throw Error('QA no validada');
const browser = await chromium.launch({
  executablePath: '/usr/bin/chromium',
  args: ['--no-sandbox'],
});
const evidence = 'artifacts/capturas/maestro-etapa2/equipo';
mkdirSync(evidence, { recursive: true });
let stage = 'inicio',
  passed = 0;
try {
  for (const [email, theme] of [
    [qa.email, 'dark'],
    [qa.email2, 'light'],
  ]) {
    stage = `acceso-${theme}`;
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    await context.addInitScript((theme) => {
      localStorage.setItem('chema:welcome:v2', 'done');
      localStorage.setItem('chema:theme:v1', theme);
    }, theme);
    const page = await context.newPage();
    await page.goto('http://127.0.0.1:8081/equipo/conectar');
    await page.getByLabel('Correo de acceso', { exact: true }).fill(email);
    await page.getByLabel('Contraseña del equipo', { exact: true }).fill(qa.password);
    await page.getByRole('button', { name: 'Entrar al equipo', exact: true }).click();
    await page
      .getByRole('heading', { name: 'Alquileres', exact: true })
      .waitFor({ timeout: 35000 });
    await page.getByText('Confirmado por el equipo', { exact: true }).waitFor({ timeout: 35000 });
    const rows = await page.getByRole('button', { name: /^Abrir Cliente sintético/ }).count();
    if (rows !== 3) throw Error('ALQUILERES_NO_COINCIDEN');
    await page.screenshot({ path: `${evidence}/${theme}-alquileres.png`, fullPage: true });
    console.log(`PASS ${theme}: Auth real + tres alquileres del mismo equipo`);
    passed++;
    if (
      theme === 'light' &&
      (await page.getByRole('button', { name: 'Nuevo alquiler', exact: true }).count())
    )
      throw Error('OPERADOR_ALTA_RESERVADA');
    await page.getByRole('button', { name: 'Abrir ajustes', exact: true }).click();
    await page.screenshot({ path: `${evidence}/${theme}-ajustes.png`, fullPage: true });
    await context.close();
  }
  writeFileSync(
    `${process.env.CHEMA_QA_EVIDENCE_DIR || 'docs/evidencias-etapa2'}/ui-equipo-real.json`,
    JSON.stringify(
      {
        dateUTC: new Date().toISOString(),
        environment: 'Chromium web, dos contextos y Auth/Edge/SQL reales sintéticos',
        passed,
        failed: 0,
        physicalAndroid: false,
      },
      null,
      2,
    ) + '\n',
  );
} catch (error) {
  // No Playwright call log: podría incluir el valor de un campo de contraseña.
  console.error(`FAIL ${stage}: flujo no completado; sin volcar credenciales ni trazas`);
  writeFileSync('/tmp/chema-stage2/ui-equipo-error.txt', String(error), { mode: 0o600 });
  process.exitCode = 1;
} finally {
  await browser.close();
}
