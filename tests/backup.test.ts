import { readFileSync } from 'node:fs';
import { beforeEach, expect, it, vi } from 'vitest';
import { seed } from '../src/data/seed';
import { parseEnvelope } from '../src/data/validation';
import { downloadBackup, prepareRestore } from '../src/services/backupService';
const mocks = vi.hoisted(() => ({
  storePhoto: vi.fn(async (id: string) => `chema-photo:${id}`),
  photoBytes: vi.fn(
    async () =>
      new Uint8Array(readFileSync(new URL('./fixtures/foto-sintetica.jpg', import.meta.url))),
  ),
  saveFile: vi.fn(async () => undefined),
}));
vi.mock('../src/services/photoCache', () => mocks);
vi.mock('../src/services/files', () => mocks);
const envelope = () => {
  const state = seed();
  state.obras[0]!.fotos = [
    { id: 'photo_a', uri: 'chema-photo:photo_a', status: 'PENDING', usuarioUid: 'demo_admin' },
  ];
  return { schema: 1, state, confirmed: structuredClone(state), queue: [] };
};
beforeEach(() => vi.clearAllMocks());
it('exporta y restaura inventario y fotos con IDs nuevos sin pisar el original', async () => {
  const original = envelope();
  await downloadBackup(JSON.stringify(original));
  const bytes = (mocks.saveFile.mock.calls[0] as unknown as [string, Uint8Array])[1];
  const restored = parseEnvelope(await prepareRestore(new TextDecoder().decode(bytes)));
  expect(restored.state.materiales).toEqual(original.state.materiales);
  expect(restored.state.obras[0]!.fotos![0]!.id).not.toBe('photo_a');
  expect(restored.state.obras[0]!.fotos![0]!.uri).toBe(
    `chema-photo:${restored.state.obras[0]!.fotos![0]!.id}`,
  );
  expect(original.state.obras[0]!.fotos![0]!.id).toBe('photo_a');
});
it('rechaza una copia incompleta sin sobrescribir fotos existentes', async () => {
  await expect(
    prepareRestore(JSON.stringify({ format: 'chema-backup-v1', envelope: envelope(), photos: {} })),
  ).rejects.toThrow('todas las fotos');
  expect(mocks.storePhoto).not.toHaveBeenCalled();
});
it('exporta datos corruptos intactos para recuperación asistida', async () => {
  await downloadBackup('{datos dañados');
  const call = mocks.saveFile.mock.calls[0] as unknown as [string, Uint8Array];
  expect(call[0]).toBe('chema-datos-para-recuperar.json');
  expect(new TextDecoder().decode(call[1])).toBe('{datos dañados');
});
