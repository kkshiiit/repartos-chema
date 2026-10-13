import type { ObraCard } from '../types';
export async function localDocument(
  _kind: 'excel' | 'word',
  _obras: ObraCard[],
): Promise<Uint8Array> {
  throw new Error(
    'Documentos locales disponibles en la demo web. En iOS/Android configura Cloud Functions para Excel y Word.',
  );
}
