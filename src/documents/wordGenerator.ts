import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  AlignmentType,
} from 'docx';
import type { ObraCard } from '../types';
import { isCalendarDate } from '../utils/retirementCalendar';
export function remitoDocument(o: ObraCard) {
  const border = { style: BorderStyle.SINGLE, size: 4, color: 'D5DBE3' };
  const cell = (text: string, header = false) =>
    new TableCell({
      children: [
        new Paragraph({
          children: [
            new TextRun({ text, bold: header, color: header ? 'FFFFFF' : '0F172A', size: 21 }),
          ],
        }),
      ],
      shading: header ? { fill: 'D32F2F' } : undefined,
      margins: { top: 110, bottom: 110, left: 120, right: 120 },
      borders: { top: border, bottom: border, left: border, right: border },
    });
  return new Document({
    creator: 'Grupo Chema Construcciones',
    title: `Remito · ${o.clienteNombre}`,
    styles: {
      default: {
        document: { run: { font: 'Calibri', size: 22 }, paragraph: { spacing: { after: 140 } } },
      },
    },
    sections: [
      {
        properties: { page: { margin: { top: 900, bottom: 900, left: 850, right: 850 } } },
        children: [
          new Paragraph({
            children: [
              new TextRun({ text: 'GRUPO CHEMA', bold: true, size: 38, color: 'D32F2F' }),
              new TextRun({ text: '  CONSTRUCCIONES', size: 22, color: '334155' }),
            ],
          }),
          new Paragraph({ text: 'REMITO DE MATERIALES', heading: 'Heading1' }),
          new Paragraph(`Cliente: ${o.clienteNombre}`),
          new Paragraph(`Destino: ${o.direccion} · ${o.localidadBarrio}`),
          new Paragraph(
            `Entrega prevista: ${o.fechaEntrega}    |    Retiro estimado: ${isCalendarDate(o.fechaRetiroEstimada) ? o.fechaRetiroEstimada : 'Sin fecha de retiro'}`,
          ),
          new Paragraph(`Entrega efectiva: ${o.fechaEntregaEfectiva || 'Sin registro separado'}`),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                tableHeader: true,
                children: ['Material', 'Medida', 'Cantidad', 'Detalle / Apodo'].map((v) =>
                  cell(v, true),
                ),
              }),
              ...o.materialesCargados.map(
                (m) =>
                  new TableRow({
                    children: [
                      cell(m.nombre),
                      cell(m.medida || '—'),
                      cell(String(m.cantidad)),
                      cell(m.apodo || '—'),
                    ],
                  }),
              ),
            ],
          }),
          new Paragraph({
            text: `Responsables del flete: ${o.entregadoPor?.join(', ') || 'Por asignar'}`,
            spacing: { before: 350, after: 350 },
          }),
          new Paragraph(
            'Se deja constancia de la recepción de los materiales detallados en este remito.',
          ),
          new Paragraph({
            text: 'ACLARACIÓN Y FIRMA DE RECIBIDO',
            spacing: { before: 400, after: 600 },
          }),
          new Paragraph(`Recibió: ${o.recibidoPor || 'Sin registrar'}`),
          new Paragraph('Firma: ______________________________________________'),
          new Paragraph('Aclaración: __________________________________________'),
          new Paragraph('Documento: __________________  Fecha: _________________'),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 500 },
            children: [
              new TextRun({
                text: 'Chema Andamios · Registro logístico interno',
                color: '64748B',
                size: 18,
              }),
            ],
          }),
        ],
      },
    ],
  });
}
export const generateWord = (o: ObraCard) => Packer.toBuffer(remitoDocument(o));
