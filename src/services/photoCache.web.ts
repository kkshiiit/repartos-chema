// Las imágenes viven en IndexedDB; el inventario solo conserva referencias pequeñas.
let database: Promise<IDBDatabase> | undefined;
function db() {
  return (database ??= new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open('chema-photos', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('photos');
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => {
      database = undefined;
      reject(new Error('No se pudo abrir el almacenamiento de fotos.'));
    };
  }));
}
export async function storePhoto(id: string, bytes: Uint8Array) {
  const old = await photoBytes(id);
  if (old) {
    if (old.length !== bytes.length || old.some((n, i) => n !== bytes[i]))
      throw new Error('Ya existe otra foto con este ID. Se conserva el original.');
    return `chema-photo:${id}`;
  }
  const database = await db();
  await new Promise<void>((resolve, reject) => {
    const tx = database.transaction('photos', 'readwrite');
    const objectStore = tx.objectStore('photos');
    const existing = objectStore.get(id);
    existing.onsuccess = () => {
      if (existing.result) {
        tx.abort();
        return;
      }
      objectStore.add(new Blob([bytes as BlobPart], { type: 'image/jpeg' }), id);
    };
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(new Error('No hay espacio o permiso para guardar la foto.'));
    tx.onabort = () => reject(new Error('Se interrumpió el guardado de la foto.'));
  });
  return `chema-photo:${id}`;
}
export async function photoBytes(id: string): Promise<Uint8Array | null> {
  const database = await db();
  const blob = await new Promise<Blob | undefined>((resolve, reject) => {
    const request = database.transaction('photos').objectStore('photos').get(id);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new Error('No se pudo leer la foto local.'));
  });
  return blob ? new Uint8Array(await blob.arrayBuffer()) : null;
}
export async function deleteLocalPhoto(id: string) {
  const database = await db();
  await new Promise<void>((resolve, reject) => {
    const tx = database.transaction('photos', 'readwrite');
    tx.objectStore('photos').delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(new Error('No se pudo limpiar la foto local.'));
  });
}
export function displayPhoto(bytes: Uint8Array, _id: string) {
  return URL.createObjectURL(new Blob([bytes as BlobPart], { type: 'image/jpeg' }));
}
export function releasePhoto(uri: string) {
  if (uri.startsWith('blob:')) URL.revokeObjectURL(uri);
}
