import type { AppState, ObraCard, UserProfile } from '../types';
import { formatDate } from './formatters';
import { isCalendarDate } from './retirementCalendar';

export type TicketFormat = 'pdf' | 'texto' | 'whatsapp' | 'word' | 'excel';
export const TICKET_FORMATS: { value: TicketFormat; label: string; detail: string }[] = [
  { value: 'pdf', label: 'PDF', detail: 'Comprobante prolijo para enviar o imprimir' },
  { value: 'whatsapp', label: 'WhatsApp al cliente', detail: 'Abre el chat con el texto listo' },
  { value: 'texto', label: 'Texto', detail: 'Para pegar en cualquier app' },
  { value: 'word', label: 'Word (.docx)', detail: 'Remito editable' },
  { value: 'excel', label: 'Excel (.xlsx)', detail: 'Planilla del alquiler' },
];

const STATE_LABEL: Record<ObraCard['estadoProceso'], string> = {
  PENDIENTE_ENTREGA: 'Por entregar',
  ENTREGADO: 'Entregado · en obra',
  RETIRADO: 'Retirado',
  REINGRESADO: 'Cerrado',
};

export function ticketNumber(o: ObraCard) {
  return o.id.replace(/[^A-Za-z0-9]/g, '').slice(0, 8).toUpperCase();
}

export interface TicketData {
  business: string;
  issuedBy: string;
  issuedAt: Date;
  obra: ObraCard;
  lines: { cantidad: number; nombre: string; medida?: string; apodo?: string }[];
  total: number;
}

export function ticketData(o: ObraCard, state: AppState, business: string, user: UserProfile, now = new Date()): TicketData {
  const lines = o.materialesCargados.map((m) => {
    const master = state.materiales.find((x) => x.id === m.materialId);
    return { cantidad: m.cantidad, nombre: master?.nombre || m.nombre, medida: m.medida || master?.medida, apodo: m.apodo };
  });
  return {
    business,
    issuedBy: user.nombre,
    issuedAt: now,
    obra: o,
    lines,
    total: lines.reduce((n, l) => n + l.cantidad, 0),
  };
}

const when = (d: Date) =>
  d.toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires', dateStyle: 'short', timeStyle: 'short' });

export function ticketText(t: TicketData) {
  const o = t.obra;
  return [
    `*${t.business.toUpperCase()}*`,
    `Comprobante de alquiler N° ${ticketNumber(o)}`,
    `Emitido: ${when(t.issuedAt)}`,
    '',
    `*Cliente:* ${o.clienteNombre}`,
    o.clienteTelefono ? `*Teléfono:* ${o.clienteTelefono}` : '',
    `*Dirección:* ${o.direccion}, ${o.localidadBarrio}`,
    `*Entrega:* ${formatDate(o.fechaEntregaEfectiva || o.fechaEntrega)}`,
    `*Retiro previsto:* ${isCalendarDate(o.fechaRetiroEstimada) ? formatDate(o.fechaRetiroEstimada) : 'a confirmar'}`,
    `*Estado:* ${STATE_LABEL[o.estadoProceso]}`,
    '',
    '*Materiales alquilados*',
    ...(t.lines.length
      ? t.lines.map((l) => `• ${l.cantidad} × ${l.nombre}${l.medida ? ` (${l.medida})` : ''}${l.apodo ? ` – ${l.apodo}` : ''}`)
      : ['• Sin materiales cargados']),
    `*Total: ${t.total} piezas*`,
    '',
    o.recibidoPor ? `Recibió: ${o.recibidoPor}` : '',
    o.entregadoPor?.length ? `Entregó: ${o.entregadoPor.join(', ')}` : '',
    o.observaciones ? `Notas: ${o.observaciones}` : '',
    `Atendió: ${t.issuedBy}`,
  ]
    .filter((line, i, all) => line !== '' || (all[i - 1] ?? '') !== '')
    .join('\n')
    .trim();
}

const esc = (v: unknown) =>
  String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

