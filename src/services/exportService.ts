import { Platform } from 'react-native';
import { saveFile } from './files';
import type { ObraCard, UserProfile } from '../types';
import { localDocument } from './localDocuments';
export async function exportDocument(
  kind: 'excel' | 'word',
  obras: ObraCard[],
  user: UserProfile,
  filters: { from?: string; to?: string; status?: string } = {},
) {
  if (user.role !== 'ADMIN') throw new Error('Exportación exclusiva de administración.');
  if (!obras.length) throw new Error('No hay obras para exportar.');
  void filters;
  const bytes = await localDocument(kind, obras);
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
  await saveFile(name, bytes, mime, 'Compartir documento');
  return 'Documento listo para compartir.';
}
