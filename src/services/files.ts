import { Platform } from 'react-native';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
let fileSequence = 0;
export async function saveFile(
  name: string,
  bytes: Uint8Array,
  mime: string,
  dialogTitle = 'Guardar copia',
) {
  if (Platform.OS === 'web') {
    const url = URL.createObjectURL(new Blob([bytes as BlobPart], { type: mime }));
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 30000);
    return;
  }
  const dot = name.lastIndexOf('.');
  const stem = dot > 0 ? name.slice(0, dot) : name;
  const extension = dot > 0 ? name.slice(dot) : '';
  const uniqueName = `${stem}-${Date.now().toString(36)}-${++fileSequence}${extension}`;
  const file = new File(Paths.cache, uniqueName);
  file.create({ overwrite: false });
  file.write(bytes);
  if (!(await Sharing.isAvailableAsync()))
    throw new Error(
      'No se pudo abrir Compartir. El archivo permanece en la caché de la aplicación.',
    );
  await Sharing.shareAsync(file.uri, { mimeType: mime, dialogTitle });
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
