import type { Envelope } from '../types';
import { parseEnvelope } from '../data/validation';
import { photoBytes, storePhoto } from './photoCache';
import { saveFile } from './files';
import { Buffer } from 'buffer';
export async function downloadBackup(raw: string | null) {
  if (raw === null) throw new Error('Todavía no hay datos locales.');
  let envelope: Envelope;
  try {
    envelope = parseEnvelope(raw);
  } catch {
    await saveFile(
      'chema-datos-para-recuperar.json',
      new TextEncoder().encode(raw),
      'application/json',
    );
    return;
  }
  const photos: Record<string, string> = {};
  for (const o of envelope.state.obras)
    for (const p of o.fotos || []) {
      const bytes = await photoBytes(p.id);
      if (bytes) photos[p.id] = Buffer.from(bytes).toString('base64');
      else if (!p.storagePath && !p.uri.startsWith('data:'))
        throw new Error(
          'Falta una foto local. Recupera el archivo antes de crear una copia completa.',
        );
    }
  const text = JSON.stringify({
    format: 'chema-backup-v1',
    createdAt: new Date().toISOString(),
    envelope,
    photos,
  });
  await saveFile('chema-copia.json', new TextEncoder().encode(text), 'application/json');
}
export async function prepareRestore(raw: string) {
  if (raw.length > 50 * 1024 * 1024) throw new Error('Copia demasiado grande.');
  const parsed = JSON.parse(raw) as {
    format?: string;
    envelope?: Envelope;
    photos?: Record<string, string>;
  };
  if (parsed.format !== 'chema-backup-v1')
    throw new Error('Selecciona una copia completa de Repartos Chema.');
  const e = parseEnvelope(JSON.stringify(parsed.envelope));
  if (e.queue.length)
    throw new Error('Esta copia contiene envíos a la nube. Requiere revisión antes de restaurar.');
  for (const [id, data] of Object.entries(parsed.photos || {})) {
    if (
      !/^[a-zA-Z0-9_-]{1,100}$/.test(id) ||
      typeof data !== 'string' ||
      data.length > 3 * 1024 * 1024 ||
      !/^[A-Za-z0-9+/]*={0,2}$/.test(data)
    )
      throw new Error('Foto de respaldo inválida.');
  }
  // Las fotos se escriben con IDs nuevos: un fallo nunca pisa imágenes del inventario anterior.
  const remapped = new Map<string, { id: string; uri: string }>();
  for (const o of e.state.obras)
    for (const p of o.fotos || []) {
      const encoded = parsed.photos?.[p.id];
      if (!encoded) {
        if (p.uri.startsWith('chema-photo:') || p.uri.startsWith('file:'))
          throw new Error('La copia no contiene todas las fotos.');
        continue;
      }
      let mapped = remapped.get(p.id);
      if (!mapped) {
        const id = `restore_${Date.now()}_${remapped.size}`;
        const uri = await storePhoto(id, new Uint8Array(Buffer.from(encoded, 'base64')));
        mapped = { id, uri };
        remapped.set(p.id, mapped);
      }
      p.id = mapped.id;
      p.uri = mapped.uri;
      p.status = 'PENDING';
      delete p.storagePath;
    }
  for (const o of e.state.obras) {
    o.fotosUrls = o.fotos?.map((p) => p.uri) || [];
    o.syncStatus = 'PENDING';
  }
  // Ningún inverso de otra instalación puede restaurar referencias de fotos antiguas.
  for (const log of e.state.logs) delete log.payloadInverso;
  e.confirmed = JSON.parse(JSON.stringify(e.state));
  return JSON.stringify(e);
}
