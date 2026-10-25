import type { ObraCard } from '../types';
import { isCalendarDate } from './retirementCalendar';
export function remitoText(o: ObraCard): string {
  return [
    'REMITO · GRUPO CHEMA CONSTRUCCIONES',
    `Cliente: ${o.clienteNombre}`,
    `Destino: ${o.direccion} · ${o.localidadBarrio}`,
    `Entrega prevista: ${o.fechaEntrega}`,
    `Entrega efectiva: ${o.fechaEntregaEfectiva || 'Sin registro separado'}`,
    `Retiro estimado: ${isCalendarDate(o.fechaRetiroEstimada) ? o.fechaRetiroEstimada : 'Sin fecha de retiro'}`,
    '',
    'Andamios y accesorios:',
    ...o.materialesCargados.map(
      (m) =>
        `• ${m.cantidad} × ${m.nombre}${m.medida ? ` · ${m.medida}` : ''}${m.apodo ? ` (${m.apodo})` : ''}`,
    ),
    '',
    `Recibió: ${o.recibidoPor || 'Sin registrar'}`,
    `Entrega: ${o.entregadoPor?.join(', ') || 'Por asignar'}`,
    `Retiro: ${o.retiradoPor?.join(', ') || 'Por asignar'}`,
    'Repartos Chema · Remito informativo',
  ].join('\n');
}
export function whatsappUrl(o: ObraCard): string {
  const phone = o.clienteTelefono.replace(/\D/g, '');
  if (!/^\d{8,15}$/.test(phone)) throw new Error('Completa el teléfono con código de país.');
  return `https://wa.me/${phone}?text=${encodeURIComponent(remitoText(o))}`;
}
export function mapsUrl(o: Pick<ObraCard, 'coordenadas' | 'direccion' | 'localidadBarrio'>) {
  const query = o.coordenadas
    ? `${o.coordenadas.lat},${o.coordenadas.lng}`
    : `${o.direccion} ${o.localidadBarrio}`.trim();
  if (!query) throw new Error('Falta ubicación.');
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(query)}`;
}
