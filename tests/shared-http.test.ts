import { afterEach, expect, it, vi } from 'vitest';
import { createRestStore } from '../src/shared/server';
afterEach(() => vi.unstubAllGlobals());
it('una RPC válida sin cuerpo HTTP204 no se trata como error JSON ni bloquea la incorporación', async () => {
  vi.stubGlobal('fetch', async () => new Response(null, { status: 204 }));
  const store = createRestStore({
    url: 'https://example.invalid',
    publicKey: 'public_test',
    serviceKey: 'server_test_only',
  });
  await expect(
    store.rpc('chema_enrollment_check', { p_hash: 'synthetic_hash' }),
  ).resolves.toBeNull();
});
