import { expect, it, vi } from 'vitest';
import { Repository, type KeyValueStorage } from './helpers/legacyRepository';
import { emptyLocalState } from '../src/data/localInitialState';
import { demoProfile, seed } from '../src/data/seed';
import { saveVerifiedBackup } from '../src/services/backupService';
const mocks = vi.hoisted(() => ({
  saveBackupToDestination: vi.fn(async () => ({ saved: true })),
  photoBytes: vi.fn(async () => null),
  storePhoto: vi.fn(),
}));
vi.mock('../src/services/files', () => mocks);
vi.mock('../src/services/photoCache', () => mocks);
const raw = () => {
  const state = emptyLocalState();
  return JSON.stringify({ schema: 1, state, confirmed: state, queue: [] });
};
it('restaura una copia explícita aunque la inicialización esté bloqueada por base ausente', async () => {
  let recovered = false;
  const missing = Object.assign(new Error('Base desaparecida'), { code: 'LOCAL_DATABASE_MISSING' });
  const storage: KeyValueStorage & {
    restoreMissingDatabase: (key: string, value: string) => Promise<void>;
  } = {
    getItem: async () => {
      if (!recovered) throw missing;
      return raw();
    },
    setItem: async () => {},
    restoreMissingDatabase: async () => {
      recovered = true;
    },
  };
  const repo = new Repository(storage, 'chema:demo:v1', emptyLocalState);
  await expect(repo.load()).rejects.toThrow('Base desaparecida');
  await expect(repo.restoreDemo(raw(), demoProfile('ADMIN'))).resolves.toMatchObject({
    state: { obras: [] },
  });
  expect(recovered).toBe(true);
});
it('puede exportar un original de asistencia aunque no pueda abrir la base activa', async () => {
  const storage: KeyValueStorage & { getRecoveryItem: (key: string) => Promise<string> } = {
    getItem: async () => {
      throw new Error('base inaccesible');
    },
    setItem: async () => {},
    getRecoveryItem: async () => '{original para soporte}',
  };
  const repo = new Repository(storage, 'chema:demo:v1', emptyLocalState);
  expect(await repo.exportRaw()).toBe('{original para soporte}');
});
it('una foto remota sin bytes no autoriza vaciado mediante copia guardada', async () => {
  const state = seed();
  state.obras[0]!.fotos = [
    {
      id: 'remote',
      uri: 'https://example.invalid/image.jpg',
      storagePath: 'private/image.jpg',
      status: 'SYNCED',
      usuarioUid: 'demo_admin',
    },
  ];
  await expect(
    saveVerifiedBackup(JSON.stringify({ schema: 1, state, confirmed: state, queue: [] })),
  ).rejects.toThrow(/foto|copia/);
  expect(mocks.saveBackupToDestination).not.toHaveBeenCalled();
});
it('una copia semánticamente inválida no se declara restaurable', async () => {
  const state = seed();
  state.combos.push(structuredClone(state.combos[0]!));
  await expect(
    saveVerifiedBackup(JSON.stringify({ schema: 1, state, confirmed: state, queue: [] })),
  ).rejects.toThrow(/combo|copia/);
});
