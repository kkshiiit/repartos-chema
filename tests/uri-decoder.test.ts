import { it, expect } from 'vitest';
import { createRequire } from 'node:module';
import { Worker } from 'node:worker_threads';
const require = createRequire(createRequire(import.meta.url).resolve('query-string'));
it('conserva API CommonJS y decodificación de direcciones en español', () => {
  const decode = require('decode-uri-component');
  expect(typeof decode).toBe('function');
  expect(decode('San%20Mart%C3%ADn')).toBe('San Martín');
  expect(decode('San+Mart%C3%ADn')).toBe('San Martín');
  expect(decode('%')).toBe('%');
  expect(decode('%FE%FF')).toBe('\uFFFD\uFFFD');
});
it('URI malformada larga no desborda pila ni bloquea indefinidamente', async () => {
  const input = '%FF'.repeat(4000);
  const result = await new Promise<string>((resolve, reject) => {
    const worker = new Worker(
      "const {workerData,parentPort}=require('node:worker_threads');try{parentPort.postMessage({value:require(workerData.module)(workerData.input)});}catch(e){parentPort.postMessage({error:String(e)});}parentPort.close();",
      { eval: true, workerData: { module: require.resolve('decode-uri-component'), input } },
    );
    const timer = setTimeout(() => {
      void worker.terminate();
      reject(new Error('El decodificador bloquea una URI malformada'));
    }, 1500);
    worker.on('message', (v) => {
      clearTimeout(timer);
      if (v.error) reject(new Error(v.error));
      else resolve(v.value);
    });
    worker.on('error', (e) => {
      clearTimeout(timer);
      reject(e);
    });
  });
  expect(result).toBe(input);
});
