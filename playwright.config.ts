import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: 'tests/ui',
  outputDir: 'artifacts/playwright',
  timeout: 60000,
  use: {
    baseURL: 'http://127.0.0.1:8081',
    headless: true,
    launchOptions: {
      ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}),
      args: ['--no-sandbox', ...(process.env.HTTPS_PROXY ? ['--ignore-certificate-errors'] : [])],
      // En entornos con proxy saliente (CI/nube) el navegador necesita usarlo para llegar al backend.
      ...(process.env.HTTPS_PROXY
        ? { proxy: { server: process.env.HTTPS_PROXY, bypass: 'localhost,127.0.0.1' } }
        : {}),
    },
    screenshot: 'only-on-failure',
  },
  reporter: 'list',
});
