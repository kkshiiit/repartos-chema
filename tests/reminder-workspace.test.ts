import { expect, it } from 'vitest';
import { ReminderService, type ReminderAdapter } from '../src/services/feedback/reminders';
const rental = {
  id: 'same_rental',
  clienteNombre: 'Cliente sintético',
  direccion: 'Dirección sintética',
  fechaRetiroEstimada: '2032-03-03',
  estadoProceso: 'ENTREGADO',
};
it('preferencias y programaciones de dos espacios no se pisan ni se cancelan entre sí', async () => {
  const data = new Map<string, string>(),
    scheduled = new Map<string, unknown>();
  const storage = {
    getItem: async (k: string) => data.get(k) ?? null,
    setItem: async (k: string, v: string) => {
      data.set(k, v);
    },
  };
  const adapter: ReminderAdapter = {
    supported: true,
    permission: async () => true,
    scheduled: async () => [...scheduled.keys()],
    schedule: async (k, v) => {
      scheduled.set(k, v);
    },
    cancel: async (k) => {
      scheduled.delete(k);
    },
  };
  const clock = () => Date.parse('2032-02-01T12:00:00Z');
  const a = new ReminderService(storage, adapter, clock, {
    storageKey: 'prefs_a',
    identifierPrefix: 'scope-a:',
    scope: 'space_a:user',
  });
  const b = new ReminderService(storage, adapter, clock, {
    storageKey: 'prefs_b',
    identifierPrefix: 'scope-b:',
    scope: 'space_b:user',
  });
  await a.configureGeneral({ enabled: true, time: '08:00', offsets: [3, 2, 1, 0] }, [rental]);
  await b.initialize();
  expect(scheduled.size).toBe(4);
  await b.configureGeneral({ enabled: true, time: '09:00', offsets: [0] }, [rental]);
  expect(scheduled.size).toBe(5);
  await b.suspend();
  expect(scheduled.size).toBe(4);
  const reopened = new ReminderService(storage, adapter, clock, {
    storageKey: 'prefs_b',
    identifierPrefix: 'scope-b:',
    scope: 'space_b:user',
  });
  await reopened.initialize();
  await reopened.reconcile([rental]);
  expect(scheduled.size).toBe(5);
  expect(a.snapshot().globalPolicy.time).toBe('08:00');
  expect(reopened.snapshot().globalPolicy.time).toBe('09:00');
});
