import { describe, expect, it } from 'vitest';
import {
  PublishedRouteCache,
  loadableRouteIds,
  parsePublishedRoute,
  proposalFromSnapshot,
  validateRoutePlan,
} from '../src/services/publishedRoute';
import type { SharedSnapshot } from '../src/shared/protocol';
const snapshot = {
  tasks: {
    a: { id: 'initial:epoch:a:DELIVER', type: 'DELIVER' },
    b: { id: 'new:b:RETIRE', type: 'RETIRE' },
  },
} as unknown as SharedSnapshot;
const plan = {
  schema: 1 as const,
  ids: ['a', 'b'],
  tasks: { a: 'initial:epoch:a:DELIVER', b: 'new:b:RETIRE' },
  assignments: {},
};
const published = { revision: 2, route: plan, userId: 'actor', updatedAt: '2026-10-27T12:00:00Z' };
describe('published route', () => {
  it('captures task identity and rejects stale draft ids', () => {
    expect(proposalFromSnapshot(['b', 'a'], {}, snapshot).tasks).toEqual(plan.tasks);
    expect(() => proposalFromSnapshot(['missing'], {}, snapshot)).toThrow('paradas cambiaron');
  });
  it('does not restore completed or replaced tasks when loading', () => {
    expect(loadableRouteIds(plan, ['b'], snapshot)).toEqual(['b']);
    expect(
      loadableRouteIds(plan, ['a', 'b'], {
        ...snapshot,
        tasks: { ...snapshot.tasks, a: { id: 'later:a:RETIRE', type: 'RETIRE' } },
      }),
    ).toEqual(['b']);
  });
  it('rejects duplicate ids, foreign assignments, incomplete tasks and client authors', () => {
    for (const value of [
      { ...plan, ids: ['a', 'a'] },
      { ...plan, tasks: {} },
      { ...plan, assignments: { c: '11111111-1111-1111-1111-111111111111' } },
      { ...plan, userId: 'spoof' },
    ])
      expect(() => validateRoutePlan(value)).toThrow();
    expect(() => parsePublishedRoute({ ...published, revision: -1 })).toThrow();
  });
  it('keeps offline copies scoped by workspace and uid', async () => {
    const values = new Map<string, string>();
    const storage = {
      getItem: async (key: string) => values.get(key) ?? null,
      setItem: async (key: string, value: string) => {
        values.set(key, value);
      },
    };
    const cache = new PublishedRouteCache(storage, 'space', 'one');
    await cache.save(published);
    expect(await cache.load()).toEqual(published);
    expect(await new PublishedRouteCache(storage, 'space', 'two').load()).toBeNull();
    expect(await new PublishedRouteCache(storage, 'other', 'one').load()).toBeNull();
  });
  it('does not claim a durable copy after an unconfirmed write', async () => {
    const cache = new PublishedRouteCache(
      { getItem: async () => null, setItem: async () => {} },
      'space',
      'one',
    );
    await expect(cache.save(published)).rejects.toThrow('copia local');
  });
});

it('preserves a proposed assignment draft across newer received plans and reopen', async () => {
  const values = new Map<string, string>();
  const storage = {
    getItem: async (key: string) => values.get(key) ?? null,
    setItem: async (key: string, value: string) => {
      values.set(key, value);
    },
  };
  const first = new PublishedRouteCache(storage, 'space', 'one');
  const draft = { a: '11111111-1111-4111-8111-111111111111' };
  await first.saveAssignments(draft);
  await first.save({
    ...published,
    revision: 3,
    route: { ...plan, assignments: { a: '22222222-2222-4222-8222-222222222222' } },
  });
  const reopened = new PublishedRouteCache(storage, 'space', 'one');
  expect(await reopened.loadAssignments()).toEqual(draft);
  expect((await reopened.load())?.revision).toBe(3);
  expect(await new PublishedRouteCache(storage, 'space', 'other').loadAssignments()).toBeNull();
});
it('does not claim assignment draft durability when storage loses the write', async () => {
  const cache = new PublishedRouteCache(
    { getItem: async () => null, setItem: async () => {} },
    'space',
    'one',
  );
  await expect(cache.saveAssignments({})).rejects.toThrow('asignaciones guardadas');
});
