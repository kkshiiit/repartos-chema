import { afterEach, expect, it, vi } from 'vitest';
import { SharedAuth, SharedSessionVault, type SharedSession } from '../src/shared/auth';
it('escribir una generación incompleta no pierde la sesión anterior', async () => {
  const data = new Map<string, string>();
  let fail = false;
  const storage = {
    getItem: async (k: string) => data.get(k) ?? null,
    setItem: async (k: string, v: string) => {
      if (fail && k !== 'chema_shared_session_v1') throw new Error('Disco lleno');
      data.set(k, v);
    },
    removeItem: async (k: string) => {
      data.delete(k);
    },
  };
  const vault = new SharedSessionVault(storage),
    session: SharedSession = {
      accessToken: 'access_test_only',
      refreshToken: 'refresh_test_only',
      expiresAt: 1000000,
      userId: 'synthetic_user',
      email: 'synthetic@example.invalid',
    };
  await vault.save(session);
  fail = true;
  await expect(vault.save({ ...session, accessToken: 'other' })).rejects.toThrow();
  expect(await vault.read()).toEqual(session);
  fail = false;
  await vault.save(null);
  expect(await vault.read()).toBeNull();
});
it('un encabezado corrupto no reinicia ni borra sus partes', async () => {
  const values = new Map([['chema_shared_session_v1', '{roto']]);
  const vault = new SharedSessionVault({
    getItem: async (key) => values.get(key) ?? null,
    setItem: async (k, v) => {
      values.set(k, v);
    },
  });
  await expect(vault.read()).rejects.toThrow(/conservaron/);
  expect(values.get('chema_shared_session_v1')).toBe('{roto');
});

const credentials = (uid: string, token = uid) => ({
  access_token: `access_${token}`,
  refresh_token: `refresh_${token}`,
  expires_in: 3600,
  user: { id: uid, email: `${uid}@example.invalid` },
});
async function expiredAuth() {
  const data = new Map<string, string>();
  const vault = new SharedSessionVault({
    getItem: async (k) => data.get(k) ?? null,
    setItem: async (k, v) => {
      data.set(k, v);
    },
    removeItem: async (k) => {
      data.delete(k);
    },
  });
  await vault.save({
    accessToken: 'expired_A',
    refreshToken: 'refresh_A',
    expiresAt: 1,
    userId: 'A',
    email: 'a@example.invalid',
  });
  const auth = new SharedAuth({ url: 'https://example.invalid', publicKey: 'public_test' }, vault);
  await auth.load();
  return { auth, vault };
}
afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});
it('dos peticiones simultáneas renuevan una sola vez el token del mismo usuario', async () => {
  const { auth } = await expiredAuth();
  let complete!: (response: Response) => void;
  const transport = vi.fn(
    () =>
      new Promise<Response>((resolve) => {
        complete = resolve;
      }),
  );
  vi.stubGlobal('fetch', transport);
  const first = auth.accessToken('A'),
    second = auth.accessToken('A');
  await new Promise((resolve) => setTimeout(resolve, 0));
  complete(Response.json(credentials('A', 'renewed')));
  expect(await Promise.all([first, second])).toEqual(['access_renewed', 'access_renewed']);
  expect(transport).toHaveBeenCalledTimes(1);
});
it('cerrar sesión durante una renovación impide que la respuesta tardía vuelva a guardarla', async () => {
  const { auth, vault } = await expiredAuth();
  let complete!: (response: Response) => void;
  vi.stubGlobal('fetch', (url: string) =>
    String(url).includes('refresh_token')
      ? new Promise<Response>((resolve) => {
          complete = resolve;
        })
      : Promise.resolve(new Response(null, { status: 204 })),
  );
  const pending = auth.accessToken('A');
  const rejected = expect(pending).rejects.toThrow(/sesión|cuenta/);
  await new Promise((resolve) => setTimeout(resolve, 0));
  await auth.signOut();
  complete(Response.json(credentials('A', 'late')));
  await rejected;
  expect(await vault.read()).toBeNull();
});
it('una renovación de A no pisa la cuenta B ni permite enviar la cola de A con el token B', async () => {
  const { auth, vault } = await expiredAuth();
  let complete!: (response: Response) => void;
  vi.stubGlobal('fetch', (url: string) =>
    String(url).includes('refresh_token')
      ? new Promise<Response>((resolve) => {
          complete = resolve;
        })
      : Promise.resolve(Response.json(credentials('B'))),
  );
  const pending = auth.accessToken('A');
  const rejected = expect(pending).rejects.toThrow(/sesión|cuenta/);
  await new Promise((resolve) => setTimeout(resolve, 0));
  await auth.signIn('b@example.invalid', 'password_only_for_test');
  complete(Response.json(credentials('A', 'late')));
  await rejected;
  expect((await vault.read())?.userId).toBe('B');
  await expect(auth.accessToken('A')).rejects.toThrow(/cuenta/);
  expect(await auth.accessToken('B')).toBe('access_B');
});
it('renovación rechazada por Auth señala sesión bloqueada sin borrar la cola ni fingir fallo de red', async () => {
  const { auth, vault } = await expiredAuth();
  vi.stubGlobal('fetch', () =>
    Promise.resolve(Response.json({ error: 'invalid_grant' }, { status: 401 })),
  );
  await expect(auth.accessToken('A')).rejects.toMatchObject({
    status: 401,
    code: 'SESSION_CHANGED',
  });
  expect((await vault.read())?.userId).toBe('A');
});
