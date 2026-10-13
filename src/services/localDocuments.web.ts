import type { ObraCard } from '../types';
export async function localDocument(
  kind: 'excel' | 'word',
  obras: ObraCard[],
): Promise<Uint8Array> {
  if (kind === 'word') {
    const [{ Packer }, { remitoDocument }] = await Promise.all([
      import('docx'),
      import('../../functions/src/wordGenerator'),
    ]);
    const blob = await Packer.toBlob(remitoDocument(obras[0]!));
    return new Uint8Array(await blob.arrayBuffer());
  }
  const [ExcelJS, { generateExcel }] = await Promise.all([
    import('exceljs/dist/exceljs.min.js'),
    import('../../functions/src/excelGenerator'),
  ]);
  const data = await generateExcel(obras, ExcelJS.default.Workbook);
  return new Uint8Array(data as ArrayBuffer);
}
