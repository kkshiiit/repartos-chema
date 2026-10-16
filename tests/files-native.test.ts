import { it, expect, vi, beforeEach } from 'vitest';
const files = vi.hoisted(() => new Map<string, Uint8Array>());
vi.mock('react-native', () => ({ Platform: { OS: 'android' } }));
vi.mock('expo-file-system', () => ({
  Paths: { cache: 'file:///cache' },
  File: class {
    uri: string;
    constructor(base: string, name: string) {
      this.uri = base + '/' + name;
    }
    create(options: { overwrite?: boolean }) {
      if (files.has(this.uri) && !options.overwrite) throw new Error('Ya existe');
      files.set(this.uri, new Uint8Array());
    }
    write(data: Uint8Array) {
      files.set(this.uri, new Uint8Array(data));
    }
  },
}));
vi.mock('expo-sharing', () => ({
  isAvailableAsync: async () => true,
  shareAsync: async () => undefined,
}));
vi.mock('expo-document-picker', () => ({ getDocumentAsync: async () => ({ canceled: true }) }));
import { saveFile } from '../src/services/files';
beforeEach(() => files.clear());
it('dos copias nativas conservan ambos archivos aunque se compartan en el mismo milisegundo', async () => {
  const clock = vi.spyOn(Date, 'now').mockReturnValue(1000);
  try {
    await saveFile('chema-copia.json', new Uint8Array([1]), 'application/json');
    await saveFile('chema-copia.json', new Uint8Array([2]), 'application/json');
    expect(files.size).toBe(2);
    expect([...files.values()].map((b) => b[0])).toEqual([1, 2]);
  } finally {
    clock.mockRestore();
  }
});
