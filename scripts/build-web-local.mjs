// Reproducible individual edition: no cloud configuration is inherited into the worker.
import { spawnSync } from 'node:child_process';
const env = {
  ...process.env,
  EXPO_PUBLIC_LOCAL_ONLY: 'true',
  EXPO_PUBLIC_DATA_MODE: 'demo',
  EXPO_NO_TELEMETRY: '1',
};
for (const key of Object.keys(env)) if (key.startsWith('EXPO_PUBLIC_FIREBASE_')) delete env[key];
for (const [command, args] of [
  ['npx', ['--no-install', 'expo', 'export', '--platform', 'web', '--clear']],
  ['node', ['scripts/build-workers.mjs']],
]) {
  const result = spawnSync(command, args, {
    env,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });
  if (result.status !== 0) process.exit(result.status || 1);
}
