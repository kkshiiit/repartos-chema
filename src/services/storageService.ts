import { Platform } from 'react-native';
import * as Picker from 'expo-image-picker';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { File, Paths } from 'expo-file-system';
import { ref, uploadBytes, getDownloadURL, getMetadata } from 'firebase/storage';
import { photoBytes, storePhoto } from './photoCache';
import { firebase } from './firebase';
import type { PhotoRef } from '../types';
export async function selectPhoto(
  id: string,
  uid: string,
  camera = false,
): Promise<PhotoRef | null> {
  const granted = camera
    ? await Picker.requestCameraPermissionsAsync()
    : await Picker.requestMediaLibraryPermissionsAsync();
  if (!granted.granted)
    throw new Error('Permiso denegado. Habilita el acceso a cámara o fotos en ajustes.');
  const result = camera
    ? await Picker.launchCameraAsync({ mediaTypes: ['images'], quality: 1 })
    : await Picker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 1 });
  if (result.canceled || !result.assets[0]) return null;
  const asset = result.assets[0];
  const context = ImageManipulator.manipulate(asset.uri);
  if (Math.max(asset.width, asset.height) > 1024)
    context.resize(asset.width >= asset.height ? { width: 1024 } : { height: 1024 });
  const rendered = await context.renderAsync();
  const saved = await rendered.saveAsync({
    format: SaveFormat.JPEG,
    compress: 0.7,
    base64: false,
  });
  let uri = saved.uri;
  if (Platform.OS === 'web') {
    const bytes = new Uint8Array(await (await fetch(saved.uri)).arrayBuffer());
    if (bytes.length > 2 * 1024 * 1024) throw new Error('Foto demasiado grande.');
    uri = await storePhoto(id, bytes);
  } else {
    const dest = new File(Paths.document, `chema-${id}.jpg`);
    new File(saved.uri).copy(dest);
    uri = dest.uri;
  }
  return { id, uri, status: 'PENDING', usuarioUid: uid };
}
export async function uploadPhoto(obraId: string, p: PhotoRef): Promise<PhotoRef> {
  const path = `photos/${p.usuarioUid}/${obraId}/${p.id}.jpg`;
  const objectRef = ref(firebase().storage, path);
  try {
    await getMetadata(objectRef);
    return { ...p, status: 'SYNCED', storagePath: path, uri: await getDownloadURL(objectRef) };
  } catch (e) {
    if ((e as { code?: string }).code !== 'storage/object-not-found') throw e;
  }
  const blob =
    (await photoBytes(p.id)) ??
    (Platform.OS === 'web' ? await (await fetch(p.uri)).blob() : await new File(p.uri).bytes());
  if ((blob instanceof Uint8Array ? blob.byteLength : blob.size) > 2 * 1024 * 1024)
    throw new Error('Foto demasiado grande.');
  await uploadBytes(ref(firebase().storage, path), blob, { contentType: 'image/jpeg' });
  return {
    ...p,
    status: 'SYNCED',
    storagePath: path,
    uri: await getDownloadURL(ref(firebase().storage, path)),
  };
}
