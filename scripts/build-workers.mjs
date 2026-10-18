import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import { parseEnv } from 'node:util';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { build } from 'esbuild';
let local = {};
for (const name of ['.env', '.env.local'])
  try {
    Object.assign(local, parseEnv(await readFile(name, 'utf8')));
  } catch {}
const env = { ...local, ...process.env };
const mapping = {
  apiKey: 'API_KEY',
  authDomain: 'AUTH_DOMAIN',
  projectId: 'PROJECT_ID',
  storageBucket: 'STORAGE_BUCKET',
  messagingSenderId: 'MESSAGING_SENDER_ID',
  appId: 'APP_ID',
};
const config = Object.fromEntries(
  Object.entries(mapping).map(([k, v]) => [k, env.EXPO_PUBLIC_LOCAL_ONLY === 'true' ? '' : env[`EXPO_PUBLIC_FIREBASE_${v}`] || '']),
);
await mkdir('dist', { recursive: true });
await build({
  entryPoints: ['src/workers/firebase-messaging-sw.ts'],
  outfile: 'dist/firebase-messaging-sw.js',
  bundle: true,
  minify: true,
  platform: 'browser',
  define: { __FIREBASE_CONFIG__: JSON.stringify(config) },
});
async function walk(dir) {
  let files = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(path)));
    else files.push('/' + path.slice(5));
  }
  return files;
}
const files = (await walk('dist')).filter(
  (f) => f !== '/sw.js' && f !== '/firebase-messaging-sw.js',
);
const contentHash = createHash('sha256');
for(const file of files) contentHash.update(file).update(await readFile('dist'+file));
const version = contentHash.digest('hex').slice(0,12);
const worker = `const CACHE='chema-${version}';const FILES=${JSON.stringify(files)};
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('chema-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{const u=new URL(e.request.url);if(e.request.method!=='GET'||u.origin!==self.location.origin||u.pathname.includes('firebase-messaging'))return;if(e.request.mode==='navigate'){e.respondWith(fetch(e.request).catch(()=>caches.match('/index.html')));return;}if(FILES.includes(u.pathname))e.respondWith(caches.match(e.request).then(c=>c||fetch(e.request)));});`;
await writeFile('dist/sw.js', worker);
let html = await readFile('dist/index.html', 'utf8');
html = html.replace(
  '</body>',
  `<script>if('serviceWorker' in navigator){window.addEventListener('load',()=>navigator.serviceWorker.register('/sw.js').catch(()=>{}));}</script></body>`,
);
await writeFile('dist/index.html', html);
console.log(
  'Worker offline generado. FCM: ' +
    (Object.values(config).every(Boolean)
      ? 'configuración pública incluida, requiere verificación'
      : 'sin configuración; no activado'),
);
