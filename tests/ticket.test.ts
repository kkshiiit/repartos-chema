import { describe, expect, it } from 'vitest';
import { seed } from '../src/data/seed';
import { ticketData, ticketHtml, ticketNumber, ticketText } from '../src/utils/ticketFormat';

const user = { uid: 'u1', nombre: 'Ana Gómez', email: '', role: 'ADMIN' as const, createdAt: '' };
describe('ticket de alquiler', () => {
  const s = seed();
  const o = s.obras.find((x) => x.estadoProceso === 'ENTREGADO')!;
  const t = ticketData(o, s, 'Grupo <Chema>', user, new Date('2026-11-17T15:00:00Z'));
  it('suma piezas y lista cada material', () => {
    expect(t.total).toBe(o.materialesCargados.reduce((n, m) => n + m.cantidad, 0));
    const text = ticketText(t);
    expect(text).toContain(o.clienteNombre);
    expect(text).toContain(`N° ${ticketNumber(o)}`);
    expect(text).toContain(`Total: ${t.total} piezas`);
    expect(text).toContain('Atendió: Ana Gómez');
  });
  it('el PDF escapa HTML y muestra firma y total', () => {
    const html = ticketHtml(t);
    expect(html).toContain('Grupo &lt;Chema&gt;');
    expect(html).not.toContain('Grupo <Chema>');
    expect(html).toContain('piezas en total');
    expect(html).toContain('Firma y aclaración del cliente');
  });
});
