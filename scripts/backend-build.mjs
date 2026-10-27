import { build } from 'esbuild';
await build({
  entryPoints: ['src/shared/server.ts'],
  outfile: 'supabase/functions/chema-api/core.js',
  bundle: true,
  format: 'esm',
  platform: 'neutral',
  target: 'es2022',
  minify: true,
  legalComments: 'eof',
});
console.log('Core compartido generado desde el dominio existente.');
