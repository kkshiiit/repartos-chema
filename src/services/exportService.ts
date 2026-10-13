import { Platform } from 'react-native';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { httpsCallable } from 'firebase/functions';
import { getBytes, ref } from 'firebase/storage';
import type { ObraCard, UserProfile } from '../types';
import { DATA_MODE, firebase } from './firebase';
import { localDocument } from './localDocuments';
export async function exportDocument(
  kind: 'excel' | 'word',
  obras: ObraCard[],
  user: UserProfile,
  filters: { from?: string; to?: string; status?: string } = {},
) {
  if (user.role !== 'ADMIN') throw new Error('Exportación exclusiva de administración.');
  if (!obras.length) throw new Error('No hay obras para exportar.');
  let bytes: Uint8Array;
  if (DATA_MODE === 'demo') bytes = await localDocument(kind, obras);
  else {
    const result = await httpsCallable<
      { kind: string; obraId?: string; from?: string; to?: string; status?: string },
      { path: string }
    >(
      firebase().functions,
      'exportDocument',
    )({ kind, ...(kind === 'word' ? { obraId: obras[0]!.id } : filters) });
    bytes = new Uint8Array(
      await getBytes(ref(firebase().storage, result.data.path), 12 * 1024 * 1024),
    );
  }
  const name = `chema-${kind === 'excel' ? 'reporte.xlsx' : 'remito.docx'}`,
    mime =
      kind === 'excel'
        ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  if (Platform.OS === 'web') {
    const url = URL.createObjectURL(new Blob([bytes as BlobPart], { type: mime }));
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 30000);
    return 'Descarga preparada.';
  }
  const file = new File(Paths.cache, name);
  file.write(bytes);
  if (await Sharing.isAvailableAsync())
    await Sharing.shareAsync(file.uri, { mimeType: mime, dialogTitle: 'Compartir documento' });
  else throw new Error(`Archivo guardado en caché, pero compartir no está disponible.`);
  return 'Documento listo para compartir.';
}
