import { storePhoto, photoBytes } from '../src/services/photoCache';
import { it, expect, vi } from 'vitest';
const files = vi.hoisted(() => new Map<string, Uint8Array>());
const fault = vi.hoisted(() => ({ fail: false }));
vi.mock('expo-file-system', () => ({
  Paths: { document: 'synthetic' },
  File: class {
    uri: string;
    constructor(_path: string, name: string) {
      this.uri = name;
    }
    get exists() {
      return files.has(this.uri);
    }
    create() {
      files.set(this.uri, new Uint8Array());
    }
    write(bytes: Uint8Array) {
      if (fault.fail) {
        fault.fail = false;
        throw new Error('sin espacio');
      }
      files.set(this.uri, new Uint8Array(bytes));
    }
    move(destination: { uri: string }) {
      files.set(destination.uri, files.get(this.uri)!);
      files.delete(this.uri);
      this.uri = destination.uri;
    }
    delete() {
      files.delete(this.uri);
    }
    async bytes() {
      return files.get(this.uri)!;
    }
  },
}));
it('reintento idéntico conserva original y contenido discrepante no lo pisa', async () => {
  const bytes = new Uint8Array([1, 2, 3]);
  await storePhoto('immutable', bytes);
  await expect(storePhoto('immutable', bytes)).resolves.toContain('immutable');
  await expect(storePhoto('immutable', new Uint8Array([3, 2, 1]))).rejects.toThrow(/original/);
  expect(await photoBytes('immutable')).toEqual(bytes);
});

it('escritura nativa incompleta nunca publica un archivo vacío que bloquee recuperar la foto', async () => {
  const bytes = new Uint8Array([4, 5, 6]);
  fault.fail = true;
  await expect(storePhoto('interrupted', bytes)).rejects.toThrow('sin espacio');
  expect(await photoBytes('interrupted')).toBeNull();
  await storePhoto('interrupted', bytes);
  expect(await photoBytes('interrupted')).toEqual(bytes);
});
