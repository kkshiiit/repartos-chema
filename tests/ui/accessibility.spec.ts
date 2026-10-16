import { login } from './helpers';
import { test, expect } from '@playwright/test';
import { AxeBuilder } from '@axe-core/playwright';
import { mkdir, writeFile } from 'node:fs/promises';
for (const theme of ['light', 'dark'] as const) {
  test(`accesibilidad automatizada WCAG AA ${theme}`, async ({ page }) => {
    test.setTimeout(180000);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.emulateMedia({ colorScheme: theme });
    await login(page);
    const reports = [];
    for (const route of [
      '/',
      '/galpon',
      '/mapa',
      '/historial',
      '/obra/nueva',
      '/obra/obra_1',
      '/configuracion',
      '/exportar',
    ]) {
      await page.goto(route);
      await expect(page.getByRole('heading').first()).toBeVisible();
      const result = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();
      reports.push({
        route,
        violations: result.violations,
        incomplete: result.incomplete.map((i) => ({ id: i.id, nodes: i.nodes.length })),
      });
    }
    await mkdir('artifacts/validacion', { recursive: true });
    await writeFile(`artifacts/validacion/axe-${theme}.json`, JSON.stringify(reports, null, 2));
    expect(
      reports.flatMap((r) =>
        r.violations.map((v) => ({
          route: r.route,
          id: v.id,
          impact: v.impact,
          nodes: v.nodes.map((n) => n.target),
        })),
      ),
    ).toEqual([]);
  });
}
