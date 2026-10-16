import { readFileSync } from 'node:fs';
import { expect, it, vi } from 'vitest';
import { prepareRestore } from '../src/services/backupService';
import { parseEnvelope } from '../src/data/validation';
import { Repository, type KeyValueStorage } from '../src/data/repository';
import { seed, demoProfile } from '../src/data/seed';
vi.mock('../src/services/photoCache', () => ({ storePhoto: vi.fn(), photoBytes: vi.fn() }));
vi.mock('../src/services/files', () => ({ saveFile: vi.fn() }));
const raw = readFileSync(new URL('./fixtures/whatsapp-five.json', import.meta.url), 'utf8');
class Storage implements KeyValueStorage {
  data = new Map<string, string>();
  fail = '';
  async getItem(key: string) {
    return this.data.get(key) ?? null;
  }
  async setItem(key: string, value: string) {
    if (this.fail && key.includes(this.fail)) throw new Error('Sin espacio');
    this.data.set(key, value);
  }
}
it('el JSON real contiene cinco alquileres válidos y persiste al reabrir', async () => {
  const storage = new Storage();
  const repo = new Repository(storage, 'inventory', seed);
  const original = await repo.load();
  await repo.restoreDemo(await prepareRestore(raw), demoProfile('ADMIN'));
  const reopened = new Repository(storage, 'inventory', seed);
  expect((await reopened.load()).state.obras.map((o) => o.clienteNombre)).toEqual([
    'Igancio',
    'Carina',
    'Padre Ashkar (sin nombre de cliente)',
    'Instituto Santa Ana',
    'Carlos',
  ]);
  expect(
    [...storage.data.entries()].some(
      ([k, v]) => k.includes('before-restore') && JSON.stringify(original) === v,
    ),
  ).toBe(true);
});
it('acepta un JSON UTF-8 con BOM que entregan algunos gestores Android', async () => {
  expect(parseEnvelope(await prepareRestore('\uFEFF' + raw)).state.obras).toHaveLength(5);
});
it('un JSON truncado muestra un error legible y no modifica el inventario', async () => {
  const storage = new Storage();
  const repo = new Repository(storage, 'inventory', seed);
  const original = await repo.load();
  await expect(prepareRestore('{"format":')).rejects.toThrow(/JSON.*incompleto|JSON.*válido/i);
  expect(await repo.load()).toEqual(original);
});
it('si falla archivar el original no confirma la restauración', async () => {
  const storage = new Storage();
  const repo = new Repository(storage, 'inventory', seed);
  const original = await repo.load();
  storage.fail = 'before-restore';
  await expect(repo.restoreDemo(await prepareRestore(raw), demoProfile('ADMIN'))).rejects.toThrow(
    'Sin espacio',
  );
  expect(await repo.load()).toEqual(original);
});
it('permite deshacer una importación después de reiniciar sin perder los cinco pedidos archivados', async () => {
  const storage = new Storage();
  const repo = new Repository(storage, 'inventory', seed);
  const original = await repo.load();
  await repo.restoreDemo(await prepareRestore(raw), demoProfile('ADMIN'));
  const reopened = new Repository(storage, 'inventory', seed);
  await reopened.load();
  expect(await reopened.undoRestore(demoProfile('ADMIN'))).toEqual(original);
  expect(
    [...storage.data.values()].some((v) => {
      try {
        return JSON.parse(v).state?.obras?.length === 5;
      } catch {
        return false;
      }
    }),
  ).toBe(true);
});