export function ticketHtml(t: TicketData) {
  const o = t.obra;
  const rows = t.lines.length
    ? t.lines
        .map(
          (l, i) =>
            `<tr class="${i % 2 ? 'alt' : ''}"><td class="num">${l.cantidad}</td><td>${esc(l.nombre)}${l.apodo ? `<div class="sub">${esc(l.apodo)}</div>` : ''}</td><td>${esc(l.medida || '—')}</td></tr>`,
        )
        .join('')
    : '<tr><td colspan="3" class="empty">Sin materiales cargados</td></tr>';
  const faltantes = (o.faltantesRegistrados || []).filter((f) => f.cantidad - f.recuperado > 0);
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Comprobante ${ticketNumber(o)}</title>
<style>
@page{size:A4;margin:18mm 16mm}
*{box-sizing:border-box}
body{font-family:-apple-system,Roboto,"Segoe UI",Helvetica,Arial,sans-serif;color:#0A0C10;margin:0;font-size:13px;line-height:1.45}
.head{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:4px solid #C2410C;padding-bottom:14px;margin-bottom:18px}
.brand{font-size:24px;font-weight:800;letter-spacing:-.3px}
.tag{color:#C2410C;font-weight:700;text-transform:uppercase;font-size:11px;letter-spacing:1.4px;margin-top:4px}
.meta{text-align:right;font-size:12px;color:#3B4350}
.meta b{display:block;font-size:18px;color:#0A0C10}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:10px 22px;margin-bottom:18px}
.box{border:1px solid #C9D0D9;border-radius:10px;padding:10px 12px}
.label{font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#5C6573;font-weight:700}
.value{font-size:14px;font-weight:600;margin-top:2px}
.status{display:inline-block;padding:3px 10px;border-radius:99px;background:#FFE8D9;color:#7C2D12;font-weight:700;font-size:12px}
table{width:100%;border-collapse:collapse;margin-top:6px}
th{background:#0A0C10;color:#fff;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:1px;padding:9px 10px}
td{padding:9px 10px;border-bottom:1px solid #E3E7ED;vertical-align:top}
tr.alt td{background:#F6F7F9}
td.num{font-weight:800;font-size:15px;width:70px;text-align:center}
.sub{font-size:11px;color:#5C6573}
.total td{border-top:2px solid #0A0C10;font-weight:800;font-size:14px;background:#fff}
.empty{text-align:center;color:#5C6573}
h2{font-size:13px;text-transform:uppercase;letter-spacing:1.2px;margin:20px 0 6px}
.notes{border-left:4px solid #C2410C;background:#FFF7F2;padding:10px 12px;border-radius:0 8px 8px 0}
.sign{display:flex;gap:40px;margin-top:46px}
.sign div{flex:1;border-top:1px solid #0A0C10;padding-top:6px;font-size:11px;color:#3B4350;text-align:center}
.foot{margin-top:28px;font-size:10px;color:#5C6573;text-align:center;border-top:1px solid #E3E7ED;padding-top:8px}
</style></head><body>
<div class="head"><div><div class="brand">${esc(t.business)}</div><div class="tag">Comprobante de alquiler</div></div>
<div class="meta">N°<b>${ticketNumber(o)}</b>Emitido ${esc(when(t.issuedAt))}</div></div>
<div class="grid">
<div class="box"><div class="label">Cliente</div><div class="value">${esc(o.clienteNombre)}</div>${o.clienteTelefono ? `<div>${esc(o.clienteTelefono)}</div>` : ''}</div>
<div class="box"><div class="label">Dirección de obra</div><div class="value">${esc(o.direccion)}</div><div>${esc(o.localidadBarrio)}</div></div>
<div class="box"><div class="label">Entrega</div><div class="value">${esc(formatDate(o.fechaEntregaEfectiva || o.fechaEntrega))}</div></div>
<div class="box"><div class="label">Retiro previsto</div><div class="value">${esc(isCalendarDate(o.fechaRetiroEstimada) ? formatDate(o.fechaRetiroEstimada) : 'A confirmar')}</div></div>
</div>
<div><span class="status">${esc(STATE_LABEL[o.estadoProceso])}</span></div>
<h2>Materiales alquilados</h2>
<table><thead><tr><th style="text-align:center">Cant.</th><th>Material</th><th>Medida</th></tr></thead>
<tbody>${rows}<tr class="total"><td class="num">${t.total}</td><td colspan="2">piezas en total</td></tr></tbody></table>
${faltantes.length ? `<h2>Faltantes o daños registrados</h2><table><tbody>${faltantes.map((f) => `<tr><td class="num">${f.cantidad - f.recuperado}</td><td>${esc(f.itemNombre)}</td><td>${f.tipo === 'DANADO' ? 'Dañado' : 'Perdido'}</td></tr>`).join('')}</tbody></table>` : ''}
${o.observaciones ? `<h2>Observaciones</h2><div class="notes">${esc(o.observaciones)}</div>` : ''}
<div class="grid" style="margin-top:16px">
<div><div class="label">Entregó</div><div class="value">${esc(o.entregadoPor?.join(', ') || '—')}</div></div>
<div><div class="label">Recibió</div><div class="value">${esc(o.recibidoPor || '—')}</div></div>
</div>
<div class="sign"><div>Firma y aclaración del cliente</div><div>Firma ${esc(t.business)}</div></div>
<div class="foot">Atendió ${esc(t.issuedBy)} · Documento generado con Repartos Chema</div>
</body></html>`;
}

