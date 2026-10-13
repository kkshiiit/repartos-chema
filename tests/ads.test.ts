import { it, expect } from 'vitest';
import { adPlacementAllowed, bannerId, sponsorLink } from '../src/services/adsPolicy';
it('solo permite banners en Obras y Galpón', () => {
  expect(adPlacementAllowed('/')).toBe(true);
  expect(adPlacementAllowed('/galpon')).toBe(true);
  for (const path of ['/obra/nueva', '/obra/obra_1', '/historial', '/mapa', '/exportar', '/login'])
    expect(adPlacementAllowed(path)).toBe(false);
});
it('rechaza enlaces ejecutables y credenciales en patrocinio', () => {
  for (const link of [
    'javascript:alert(1)',
    'http://example.com',
    'https://user:password@example.com',
    'malformed',
  ])
    expect(sponsorLink(link)).toBeNull();
  expect(sponsorLink('https://example.com/sponsor')).toBe('https://example.com/sponsor');
});
it('no sirve anuncios reales sin unidad configurada', () => {
  expect(bannerId('ios', false, undefined, 'sdk-test')).toBeNull();
  expect(bannerId('android', false, 'no-valido', 'sdk-test')).toBeNull();
  expect(bannerId('web', true, undefined, 'sdk-test')).toBeNull();
  expect(bannerId('android', true, undefined, 'sdk-test')).toBe('sdk-test');
});
