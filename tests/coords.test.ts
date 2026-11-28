import { describe, expect, it } from 'vitest';
import { coordsFromText } from '../src/utils/coords';

describe('coordenadas desde un enlace de Google Maps', () => {
  it('lee los formatos comunes', () => {
    expect(coordsFromText('https://www.google.com/maps/@-34.6037,-58.3816,15z')).toEqual({
      lat: -34.6037,
      lng: -58.3816,
    });
    expect(coordsFromText('https://maps.google.com/?q=-34.55,-58.55')).toEqual({
      lat: -34.55,
      lng: -58.55,
    });
    expect(
      coordsFromText('https://www.google.com/maps/dir/?api=1&destination=-34.5%2C-58.6'),
    ).toEqual({ lat: -34.5, lng: -58.6 });
    expect(coordsFromText('-34.6037, -58.3816')).toEqual({ lat: -34.6037, lng: -58.3816 });
  });
  it('rechaza texto sin coordenadas o fuera de rango', () => {
    expect(coordsFromText('Las Heras 2840')).toBeNull();
    expect(coordsFromText('https://maps.app.goo.gl/abc123')).toBeNull();
    expect(coordsFromText('95.1, 10.2')).toBeNull();
  });
});
