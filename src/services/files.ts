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
  let result: DocumentPicker.DocumentPickerResult;
  try {
    result = await DocumentPicker.getDocumentAsync({
      // Algunos proveedores Android etiquetan JSON como texto o binario.
      // La validación del contenido ocurre antes de ofrecer la importación.
      type: '*/*',
      multiple: false,
      copyToCacheDirectory: true,
    });
  } catch {
    throw new Error(
      'No se pudo abrir el selector de archivos. Reintentá desde Ajustes. No se modificaron datos.',
    );
  }
  if (result.canceled) return null;
  const asset = result.assets?.[0];
  if (!asset?.uri) throw new Error('No se recibió un archivo. Elegí el JSON desde Descargas.');
  if ((asset.size || 0) > 50 * 1024 * 1024)
    throw new Error('La copia supera 50 MB. Solicita asistencia para restaurarla.');
  let raw: string;
  try {
    if (Platform.OS === 'web') {
      const response = await fetch(asset.uri);
      if (!response.ok) throw new Error('Archivo no disponible');
      raw = await response.text();
    } else raw = await new File(asset.uri).text();
  } catch {
    throw new Error(
      'No se pudo leer el archivo. Guardalo primero en Descargas y elegilo otra vez. No se modificaron datos.',
    );
  }
  if (!raw.trim()) throw new Error('El archivo está vacío. Elegí una copia JSON completa.');
  if (raw.length > 50 * 1024 * 1024)
    throw new Error('La copia supera 50 MB. No se modificaron datos.');
  return raw;
}
