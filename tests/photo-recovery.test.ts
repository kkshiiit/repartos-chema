import { readFileSync } from 'node:fs';
import { it, expect, vi } from 'vitest';
import { emptyLocalState } from '../src/data/localInitialState';
import { seed } from '../src/data/seed';
import { prepareRestore } from '../src/services/backupService';
const files = vi.hoisted(() => new Map<string, Uint8Array>());
vi.mock('../src/services/photoCache', () => ({
  photoBytes: async (id: string) => files.get(id) || null,
  storePhoto: async (id: string, data: Uint8Array) => {
    files.set(id, data);
    return 'chema-photo:' + id;
  },
}));
vi.mock('../src/services/files', () => ({ saveFile: vi.fn() }));
function copy(encoded?: string, uri = 'chema-photo:old') {
  const state = seed();
  state.obras[0]!.fotos = [{ id: 'old', uri, status: 'PENDING', usuarioUid: 'demo_admin' }];
  return JSON.stringify({
    format: 'chema-backup-v1',
    envelope: { schema: 1, state, confirmed: structuredClone(state), queue: [] },
    photos: encoded ? { old: encoded } : {},
  });
}
it('no acepta referencias remotas sin los bytes de la foto en una copia local', async () => {
  await expect(
    prepareRestore(copy(undefined, 'https://example.invalid/private.jpg')),
  ).rejects.toThrow(/foto|copia/i);
});
it('rechaza base64 que no contiene JPEG antes de guardar fotos', async () => {
  files.clear();
  await expect(prepareRestore(copy('aG9sYQ=='))).rejects.toThrow(/JPEG|foto/i);
  expect(files.size).toBe(0);
});
it('dos importaciones con reloj fijo no sobrescriben fotos de la recuperación anterior', async () => {
  const clock = vi.spyOn(Date, 'now').mockReturnValue(1000);
  files.clear();
  try {
    const raw = copy(
      readFileSync(new URL('./fixtures/foto-sintetica.jpg', import.meta.url)).toString('base64'),
    );
    const a = JSON.parse(await prepareRestore(raw));
    const b = JSON.parse(await prepareRestore(raw));
    expect(a.state.obras[0].fotos[0].id).not.toBe(b.state.obras[0].fotos[0].id);
    expect(files.size).toBe(2);
  } finally {
    clock.mockRestore();
  }
});
it('una copia vacía sin fotos sigue siendo válida', async () => {
  const state = emptyLocalState();
  await expect(
    prepareRestore(
      JSON.stringify({
        format: 'chema-backup-v1',
        envelope: { schema: 1, state, confirmed: state, queue: [] },
        photos: {},
      }),
    ),
  ).resolves.toContain('schema');
});

it('rechaza JPEG truncado sin cabeceras de imagen aunque conserve los marcadores de borde', async () => {
  files.clear();
  await expect(prepareRestore(copy('/9j/2Q=='))).rejects.toThrow(/JPEG|foto/i);
  expect(files.size).toBe(0);
});
