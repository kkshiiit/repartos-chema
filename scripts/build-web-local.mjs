// Exporta la versión web (sólo para pruebas en navegador) en dist/.
import { spawnSync } from 'node:child_process';
const env = { ...process.env, EXPO_NO_TELEMETRY: '1' };
const result = spawnSync('npx', ['--no-install', 'expo', 'export', '--platform', 'web', '--clear'], {
  env,
  stdio: 'inherit',
  shell: process.platform === 'win32',
});
process.exit(result.status ?? 1);
