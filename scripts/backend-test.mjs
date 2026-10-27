import { build } from 'esbuild';
import { spawnSync } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const localEnv = { ...process.env };
for (const key of [
  'DOCKER_HOST',
  'DOCKER_CONTEXT',
  'DOCKER_TLS',
  'DOCKER_TLS_VERIFY',
  'DOCKER_CERT_PATH',
])
  delete localEnv[key];
const container = process.env.CHEMA_PG_TEST_CONTAINER || 'chema-pg-test';
if (!/^[a-zA-Z0-9_-]+$/.test(container))
  throw new Error('Nombre de contenedor de prueba inválido.');
const docker = (args) =>
  spawnSync('docker', ['--host=unix:///var/run/docker.sock', ...args], {
    env: localEnv,
    encoding: 'utf8',
  });
const inspect = docker(['inspect', '--format', '{{.Config.Image}} {{.State.Running}}', container]);
if (inspect.status !== 0) {
  const created = docker([
    'run',
    '-d',
    '--name',
    container,
    '--label',
    'chema.test=true',
    '-e',
    'POSTGRES_HOST_AUTH_METHOD=trust',
    'postgres:17-alpine',
  ]);
  if (created.status !== 0)
    throw new Error('No se pudo iniciar PostgreSQL de prueba: ' + created.stderr);
} else {
  if (!inspect.stdout.startsWith('postgres:17'))
    throw new Error('El nombre apunta a un contenedor ajeno a estas pruebas.');
  if (!inspect.stdout.trim().endsWith('true')) {
    const started = docker(['start', container]);
    if (started.status !== 0)
      throw new Error('No se pudo reanudar PostgreSQL de prueba: ' + started.stderr);
  }
}
let ready = false;
for (let attempt = 0; attempt < 40; attempt++) {
  if (docker(['exec', container, 'pg_isready', '-U', 'postgres']).status === 0) {
    ready = true;
    break;
  }
  await new Promise((resolve) => setTimeout(resolve, 250));
}
if (!ready)
  throw new Error('PostgreSQL de prueba no respondió. No se ejecutaron migraciones comerciales.');
const directory = mkdtempSync(join(tmpdir(), 'chema-shared-pg-')),
  file = join(directory, 'integration.mjs');
await build({
  entryPoints: ['scripts/backend-postgres-test.ts'],
  outfile: file,
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node24',
});
const result = spawnSync(process.execPath, [file], { stdio: 'inherit', env: localEnv });
process.exitCode = result.status ?? 1;
