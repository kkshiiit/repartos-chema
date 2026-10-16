import type { ObraCard } from '../types';
// Solo módulos JS: los archivos se guardan/comparten con expo-file-system y expo-sharing.
export async function localDocument(
  kind: 'excel' | 'word',
  obras: ObraCard[],
): Promise<Uint8Array> {
  if (!obras.length) throw new Error('No hay obras para exportar.');
  if (kind === 'word') {
    const [{ Packer }, { remitoDocument }] = await Promise.all([
      import('docx'),
      import('../../functions/src/wordGenerator'),
    ]);
    return new Uint8Array(await Packer.toArrayBuffer(remitoDocument(obras[0]!)));
  }
  const [ExcelJS, { generateExcel }] = await Promise.all([
    import('exceljs/dist/exceljs.min.js'),
    import('../../functions/src/excelGenerator'),
  ]);
  return new Uint8Array((await generateExcel(obras, ExcelJS.default.Workbook)) as ArrayBuffer);
}
