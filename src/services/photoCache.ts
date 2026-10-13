import { File, Paths } from 'expo-file-system';
const photoFile = (id: string) => new File(Paths.document, `chema-${id}.jpg`);
export async function storePhoto(id: string, bytes: Uint8Array) {
  const file = photoFile(id);
  file.write(bytes);
  return file.uri;
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
