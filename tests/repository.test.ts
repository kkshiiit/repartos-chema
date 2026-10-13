import { describe, it, expect } from 'vitest';
import { Repository, KeyValueStorage, RemoteAdapter } from '../src/data/repository';
import { seed, demoProfile } from '../src/data/seed';
import { applyOperation } from '../src/domain/engine';
import type { Operation } from '../src/types';
class MemoryStorage implements KeyValueStorage {
  values = new Map<string, string>();
  fail = false;
  async getItem(k: string) {
    return this.values.get(k) || null;
  }
  async setItem(k: string, v: string) {
    if (this.fail) throw new Error('Disco lleno');
    this.values.set(k, v);
  }
}
const now = new Date(),
  user = demoProfile('ADMIN');
const op: Operation = {
  id: 'delivery_once',
  createdAt: now.toISOString(),
  actor: user,
  action: { type: 'DELIVER', obraId: 'obra_5', responsables: ['Fabián'] },
};
describe('Persistencia y sincronización', () => {
  it('confirma solo después de persistir, recupera tras reinicio', async () => {
    const storage = new MemoryStorage();
    const first = new Repository(storage, 'demo', () => seed(now));
    await first.load();
    await first.dispatch(op);
    const second = new Repository(storage, 'demo', () => seed(now));
    const e = await second.load();
    expect(e.state.obras[4]!.estadoProceso).toBe('ENTREGADO');
    expect(e.state.obras[4]!.syncStatus).toBe('PENDING');
    expect(e.queue).toHaveLength(0);
  });
  it('si falla disco no publica un cambio', async () => {
    const storage = new MemoryStorage(),
      repo = new Repository(storage, 'demo', () => seed(now));
    await repo.load();
    storage.fail = true;
    await expect(repo.dispatch(op)).rejects.toThrow('Disco lleno');
    expect((await repo.load()).state.obras[4]!.estadoProceso).toBe('PENDIENTE_ENTREGA');
  });
  it('retiene cola offline y elimina solo tras confirmación', async () => {
    const storage = new MemoryStorage();
    let online = false,
      server = seed(now);
    const remote: RemoteAdapter = {
      fetch: async () => server,
      commit: async (o) => {
        if (!online) throw new Error('Sin red');
        server = applyOperation(server, o);
        server.obras.forEach((o) => (o.syncStatus = 'SYNCED'));
        return server;
      },
    };
    const repo = new Repository(storage, 'cloud', () => seed(now), remote);
    await repo.load();
    await repo.dispatch(op);
    await expect(repo.sync()).rejects.toThrow('Sin red');
    expect((await repo.load()).queue).toHaveLength(1);
    online = true;
    await repo.sync();
    expect((await repo.load()).queue).toHaveLength(0);
    expect((await repo.load()).state.obras[4]!.syncStatus).toBe('SYNCED');
  });
  it('reintento tras respuesta perdida no duplica movimiento', async () => {
    const storage = new MemoryStorage();
    let server = seed(now),
      lost = true;
    const remote: RemoteAdapter = {
      fetch: async () => server,
      commit: async (o) => {
        server = applyOperation(server, o);
        if (lost) {
          lost = false;
          throw new Error('Respuesta perdida');
        }
        return server;
      },
    };
    const repo = new Repository(storage, 'cloud', () => seed(now), remote);
    await repo.load();
    await repo.dispatch(op);
    await expect(repo.sync()).rejects.toThrow();
    await repo.sync();
    expect(server.logs).toHaveLength(1);
  });
  it('dos operaciones simultáneas no entregan dos veces', async () => {
    const storage = new MemoryStorage(),
      repo = new Repository(storage, 'demo', () => seed(now));
    await repo.load();
    const result = await Promise.allSettled([
      repo.dispatch(op),
      repo.dispatch({ ...op, id: 'another_delivery' }),
    ]);
    expect(result.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    expect((await repo.load()).state.logs).toHaveLength(1);
  });
  it('conflicto conserva intento y no acepta más escrituras', async () => {
    const storage = new MemoryStorage();
    const remote: RemoteAdapter = {
      fetch: async () => seed(now),
      commit: async () => {
        throw Object.assign(new Error('Stock cambió'), { code: 'functions/failed-precondition' });
      },
    };
    const repo = new Repository(storage, 'cloud', () => seed(now), remote);
    await repo.load();
    await repo.dispatch(op);
    await expect(repo.sync()).rejects.toThrow();
    expect((await repo.load()).queue[0]!.status).toBe('CONFLICT');
    await expect(repo.dispatch({ ...op, id: 'another' })).rejects.toThrow('conflicto');
    await repo.discardConflict();
    expect((await repo.load()).queue).toHaveLength(0);
    expect([...storage.values.keys()].some((k) => k.includes(':rejected:'))).toBe(true);
  });
  it('no descarta envíos de resultado incierto', async () => {
    const repo = new Repository(new MemoryStorage(), 'cloud', () => seed(now), {
      fetch: async () => seed(now),
      commit: async () => {
        throw new Error('Red');
      },
    });
    await repo.load();
    await repo.dispatch(op);
    await expect(repo.discardConflict()).rejects.toThrow('rechazo confirmado');
  });
});

describe('Recuperación sin restablecer datos', () => {
  it.each([
    '{',
    '',
    JSON.stringify({ schema: 2 }),
    JSON.stringify({ schema: 1, state: {}, confirmed: {}, queue: [] }),
  ])('conserva datos dañados o incompatibles: %s', async (raw) => {
    const storage = new MemoryStorage();
    storage.getItem = async (k) => storage.values.get(k) ?? null;
    storage.values.set('demo', raw);
    const repo = new Repository(storage, 'demo', () => seed(now));
    await expect(repo.load()).rejects.toThrow('Datos locales');
    expect(await repo.exportRaw()).toBe(raw);
  });
  it('reintenta una lectura fallida sin escribir semilla', async () => {
    const storage = new MemoryStorage();
    const repo = new Repository(storage, 'demo', () => seed(now));
    await repo.load();
    await repo.dispatch(op);
    const raw = storage.values.get('demo');
    const original = storage.getItem.bind(storage);
    storage.getItem = async () => {
      throw new Error('Lectura denegada');
    };
    const reopened = new Repository(storage, 'demo', () => seed(now));
    await expect(reopened.load()).rejects.toThrow('Lectura denegada');
    storage.getItem = original;
    expect((await reopened.load()).state.logs).toHaveLength(1);
    expect(storage.values.get('demo')).toBe(raw);
  });
  it('conflicto reabierto sigue visible tras cada reintento', async () => {
    const storage = new MemoryStorage();
    let commits = 0;
    const remote: RemoteAdapter = {
      fetch: async () => seed(now),
      commit: async () => {
        commits++;
        throw Object.assign(new Error('Stock cambió'), { code: 'functions/failed-precondition' });
      },
    };
    const first = new Repository(storage, 'cloud', () => seed(now), remote);
    await first.load();
    await first.dispatch(op);
    await expect(first.sync()).rejects.toThrow('Stock cambió');
    const second = new Repository(storage, 'cloud', () => seed(now), remote);
    await second.load();
    await expect(second.sync()).rejects.toThrow('Stock cambió');
    expect(commits).toBe(1);
    expect((await second.load()).queue[0]?.status).toBe('CONFLICT');
    await second.discardConflict();
    await second.dispatch({ ...op, id: 'correction' });
  });
  it('si el almacenamiento desaparece no reemplaza con datos semilla', async () => {
    const storage = new MemoryStorage(),
      repo = new Repository(storage, 'demo', () => seed(now));
    await repo.load();
    await repo.dispatch(op);
    storage.values.delete('demo');
    await expect(repo.load()).rejects.toThrow('desapareció');
    expect(storage.values.has('demo')).toBe(false);
  });
});

it('restaura copia validada y archiva el original dañado antes de reemplazar', async () => {
  const storage = new MemoryStorage(),
    repo = new Repository(storage, 'demo', () => seed(now));
  const good = JSON.stringify(await repo.load());
  storage.values.set('demo', '{corrupto');
  await expect(repo.load()).rejects.toThrow('dañados');
  await repo.restoreDemo(good, user);
  expect((await repo.load()).state.obras).toHaveLength(6);
  expect(
    [...storage.values.entries()].some(
      ([key, value]) => key.includes('before-restore') && value === '{corrupto',
    ),
  ).toBe(true);
  await expect(repo.restoreDemo(good, demoProfile('OPERADOR'))).rejects.toThrow('administración');
});
it('fallo de copia preventiva impide reemplazar inventario', async () => {
  const storage = new MemoryStorage(),
    repo = new Repository(storage, 'demo', () => seed(now));
  const initial = JSON.stringify(await repo.load());
  await repo.dispatch(op);
  const before = await repo.exportRaw();
  storage.fail = true;
  await expect(repo.restoreDemo(initial, user)).rejects.toThrow('Disco lleno');
  expect(await repo.exportRaw()).toBe(before);
});
