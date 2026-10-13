import type ExcelJS from 'exceljs';
import type { ObraCard } from '../../src/types';
import { obraStatus } from '../../src/domain/rules';
export async function generateExcel(obras: ObraCard[], Workbook: typeof ExcelJS.Workbook) {
  const workbook = new Workbook();
  workbook.creator = 'Grupo Chema Construcciones';
  const sheet = workbook.addWorksheet('Logística');
  sheet.mergeCells('A1:G1');
  const title = sheet.getCell('A1');
  title.value = 'REPORTE LOGÍSTICO - GRUPO CHEMA CONSTRUCCIONES';
  title.font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
  title.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD32F2F' } };
  title.alignment = { vertical: 'middle', horizontal: 'center' };
  sheet.getRow(1).height = 35;
  sheet.addRow([
    'Cliente',
    'Obra/Dirección',
    'Estado',
    'Materiales Entregados',
    'Faltantes',
    'Responsables',
    'Fecha',
  ]);
  sheet.getRow(2).font = { bold: true, color: { argb: 'FF0F172A' } };
  sheet.getRow(2).height = 25;
  for (const o of obras) {
    const row = sheet.addRow([
      o.clienteNombre,
      `${o.direccion}, ${o.localidadBarrio}`,
      obraStatus(o).label,
      o.materialesCargados
        .map(
          (m) => `${m.cantidad} × ${m.nombre} ${m.medida || ''}${m.apodo ? ` (${m.apodo})` : ''}`,
        )
        .join('\n'),
      o.faltantesRegistrados
        ?.map(
          (f) =>
            `${f.cantidad - f.recuperado} × ${f.itemNombre} · ${f.tipo === 'DANADO' ? 'Dañado' : 'Perdido'}`,
        )
        .join('\n') || 'Sin faltantes',
      `Entrega: ${o.entregadoPor?.join(', ') || 'Por asignar'}\nRetiro: ${o.retiradoPor?.join(', ') || 'Por asignar'}`,
      o.fechaEntrega,
    ]);
    row.alignment = { wrapText: true, vertical: 'top' };
    row.height = Math.max(36, 17 * (o.materialesCargados.length + 1));
    row.getCell(3).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: {
        argb: (
          {
            VERDE: 'FFDCFCE7',
            AMARILLO: 'FFFEF08A',
            ROJO: 'FFFEE2E2',
            PENDIENTE: 'FFEDE9FE',
            RETIRADO: 'FFE2E8F0',
            REINGRESADO: 'FFE2E8F0',
          } as Record<string, string>
        )[obraStatus(o).key]!,
      },
    };
  }
  sheet.columns.forEach((col, index) => {
    let max = [20, 30, 15, 34, 26, 25, 14][index] || 15;
    col.eachCell?.({ includeEmpty: false }, (cell, row) => {
      if (row > 1)
        max = Math.max(
          max,
          ...String(cell.value || '')
            .split('\n')
            .map((t) => t.length + 2),
        );
    });
    col.width = Math.min(max, index === 3 ? 55 : 42);
  });
  sheet.autoFilter = { from: 'A2', to: `G${Math.max(2, sheet.rowCount)}` };
  sheet.views = [{ state: 'frozen', ySplit: 2 }];
  return workbook.xlsx.writeBuffer();
}
