import { describe, expect, it } from 'vitest';
import { seed } from '../src/data/seed';
import { remitoText } from '../src/utils/whatsapp';

describe('remito de alquileres antiguos sin fecha de retiro válida', () => {
  it.each([undefined, null, '', '2026-02-30'])('informa la fecha pendiente: %s', (date) => {
    const rental = { ...seed(new Date('2026-10-24T15:00:00Z')).obras[0]! };
    // Emulates persisted legacy data, which the reader preserves for explicit correction.
    Object.assign(rental, { fechaRetiroEstimada: date });
    expect(remitoText(rental)).toContain('Retiro estimado: Sin fecha de retiro');
  });

  it('conserva la fecha válida y no modifica los datos del alquiler', () => {
    const rental = { ...seed(new Date('2026-10-24T15:00:00Z')).obras[0]! };
    rental.fechaRetiroEstimada = '2026-11-01';
    const before = JSON.stringify(rental);
    expect(remitoText(rental)).toContain('Retiro estimado: 2026-11-01');
    expect(JSON.stringify(rental)).toBe(before);
  });
});
