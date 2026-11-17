import type { ObraCard } from '../types';
export async function localDocument(
  kind: 'excel' | 'word',
  obras: ObraCard[],
): Promise<Uint8Array> {
  if (kind === 'word') {
    const [{ Packer }, { remitoDocument }] = await Promise.all([
      import('docx'),
      import('../documents/wordGenerator'),
    ]);
    const blob = await Packer.toBlob(remitoDocument(obras[0]!));
    return new Uint8Array(await blob.arrayBuffer());
  }
  const [ExcelJS, { generateExcel }] = await Promise.all([
    import('exceljs/dist/exceljs.min.js'),
    import('../documents/excelGenerator'),
  ]);
  const data = await generateExcel(obras, ExcelJS.default.Workbook);
  return new Uint8Array(data as ArrayBuffer);
}
