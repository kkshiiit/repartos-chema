import { describe, it, expect } from 'vitest';
import { dark, light, resolveTheme, oppositeTheme, statusColor } from '../src/theme/tokens';
function luminance(hex: string) {
  const channels = hex
    .slice(1)
    .match(/../g)!
    .map((v) => parseInt(v, 16) / 255)
    .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return channels[0]! * 0.2126 + channels[1]! * 0.7152 + channels[2]! * 0.0722;
}
function contrast(a: string, b: string) {
  const x = luminance(a),
    y = luminance(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}
describe('Apariencia y contraste', () => {
  it('sistema cambia en vivo; la selección manual tiene prioridad', () => {
    expect(resolveTheme('system', 'dark')).toBe('dark');
    expect(resolveTheme('system', 'light')).toBe('light');
    expect(resolveTheme('light', 'dark')).toBe('light');
    expect(resolveTheme('dark', 'light')).toBe('dark');
    expect(oppositeTheme(resolveTheme('system', 'dark'))).toBe('light');
  });
  for (const [name, c] of Object.entries({ light, dark })) {
    it(`${name}: texto y estados AA sobre superficies`, () => {
      for (const bg of [c.bg, c.panel, c.panel2])
        for (const fg of [
          c.text,
          c.muted,
          c.subtle,
          c.green,
          c.yellow,
          c.blue,
          c.orange,
          c.purple,
          c.danger,
          c.neutral,
        ])
          expect(contrast(fg, bg), `${fg} sobre ${bg}`).toBeGreaterThanOrEqual(4.5);
      expect(contrast(c.onPrimary, c.red)).toBeGreaterThanOrEqual(4.5);
    });
    it(`${name}: controles distinguibles`, () => {
      for (const bg of [c.bg, c.panel]) expect(contrast(c.line, bg)).toBeGreaterThanOrEqual(3);
      expect(contrast(c.focus, c.panel)).toBeGreaterThanOrEqual(3);
      expect(statusColor('PENDIENTE', c)).toBe(c.purple);
    });
  }
});
