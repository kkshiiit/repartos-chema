import { it,expect } from 'vitest';
import ExcelJS from 'exceljs';
import { localDocument } from '../src/services/localDocuments';
import { seed } from '../src/data/seed';
it('generador usado por móvil produce Word y Excel locales válidos',async()=>{
  const obras=seed().obras;
  const word=await localDocument('word',obras);
  expect(Array.from(word.subarray(0,2))).toEqual([80,75]);
  expect(word.byteLength).toBeGreaterThan(5000);
  const excel=await localDocument('excel',obras);
  const reader=new ExcelJS.Workbook();
  await reader.xlsx.load(excel.buffer as ArrayBuffer);
  expect(reader.getWorksheet('Logística')!.getCell('A1').value).toBe('REPORTE LOGÍSTICO - GRUPO CHEMA CONSTRUCCIONES');
});
