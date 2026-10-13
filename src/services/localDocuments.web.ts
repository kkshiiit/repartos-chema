import { Packer } from 'docx';
import { generateExcel } from '../../functions/src/excelGenerator';
import { remitoDocument } from '../../functions/src/wordGenerator';
import type { ObraCard } from '../types';
export async function localDocument(
  kind: 'excel' | 'word',
  obras: ObraCard[],
): Promise<Uint8Array> {
  if (kind === 'word') {
    const blob = await Packer.toBlob(remitoDocument(obras[0]!));
    return new Uint8Array(await blob.arrayBuffer());
  }
  const ExcelJS = await import('exceljs/dist/exceljs.min.js');
  const data = await generateExcel(obras, ExcelJS.default.Workbook);
  return new Uint8Array(data as ArrayBuffer);
}
