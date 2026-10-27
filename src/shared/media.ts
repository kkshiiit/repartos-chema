import { Buffer } from 'buffer';
import { photoHash } from './mediaHash';
import type { KeyValueStorage } from '../data/repository';
export const MAX_PHOTO_BYTES = 2 * 1024 * 1024;
// Parse marker lengths, frame dimensions and scan boundaries before accepting JPEG bytes.
function jpegStructure(bytes: Uint8Array): boolean {
  let pos = 2,
    frame = false,
    scan = false;
  while (pos < bytes.length) {
    if (bytes[pos++] !== 255) return false;
    while (bytes[pos]! === 255) pos++;
    const marker = bytes[pos++];
    if (marker === 217) return frame && scan && pos === bytes.length;
    if (marker === undefined || marker === 0 || marker === 216 || (marker >= 208 && marker <= 215))
      return false;
    const length = (bytes[pos]! << 8) | bytes[pos + 1]!;
    if (length < 2 || pos + length > bytes.length) return false;
    if ([192, 193, 194].includes(marker)) {
      const components = bytes[pos + 7]!;
      if (
        length !== 8 + 3 * components ||
        components < 1 ||
        components > 4 ||
        !((bytes[pos + 3]! << 8) | bytes[pos + 4]!) ||
        !((bytes[pos + 5]! << 8) | bytes[pos + 6]!) ||
        ((bytes[pos + 3]! << 8) | bytes[pos + 4]!) > 1024 ||
        ((bytes[pos + 5]! << 8) | bytes[pos + 6]!) > 1024
      )
        return false;
      frame = true;
    }
    pos += length;
    if (marker === 218) {
      if (!frame || length < 6) return false;
      scan = true;
      while (pos < bytes.length) {
        if (bytes[pos]! !== 255) {
          pos++;
          continue;
        }
        if (bytes[pos + 1]! === 0 || (bytes[pos + 1]! >= 208 && bytes[pos + 1]! <= 215)) {
          pos += 2;
          continue;
        }
        break;
      }
    }
  }
  return false;
}
export async function validateJpeg(bytes: Uint8Array, expectedHash?: string): Promise<string> {
  if (
    bytes.length < 8 ||
    bytes.length > MAX_PHOTO_BYTES ||
    bytes[0] !== 255 ||
    bytes[1] !== 216 ||
    bytes[2] !== 255 ||
    bytes[bytes.length - 2] !== 255 ||
    bytes[bytes.length - 1] !== 217 ||
    !jpegStructure(bytes)
  )
    throw new Error('Foto JPEG inválida o supera 2 MiB. Conservamos el original.');
  const hash = await photoHash(bytes);
  if (expectedHash && hash !== expectedHash)
    throw new Error('La foto no coincide con su huella. Conservamos ambas copias.');
  return hash;
}
export interface MediaRemote {
  request<T>(type: string, args?: Record<string, unknown>): Promise<T>;
}
interface PendingPhoto {
  obraId: string;
  photoId: string;
  hash?: string;
  attempts: number;
  error?: string;
}
/** Separate durable outbox: no inventory operations, no stock mutations, original bytes remain in cache. */
export class SharedMediaQueue {
  readonly key: string;
  private tail: Promise<unknown> = Promise.resolve();
  constructor(
    private storage: KeyValueStorage,
    space: string,
    user: string,
    private remote: MediaRemote,
    private read: (id: string) => Promise<Uint8Array | null>,
  ) {
    this.key = `chema:media:v1:${encodeURIComponent(space)}:${encodeURIComponent(user)}`;
  }
  private serial<T>(fn: () => Promise<T>) {
    const run = this.tail.then(fn, fn);
    this.tail = run.catch(() => undefined);
    return run;
  }
  async pending(): Promise<PendingPhoto[]> {
    const raw = await this.storage.getItem(this.key);
    if (!raw) return [];
    const rows = JSON.parse(raw);
    if (
      !Array.isArray(rows) ||
      rows.some(
        (r) =>
          typeof r.obraId !== 'string' ||
          typeof r.photoId !== 'string' ||
          !Number.isInteger(r.attempts),
      )
    )
      throw Error('La cola de fotos requiere revisión. Se conserva el original.');
    return rows;
  }
  private async save(rows: PendingPhoto[]) {
    const raw = JSON.stringify(rows);
    await this.storage.setItem(this.key, raw);
    if ((await this.storage.getItem(this.key)) !== raw)
      throw Error('No se pudo verificar la cola de fotos.');
  }
  enqueue(obraId: string, photoId: string) {
    return this.serial(async () => {
      if (
        await this.storage.getItem(
          this.key + ':done:' + encodeURIComponent(obraId) + ':' + encodeURIComponent(photoId),
        )
      )
        return;
      const rows = await this.pending();
      if (!rows.some((r) => r.obraId === obraId && r.photoId === photoId)) {
        rows.push({ obraId, photoId, attempts: 0 });
        await this.save(rows);
      }
    });
  }
  sync() {
    return this.serial(async () => {
      const rows = await this.pending();
      for (let i = 0; i < rows.length;) {
        const row = rows[i]!;
        try {
          row.attempts++;
          await this.save(rows);
          const bytes = await this.read(row.photoId);
          if (!bytes) throw Error('Foto sin copia local; pendiente de recuperar.');
          row.hash = await validateJpeg(bytes, row.hash);
          await this.save(rows);
          const result = await this.remote.request<{ hash: string }>('photo-upload', {
            obraId: row.obraId,
            photoId: row.photoId,
            hash: row.hash,
            data: Buffer.from(bytes).toString('base64'),
          });
          if (result.hash !== row.hash)
            throw Error('El servidor no confirmó la huella de la foto.');
          await this.storage.setItem(
            this.key +
              ':done:' +
              encodeURIComponent(row.obraId) +
              ':' +
              encodeURIComponent(row.photoId),
            row.hash,
          );
          rows.splice(i, 1);
          await this.save(rows);
        } catch (e) {
          row.error = e instanceof Error ? e.message : 'Foto pendiente';
          await this.save(rows);
          i++;
        }
      }
      return rows;
    });
  }
}
export async function downloadSharedPhoto(remote: MediaRemote, obraId: string, photoId: string) {
  const result = await remote.request<{ data: string; hash: string }>('photo-download', {
    obraId,
    photoId,
  });
  const bytes = new Uint8Array(Buffer.from(result.data, 'base64'));
  await validateJpeg(bytes, result.hash);
  return bytes;
}

export function sharedPhotoCacheId(space: string, user: string, photo: string) {
  const a = encodeURIComponent(space),
    b = encodeURIComponent(user);
  return `shared-${a.length}-${a}-${b.length}-${b}-${encodeURIComponent(photo)}`;
}
