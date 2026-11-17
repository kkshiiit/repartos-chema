import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Repository } from './helpers/legacyRepository';
import { demoProfile, emptyState, seed } from '../src/data/seed';
import { backupData, prepareRestore } from '../src/services/backupService';
import type { AppState, Envelope, Operation } from '../src/types';

vi.mock('../src/services/files', () => ({ saveFile: vi.fn(), saveBackupToDestination: vi.fn() }));
vi.mock('../src/services/photoCache', () => ({ photoBytes: vi.fn(), storePhoto: vi.fn() }));

const now = new Date('2026-10-24T12:00:00.000Z');
const actor = demoProfile('ADMIN');
const key = 'chema:delivery-integrity-fixture:v1';

function fixture(initial: () => AppState = () => seed(now)) {
  const state = initial();
  const pending = state.obras.find((o) => o.id === 'obra_5');
  if (pending) {
    pending.fechaEntrega = '2026-10-30';
    pending.fechaRetiroEstimada = '2026-11-01';
  }
  const envelope: Envelope = { schema: 1, state, confirmed: structuredClone(state), queue: [] };
  const raw = JSON.stringify(envelope);
  const data = new Map([[key, raw]]);
  const storage = {
    getItem: async (name: string) => data.get(name) ?? null,
    setItem: async (name: string, value: string) => {
      data.set(name, value);
    },
  };
  return { repo: new Repository(storage, key, initial), data, storage, raw, envelope };
}

function delivery(retirementDate: string): Operation {
  return {
    id: 'early_delivery',
    actor,
    createdAt: now.toISOString(),
    action: {
      type: 'DELIVER',
      obraId: 'obra_5',
      responsables: ['Fabián'],
      fechaRetiroEstimada: retirementDate,
    },
  };
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(now);
});
afterEach(() => vi.useRealTimers());

describe('integridad de una entrega anticipada y su copia', () => {
  it('rechaza retiro anterior a la entrega planificada sin cambiar stock ni persistencia', async () => {
    const f = fixture();
    await f.repo.load();

    await expect(f.repo.dispatch(delivery('2026-10-25'))).rejects.toThrow('entrega planificada');

    expect(f.data.get(key)).toBe(f.raw);
    expect(await f.repo.load()).toEqual(f.envelope);
    expect(await new Repository(f.storage, key, emptyState).load()).toEqual(f.envelope);
  });

  it('acepta retiro igual a la entrega planificada y conserva fechas y stock al restaurar', async () => {
    const f = fixture();
    await f.repo.load();
    await f.repo.dispatch(delivery('2026-10-30'));

    const output = await backupData(await f.repo.exportRaw());
    expect(output.name).toBe('chema-copia.json');
    const restoredRaw = await prepareRestore(new TextDecoder().decode(output.bytes));
    const target = fixture(emptyState);
    await target.repo.load();
    await target.repo.restoreDemo(restoredRaw, actor);
    const reopened = await new Repository(target.storage, key, emptyState).load();

    expect(reopened.state.obras.find((o) => o.id === 'obra_5')).toMatchObject({
      estadoProceso: 'ENTREGADO',
      fechaEntrega: '2026-10-30',
      fechaEntregaEfectiva: '2026-10-24',
      fechaRetiroEstimada: '2026-10-30',
    });
    expect(reopened.state.materiales[0]).toMatchObject({ cantidadGalpon: 48, cantidadEnObra: 72 });
    expect(reopened.state.logs[0]?.operationId).toBe('early_delivery');
  });
});
