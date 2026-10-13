import { Platform } from 'react-native';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
export async function saveFile(name: string, bytes: Uint8Array, mime: string) {
  if (Platform.OS === 'web') {
    const url = URL.createObjectURL(new Blob([bytes as BlobPart], { type: mime }));
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 30000);
    return;
  }
  const file = new File(Paths.cache, name);
  file.write(bytes);
  if (!(await Sharing.isAvailableAsync()))
    throw new Error(
      'No se pudo abrir Compartir. El archivo permanece en la caché de la aplicación.',
    );
  await Sharing.shareAsync(file.uri, { mimeType: mime, dialogTitle: 'Guardar copia' });
}
export async function pickBackup(): Promise<string | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: 'application/json',
    copyToCacheDirectory: true,
  });
  if (result.canceled) return null;
  const asset = result.assets[0]!;
  if ((asset.size || 0) > 50 * 1024 * 1024)
    throw new Error('La copia supera 50 MB. Solicita asistencia para restaurarla.');
  return Platform.OS === 'web' ? await (await fetch(asset.uri)).text() : new File(asset.uri).text();
}
