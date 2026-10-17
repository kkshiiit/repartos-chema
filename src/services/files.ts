import { Platform } from 'react-native';
import { Directory, File, Paths } from 'expo-file-system';
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

export interface BackupDestination {
  saved: boolean;
  uri?: string;
  prepared?: boolean;
}
export async function saveBackupToDestination(
  bytes: Uint8Array,
  name = 'chema-copia.json',
): Promise<BackupDestination> {
  if (Platform.OS === 'web') {
    await saveFile(name, bytes, 'application/json');
    // El navegador no certifica que el usuario conservó una descarga.
    return { saved: false, prepared: true };
  }
  let directory: Directory;
  try {
    directory = await Directory.pickDirectoryAsync();
  } catch (error) {
    const detail = String((error as { code?: string })?.code || '') + ' ' + String(error);
    if (/cancel|dismiss/i.test(detail)) return { saved: false };
    throw new Error('No se pudo elegir el destino. No se modificaron datos.');
  }
  const dot = name.lastIndexOf('.');
  const unique = `${name.slice(0, dot)}-${Date.now().toString(36)}-${++fileSequence}${name.slice(dot)}`;
  const file = directory.createFile(unique, 'application/json');
  file.write(bytes);
  const readBack = await file.bytes();
  if (readBack.length !== bytes.length || readBack.some((n, i) => n !== bytes[i]))
    throw new Error(
      'No se pudo verificar la copia: escritura incompleta. No se modificaron datos.',
    );
  return { saved: true, uri: file.uri };
}
