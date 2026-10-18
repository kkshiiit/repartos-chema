import { loginSynthetic as login } from './helpers';
import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
test('foto local, copia descargada y restauración sobreviven al reinicio', async ({ page }) => {
  await login(page);
  await page.goto('/obra/obra_1');
  await page.getByRole('button',{name:'Fotos',exact:true}).click();
  const photo = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: 'Elegir foto', exact: true }).click();
  await (await photo).setFiles('artifacts/dashboard-mobile.png');
  await expect(page.getByLabel('Foto de materiales de la obra')).toBeVisible();
  const before = await page.evaluate(
    () => JSON.parse(localStorage.getItem('chema:demo:v1')!).state,
  );
  expect(before.obras[0].fotos[0].uri).toMatch(/^chema-photo:/);
  expect(JSON.stringify(before)).not.toContain('data:image');
  await page.reload();
  await page.getByRole('button',{name:'Fotos',exact:true}).click();
  await expect(page.getByLabel('Foto de materiales de la obra')).toBeVisible();
  await page.goto('/configuracion');
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Descargar copia', exact: true }).click();
  const copy = await download;
  const path = (await copy.path())!;
  const contents = JSON.parse(await readFile(path, 'utf8'));
  expect(contents.photos[before.obras[0].fotos[0].id].length).toBeGreaterThan(100);
  const choose = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: 'Elegir copia', exact: true }).click();
  await (
    await choose
  ).setFiles({ name: 'copia.json', mimeType: 'application/json', buffer: await readFile(path) });
  await page.getByRole('button', { name: 'Confirmar importación', exact: true }).click();
  await expect(page.getByText(/Importación completada/)).toBeVisible();
  await page.goto('/obra/obra_1');
  await page.reload();
  await page.getByRole('button',{name:'Fotos',exact:true}).click();
  await expect(page.getByLabel('Foto de materiales de la obra')).toBeVisible();
  const after = await page.evaluate(() => JSON.parse(localStorage.getItem('chema:demo:v1')!).state);
  expect(after.materiales).toEqual(before.materiales);
  expect(after.obras[0].fotos[0].id).not.toBe(before.obras[0].fotos[0].id);
  expect(
    await page.evaluate(() => Object.keys(localStorage).some((k) => k.includes('before-restore'))),
  ).toBe(true);
});

test('borrar foto activa no rompe una recuperación interna retenida', async ({ page }) => {
  await login(page);
  await page.goto('/obra/obra_1');
  await page.getByRole('button',{name:'Fotos',exact:true}).click();
  const picker = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: 'Elegir foto', exact: true }).click();
  await (await picker).setFiles('tests/fixtures/foto-sintetica.jpg');
  await expect(page.getByLabel('Foto de materiales de la obra')).toBeVisible();
  await page.goto('/configuracion');
  const pending = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Descargar copia', exact: true }).click();
  const raw = await readFile((await (await pending).path())!);
  const choose = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: 'Elegir copia', exact: true }).click();
  await (await choose).setFiles({ name: 'copia.json', mimeType: 'application/json', buffer: raw });
  await page.getByRole('button', { name: 'Confirmar importación', exact: true }).click();
  await page.getByRole('button', { name: 'Deshacer última importación', exact: true }).click();
  await page.getByRole('button', { name: 'Confirmar', exact: true }).click();
  await page.goto('/obra/obra_1');
  await page.getByRole('button',{name:'Fotos',exact:true}).click();
  await page.getByRole('button', { name: 'Borrar foto', exact: true }).click();
  await page.getByRole('button', { name: 'Confirmar', exact: true }).click();
  await expect(page.getByLabel('Foto de materiales de la obra')).toHaveCount(0);
  await page.goto('/configuracion');
  await page.getByRole('button', { name: 'Deshacer última importación', exact: true }).click();
  await page.getByRole('button', { name: 'Confirmar', exact: true }).click();
  await page.goto('/obra/obra_1');
  await page.getByRole('button',{name:'Fotos',exact:true}).click();
  const image = page.getByLabel('Foto de materiales de la obra');
  await expect(image).toBeVisible();
  await expect
    .poll(() =>
      image.evaluate((el) => {
        const img = el.tagName === 'IMG' ? el : el.querySelector('img');
        return (img as HTMLImageElement | null)?.naturalWidth || 0;
      }),
    )
    .toBeGreaterThan(0);
});
