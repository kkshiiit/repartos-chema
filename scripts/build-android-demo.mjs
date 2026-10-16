// APK interno ARM64. Requiere JDK (no solo JRE) y Android SDK instalados.
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve, join } from 'node:path';
const root = resolve(import.meta.dirname, '..');
const javac = process.env.JAVA_HOME ? join(process.env.JAVA_HOME, 'bin', 'javac') : 'javac';
if (spawnSync(javac, ['-version'], { stdio: 'pipe' }).status !== 0)
  throw new Error('Falta javac. Configura JAVA_HOME con un JDK 21 completo.');
if (!process.env.ANDROID_HOME || !existsSync(process.env.ANDROID_HOME))
  throw new Error('Configura ANDROID_HOME con el SDK Android.');
const env = {
  ...process.env,
  EXPO_PUBLIC_DATA_MODE: 'demo',
  EXPO_PUBLIC_LOCAL_ONLY: 'true',
  NODE_ENV: 'production',
  EXPO_NO_TELEMETRY: '1',
};
function run(command, args, cwd = root) {
  const result = spawnSync(command, args, { cwd, env, stdio: 'inherit' });
  if (result.status !== 0) process.exit(result.status || 1);
}
run('npx', [
  '--no-install',
  'expo',
  'prebuild',
  '--platform',
  'android',
  '--no-install',
  '--skip-dependency-update',
  'react,react-native',
]);
run(
  './gradlew',
  ['assembleRelease', '-PreactNativeArchitectures=arm64-v8a', '--max-workers=2'],
  join(root, 'android'),
);
console.log(
  'APK interno: android/app/build/outputs/apk/release/app-release.apk. Verifica firma y prueba en dispositivo antes de distribuir.',
);
