import React from 'react';
import { act, create } from 'react-test-renderer';
import { beforeEach, expect, it, vi } from 'vitest';
import { useMotionPreferences, MOTION_KEY } from '../src/hooks/useMotionPreferences';
import { dark, light } from '../src/theme/tokens';
const mocks = vi.hoisted(() => ({
  read: vi.fn(),
  write: vi.fn(),
  removeApp: vi.fn(),
  removeReduce: vi.fn(),
  app: undefined as undefined | ((v: string) => void),
  reduce: undefined as undefined | ((v: boolean) => void),
}));
vi.mock('@react-native-async-storage/async-storage', () => ({
  default: { getItem: mocks.read, setItem: mocks.write },
}));
vi.mock('react-native', () => ({
  AppState: {
    currentState: 'active',
    addEventListener: (_: string, f: typeof mocks.app) => {
      mocks.app = f;
      return { remove: mocks.removeApp };
    },
  },
  AccessibilityInfo: {
    isReduceMotionEnabled: () => Promise.resolve(false),
    addEventListener: (_: string, f: typeof mocks.reduce) => {
      mocks.reduce = f;
      return { remove: mocks.removeReduce };
    },
  },
}));
beforeEach(() => {
  vi.clearAllMocks();
  mocks.read.mockResolvedValue(null);
  mocks.write.mockResolvedValue(undefined);
});
it('pausa Aurora al salir, respeta movimiento reducido en vivo y limpia suscripciones', async () => {
  let current: ReturnType<typeof useMotionPreferences>;
  function Probe() {
    current = useMotionPreferences();
    return null;
  }
  let view: ReturnType<typeof create>;
  await act(async () => {
    view = create(React.createElement(Probe));
  });
  expect(current!.ambientEnabled).toBe(true);
  await act(async () => mocks.app!('background'));
  expect(current!.motionEnabled).toBe(false);
  await act(async () => mocks.app!('active'));
  expect(current!.ambientEnabled).toBe(true);
  await act(async () => mocks.reduce!(true));
  expect(current!.ambientEnabled).toBe(false);
  expect(current!.motionEnabled).toBe(false);
  await act(async () => view!.unmount());
  expect(mocks.removeApp).toHaveBeenCalledOnce();
  expect(mocks.removeReduce).toHaveBeenCalledOnce();
});
it('preferencia estática sobrevive recarga y solo guarda su propia clave', async () => {
  mocks.read.mockResolvedValue('static');
  let current: ReturnType<typeof useMotionPreferences>;
  function Probe() {
    current = useMotionPreferences();
    return null;
  }
  let view: ReturnType<typeof create>;
  await act(async () => {
    view = create(React.createElement(Probe));
  });
  expect(current!.ambientEnabled).toBe(false);
  await act(async () => current!.setMotionPreference('ambient'));
  expect(current!.ambientEnabled).toBe(true);
  expect(mocks.write).toHaveBeenCalledWith(MOTION_KEY, 'ambient');
  await act(async () => view!.unmount());
});
function lum(hex: string) {
  const rgb = hex
    .slice(1, 7)
    .match(/../g)!
    .map((v) => parseInt(v, 16) / 255)
    .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return rgb[0]! * 0.2126 + rgb[1]! * 0.7152 + rgb[2]! * 0.0722;
}
function ratio(a: string, b: string) {
  const x = lum(a),
    y = lum(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}
function over(fg: string, bg: string) {
  const alpha = parseInt(fg.slice(7, 9), 16) / 255;
  return (
    '#' +
    [1, 3, 5]
      .map((i) =>
        Math.round(
          parseInt(fg.slice(i, i + 2), 16) * alpha + parseInt(bg.slice(i, i + 2), 16) * (1 - alpha),
        )
          .toString(16)
          .padStart(2, '0'),
      )
      .join('')
  );
}
for (const [name, c] of Object.entries({ dark, light }))
  it(`${name}: vidrio compuesto y botón principal conservan contraste AA`, () => {
    for (const behind of [c.bg, '#FF2BD6', '#FF304F', '#A100FF']) {
      const surface = over(c.glass, behind);
      for (const fg of [
        c.text,
        c.muted,
        c.subtle,
        c.green,
        c.yellow,
        c.danger,
        c.blue,
        c.orange,
        c.purple,
      ])
        expect(ratio(fg, surface), `${fg} en ${surface}`).toBeGreaterThanOrEqual(4.5);
    }
    expect(ratio(c.onPrimary, c.primary)).toBeGreaterThanOrEqual(4.5);
  });
