import { afterEach, expect, it, vi } from 'vitest';
import { createSharedHandler } from '../src/shared/server';
const handler = createSharedHandler({
  url: 'https://example.invalid',
  publicKey: 'public_fixture',
  serviceKey: 'server_fixture',
});
const route = { schema: 1, ids: ['a'], tasks: { a: 'task-a' }, assignments: {} };
const send = (body: unknown) =>
  handler(
    new Request('https://example.invalid', {
      method: 'POST',
      headers: { authorization: 'Bearer fixture' },
      body: JSON.stringify(body),
    }),
  );
afterEach(() => vi.unstubAllGlobals());
it('rejects client actor metadata and invalid expected revisions before calling route RPC', async () => {
  const fetch = vi.fn(async () => Response.json({ id: '11111111-1111-4111-8111-111111111111' }));
  vi.stubGlobal('fetch', fetch);
  for (const body of [
    { type: 'route', expected: -1, route },
    { type: 'route', expected: '0', route },
    { type: 'route', expected: 0, route: { ...route, userId: 'spoof' } },
  ])
    expect((await send(body)).status).toBe(400);
  expect(fetch).toHaveBeenCalledTimes(3);
});
it('returns409 for concurrent plans and retains the submitted proposal', async () => {
  const proposal = { type: 'route', spaceId: 'space', expected: 3, route };
  const fetch = vi.fn(async (url: string) =>
    url.endsWith('/auth/v1/user')
      ? Response.json({ id: '11111111-1111-4111-8111-111111111111' })
      : Response.json({ message: 'ROUTE_CHANGED' }, { status: 400 }),
  );
  vi.stubGlobal('fetch', fetch);
  const response = await send(proposal);
  expect(response.status).toBe(409);
  expect((await response.json()).code).toBe('CONFLICT');
  const args = JSON.parse(
    (fetch.mock.calls[1] as unknown as [string, RequestInit])[1].body as string,
  );
  expect(args.p_expected).toBe(3);
  expect(args.p_route).toEqual(route);
  expect(proposal.expected).toBe(3);
});
