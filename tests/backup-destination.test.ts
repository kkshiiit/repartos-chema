import { it, expect, vi, beforeEach } from 'vitest';
import { saveBackupToDestination } from '../src/services/files';
const state = vi.hoisted(() => ({
  cancel: false,
  corrupt: false,
  files: new Map<string, Uint8Array>(),
}));
vi.mock('react-native', () => ({ Platform: { OS: 'android' } }));
vi.mock('expo-sharing', () => ({}));
vi.mock('expo-document-picker', () => ({}));
vi.mock('expo-file-system', () => ({
  Paths: { cache: 'cache' },
  Directory: class {
    static async pickDirectoryAsync() {
      if (state.cancel) throw { code: 'ERR_CANCELED' };
      return new this();
    }
    createFile(name: string) {
      const uri = 'content://destination/' + name;
      return {
        uri,
        write: (bytes: Uint8Array) => state.files.set(uri, bytes),
        bytes: async () => (state.corrupt ? new Uint8Array([0]) : state.files.get(uri)),
      };
    }
  },
  File: class {},
}));
beforeEach(() => {
  state.cancel = false;
  state.corrupt = false;
  state.files.clear();
});
it('verifica los bytes escritos en un destino externo antes de confirmar copia', async () => {
  const result = await saveBackupToDestination(new Uint8Array([1, 2, 3]));
  expect(result.saved).toBe(true);
  expect(result.uri).toMatch(/^content:/);
  expect([...state.files.values()][0]).toEqual(new Uint8Array([1, 2, 3]));
});
it('cancelar destino no crea archivos ni declara copia guardada', async () => {
  state.cancel = true;
  expect((await saveBackupToDestination(new Uint8Array([1]))).saved).toBe(false);
  expect(state.files.size).toBe(0);
});
it('rechaza una escritura truncada en lugar de autorizar vaciado', async () => {
  state.corrupt = true;
  await expect(saveBackupToDestination(new Uint8Array([1, 2, 3]))).rejects.toThrow(
    /verificar|incompleta/,
  );
});
