// Compila el APK de Chema Andamios (ARM64) y verifica paquete, versión y firma.
// Requiere JDK 21 (+ JDK 17 para plugins de Gradle) y ANDROID_HOME con SDK 36, build-tools 36.0.0,
// NDK 27.1.12297006 y CMake 3.22.1. La firma es la del certificado histórico de la app (ver docs/SEGURIDAD.md).
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
const root = resolve(import.meta.dirname, '..');
const EXPECTED_CERT = 'fac61745dc0903786fb9ede62a962b399f7348f0bb6f899b8332667591033b9c';
const sdk = process.env.ANDROID_HOME;
if (!sdk || !existsSync(sdk)) throw new Error('Configurá ANDROID_HOME con el SDK de Android.');
const env = { ...process.env, NODE_ENV: 'production', EXPO_NO_TELEMETRY: '1' };
const run = (cmd, args, cwd = root) => {
  const r = spawnSync(cmd, args, { cwd, env, stdio: 'inherit' });
  if (r.status !== 0) process.exit(r.status || 1);
};
const out = (cmd, args) => spawnSync(cmd, args, { cwd: root, env, encoding: 'utf8' }).stdout || '';
run('npx', ['--no-install', 'expo', 'prebuild', '--platform', 'android', '--no-install']);
run('./gradlew', ['assembleRelease', '-PreactNativeArchitectures=arm64-v8a', '--max-workers=3'], join(root, 'android'));
const apk = join(root, 'android/app/build/outputs/apk/release/app-release.apk');
const tools = join(sdk, 'build-tools/36.0.0');
const certs = out(join(tools, 'apksigner'), ['verify', '--print-certs', apk]);
const badging = out(join(tools, 'aapt2'), ['dump', 'badging', apk]);
const app = JSON.parse(readFileSync(join(root, 'app.json'), 'utf8')).expo;
if (!certs.includes(EXPECTED_CERT)) throw new Error('La firma del APK no coincide con el certificado de la app.');
if (!badging.includes(`name='${app.android.package}'`) || !badging.includes(`versionName='${app.version}'`))
  throw new Error('Paquete o versión inesperados en el APK.');
console.log(`APK verificado: ${apk}\n${app.android.package} ${app.version} (code ${app.android.versionCode})`);
