import { it, expect, vi, afterEach } from 'vitest';
import { Buffer } from 'buffer';
import { createSharedHandler } from '../src/shared/server';
import { validateJpeg, SharedMediaQueue } from '../src/shared/media';
const jpeg = new Uint8Array(
  Buffer.from(
    '/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwDxOiiigD//2Q==',
    'base64',
  ),
);
afterEach(() => vi.unstubAllGlobals());
it('rechaza bytes falsos y tamaño excesivo', async () => {
  await expect(validateJpeg(new Uint8Array([1, 2, 3]))).rejects.toThrow();
  await expect(validateJpeg(new Uint8Array(2097153))).rejects.toThrow();
});
it('persiste pendiente tras fallo y reintenta sin perder originales', async () => {
  const values = new Map<string, string>();
  const storage = {
    getItem: async (k: string) => values.get(k) ?? null,
    setItem: async (k: string, v: string) => {
      values.set(k, v);
    },
  };
  let fails = true;
  let uploads = 0;
  const bytes = jpeg;
  const remote = {
    request: async () => {
      uploads++;
      if (fails) throw Error('offline');
      return { hash: await validateJpeg(bytes) };
    },
  };
  const q = new SharedMediaQueue(storage, 'space', 'user', remote as never, async () => bytes);
  await q.enqueue('obra', 'photo');
  await q.sync();
  expect((await q.pending()).length).toBe(1);
  fails = false;
  const resumed = new SharedMediaQueue(
    storage,
    'space',
    'user',
    remote as never,
    async () => bytes,
  );
  await resumed.sync();
  expect(await resumed.pending()).toEqual([]);
  expect(uploads).toBe(2);
});

it('JPEG con sólo firma y terminador no es una imagen válida', async () => {
  await expect(
    validateJpeg(new Uint8Array([255, 216, 255, 224, 0, 2, 255, 217])),
  ).rejects.toThrow();
  const hash = await validateJpeg(jpeg);
  await expect(validateJpeg(jpeg, '0'.repeat(64))).rejects.toThrow(/huella/);
  expect(hash).toHaveLength(64);
});
it('Edge privado: pérdida de respuesta permite reintento inmutable y acceso revocado impide descarga', async () => {
  const hash = await validateJpeg(jpeg);
  let member = true;
  let object: Uint8Array | undefined;
  let reads = 0;
  let accessChecks = 0;
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string, init?: RequestInit) => {
      if (url.endsWith('/auth/v1/user')) return Response.json({ id: 'user' });
      if (url.includes('/rpc/chema_photo_access')) {
        accessChecks++;
        if (!member) return Response.json({ message: 'MEMBERSHIP_REQUIRED' }, { status: 403 });
        return Response.json({ path: 'private/key.jpg', hash });
      }
      if (url.includes('/storage/v1/object/chema-photos/')) {
        if (init?.method === 'POST') {
          if (object) return Response.json({ error: 'exists' }, { status: 409 });
          object = jpeg;
          return Response.json({ ok: true });
        }
        reads++;
        return new Response(object as BodyInit);
      }
      throw Error('unexpected request');
    }),
  );
  const handler = createSharedHandler({
    url: 'https://synthetic.test',
    serviceKey: 'synthetic-private',
    publicKey: 'synthetic-public',
  });
  const request = (type: string) =>
    handler(
      new Request('https://synthetic.test/api', {
        method: 'POST',
        headers: { Authorization: 'Bearer synthetic' },
        body: JSON.stringify({
          type,
          spaceId: 'space',
          obraId: 'obra',
          photoId: 'photo',
          hash,
          data: Buffer.from(jpeg).toString('base64'),
        }),
      }),
    );
  expect((await request('photo-upload')).status).toBe(200);
  expect((await request('photo-upload')).status).toBe(200);
  expect(reads).toBe(1);
  const download = await request('photo-download');
  expect(download.status).toBe(200);
  expect((await download.json()).hash).toBe(hash);
  expect(accessChecks).toBe(6);
  member = false;
  expect((await request('photo-download')).status).toBe(403);
  expect(reads).toBe(2);
});

it('el comando compartido sólo transmite referencia lógica y la caché separa espacio/usuario', async () => {
  const { bootstrapShared, createCommand } = await import('../src/shared/protocol');
  const { seed } = await import('../src/data/seed');
  const { sharedPhotoCacheId } = await import('../src/shared/media');
  const command = createCommand(
    bootstrapShared('s', seed(), 'epoch'),
    {
      type: 'PHOTO',
      obraId: 'obra_1',
      photo: {
        id: 'photo',
        usuarioUid: 'user',
        uri: 'file:///private/local.jpg',
        status: 'SYNCED',
        storagePath: 'foreign/path',
      },
    },
    'operation',
    'user',
  );
  expect(JSON.stringify(command)).not.toContain('file:');
  expect(JSON.stringify(command)).not.toContain('foreign/path');
  expect(command.action.type === 'PHOTO' && command.action.photo.uri).toBe('chema-photo:photo');
  expect(sharedPhotoCacheId('space-a', 'user', 'photo')).not.toBe(
    sharedPhotoCacheId('space-b', 'user', 'photo'),
  );
  expect(sharedPhotoCacheId('space', 'user-a', 'photo')).not.toBe(
    sharedPhotoCacheId('space', 'user-b', 'photo'),
  );
});
