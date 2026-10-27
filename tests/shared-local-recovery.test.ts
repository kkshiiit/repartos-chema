import { expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { demoProfile } from '../src/data/seed';
import { restoreSharedCopyLocally } from '../src/services/sharedRecovery';
vi.mock('../src/services/photoCache', () => ({ storePhoto: vi.fn(), photoBytes: vi.fn() }));
vi.mock('../src/services/files', () => ({ saveFile: vi.fn(), saveBackupToDestination: vi.fn() }));
const raw = readFileSync('tests/fixtures/whatsapp-five.json', 'utf8');
function storage() {
  const map = new Map<string, string>([
    ['chema:demo:v1', 'original que no debe tocarse'],
    ['chema:shared:v1:space:user', 'cola compartida original'],
  ]);
  return {
    map,
    getItem: async (k: string) => map.get(k) ?? null,
    setItem: async (k: string, v: string) => {
      map.set(k, v);
    },
    atomicSet: async (pairs: [string, string][]) => {
      for (const [k, v] of pairs) map.set(k, v);
    },
  };
}
it('restaura una copia desde equipo sólo en un inventario individual nuevo y conserva ambos originales', async () => {
  const store = storage();
  await restoreSharedCopyLocally(store, raw, demoProfile('ADMIN'), 'chema:recovery:test:v1');
  expect(store.map.get('chema:demo:v1')).toBe('original que no debe tocarse');
  expect(store.map.get('chema:shared:v1:space:user')).toBe('cola compartida original');
  const recovered = JSON.parse(store.map.get('chema:recovery:test:v1')!);
  expect(recovered.state.obras).toHaveLength(5);
  expect(recovered.state.materiales).toHaveLength(10);
});
it('rechaza una clave de inventario activo o una recuperación existente sin sobrescribirla', async () => {
  const store = storage();
  await expect(
    restoreSharedCopyLocally(store, raw, demoProfile('ADMIN'), 'chema:demo:v1'),
  ).rejects.toThrow(/aislado|recuperación/);
  store.map.set('chema:recovery:test:v1', 'recuperación anterior');
  await expect(
    restoreSharedCopyLocally(store, raw, demoProfile('ADMIN'), 'chema:recovery:test:v1'),
  ).rejects.toThrow(/existe/);
  expect(store.map.get('chema:recovery:test:v1')).toBe('recuperación anterior');
});
