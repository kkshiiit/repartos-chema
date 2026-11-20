// Arma las notas del Release con la sección de la versión en docs/CAMBIOS.md y el SHA-256 del APK.
import { readFileSync } from 'node:fs';
const [version, sha] = process.argv.slice(2);
const text = readFileSync(new URL('../docs/CAMBIOS.md', import.meta.url), 'utf8');
const start = text.indexOf(`## ${version} `);
let body = 'Nueva versión de Chema Andamios.';
if (start >= 0) {
  const rest = text.slice(start);
  const next = rest.indexOf('\n## ', 3);
  body = (next > 0 ? rest.slice(0, next) : rest).split('\n').slice(1).join('\n').trim();
}
console.log(`${body}

Se instala encima de la versión anterior, sin desinstalar.

SHA-256: \`${sha}\``);
