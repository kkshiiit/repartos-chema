import { File, Paths } from 'expo-file-system';
const photoFile = (id: string) => new File(Paths.document, `chema-${id}.jpg`);
export async function storePhoto(id: string, bytes: Uint8Array) {
  const file = photoFile(id);
  if (file.exists) {
    const old = await file.bytes();
    if (old.length !== bytes.length || old.some((n, i) => n !== bytes[i]))
      throw new Error('Ya existe otra foto con este ID. Se conserva el original.');
    return file.uri;
  }
  // Publish only a complete verified private file. A failed write leaves the original ID reusable.
  const staged = new File(
    Paths.document,
    `chema-${id}.pending-${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`,
  );
  try {
    staged.create({ overwrite: false });
    staged.write(bytes);
    const saved = await staged.bytes();
    if (saved.length !== bytes.length || saved.some((n, i) => n !== bytes[i]))
      throw new Error('No se pudo verificar la foto guardada. Se conserva el original.');
    if (file.exists) {
      const previous = await file.bytes();
      if (previous.length !== bytes.length || previous.some((n, i) => n !== bytes[i]))
        throw new Error('Ya existe otra foto con este ID. Se conserva el original.');
      return file.uri;
    }
    staged.move(file);
    return file.uri;
  } finally {
    // After move staged.uri points at the published file; never remove that original.
    if (staged.uri !== file.uri && staged.exists) staged.delete();
  }
}
export async function photoBytes(id: string): Promise<Uint8Array | null> {
  const file = photoFile(id);
  return file.exists ? file.bytes() : null;
}
export async function deleteLocalPhoto(id: string) {
  const file = photoFile(id);
  if (file.exists) file.delete();
}
// La visualización nativa usa la ruta persistente, sin duplicar la imagen en base64.
export function displayPhoto(_bytes: Uint8Array, id: string) {
  return photoFile(id).uri;
}
export function releasePhoto(_uri: string) {}
