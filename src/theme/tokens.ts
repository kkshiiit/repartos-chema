export type ThemePreference = 'light' | 'dark' | 'system';
export const THEME_KEY = 'chema:theme:v1';
export const brand = {
  cobalto: '#E8590C',
  ink: '#0A0C10',
  paper: '#FFFFFF',
  pink: '#E8590C',
  red: '#C81E3A',
  violet: '#B4470A',
  purple: '#B4470A',
  black: '#050608',
  white: '#FFFFFF',
};
/** Noche: fondo casi negro, texto claro y acento naranja cálido sin encandilar. */
export const dark = {
  background: '#0B0E13',
  surface: '#151A21',
  surfaceMuted: '#1F252E',
  text: '#F5F7FA',
  muted: '#B9C1CC',
  primary: '#FF8A4C',
  onPrimary: '#1A0B02',
  onDanger: '#FFFFFF',
  link: '#FFB283',
  selection: '#3A2414',
  selectionText: '#FFC9A6',
  line: '#343C48',
  controlBorder: '#6B7685',
  infoBackground: '#152536',
  infoText: '#A9D1FF',
  danger: '#FF8FA0',
  dangerBackground: '#3A1520',
  success: '#7EE2A8',
  successBackground: '#10301F',
  warning: '#FFD166',
  warningBackground: '#3A2C0C',
  bg: '#0B0E13',
  panel: '#151A21',
  panel2: '#1F252E',
  hairline: '#2B323C',
  subtle: '#9AA3AF',
  red: '#C9303B',
  green: '#7EE2A8',
  yellow: '#FFD166',
  blue: '#8CC2FF',
  orange: '#FFB283',
  purple: '#C9B5FF',
  neutral: '#B9C1CC',
  dangerBg: '#3A1520',
  focus: '#FF8A4C',
  disabled: '#9AA3AF',
  accent: '#FF8A4C',
  glass: '#151A21',
  reflection: '#1F252E',
  overlay: '#000000CC',
  shadow: '#000000',
  auroraOpacity: 0,
};
export type Colors = typeof dark;
/** Sol: blanco puro, tinta negra y bordes firmes para leer a pleno día. */
export const light: Colors = {
  background: '#EEF1F5',
  surface: '#FFFFFF',
  surfaceMuted: '#E3E7ED',
  text: '#0A0C10',
  muted: '#3B4350',
  primary: '#C2410C',
  onPrimary: '#FFFFFF',
  onDanger: '#FFFFFF',
  link: '#9A3412',
  selection: '#FFE8D9',
  selectionText: '#7C2D12',
  line: '#AEB6C1',
  controlBorder: '#5C6573',
  infoBackground: '#E1EEFF',
  infoText: '#0B3D7A',
  danger: '#B0102C',
  dangerBackground: '#FFE3E8',
  success: '#0E6B35',
  successBackground: '#DDF5E6',
  warning: '#7A4D00',
  warningBackground: '#FFF0C7',
  bg: '#EEF1F5',
  panel: '#FFFFFF',
  panel2: '#E3E7ED',
  hairline: '#C9D0D9',
  subtle: '#4A5260',
  red: '#C81E3A',
  green: '#0E6B35',
  yellow: '#7A4D00',
  blue: '#0B4FA0',
  orange: '#9A3412',
  purple: '#5B2DA8',
  neutral: '#3B4350',
  dangerBg: '#FFE3E8',
  focus: '#C2410C',
  disabled: '#5C6573',
  accent: '#C2410C',
  glass: '#FFFFFF',
  reflection: '#E3E7ED',
  overlay: '#0A0C10B3',
  shadow: '#0A0C10',
  auroraOpacity: 0,
};
export const fonts = {
  regular: 'Geist',
  medium: 'GeistMedium',
  semibold: 'GeistSemiBold',
  mono: 'GeistMono',
  monoMedium: 'GeistMonoMedium',
} as const;
export const spacing = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  page: 20,
  xl: 24,
  xxl: 32,
  xxxl: 40,
  touch: 48,
} as const;
export const radius = { input: 14, object: 18, sheet: 26, pill: 999 } as const;
export const typography = {
  title: { fontSize: 27, lineHeight: 33, fontFamily: fonts.semibold },
  section: { fontSize: 20, lineHeight: 26, fontFamily: fonts.semibold },
  body: { fontSize: 16, lineHeight: 23, fontFamily: fonts.regular },
  secondary: { fontSize: 14, lineHeight: 20, fontFamily: fonts.regular },
  caption: { fontSize: 13, lineHeight: 19, fontFamily: fonts.regular },
} as const;
export const motionMs = {
  press: 100,
  release: 140,
  tab: 180,
  sheetEnter: 200,
  sheetExit: 180,
  backdrop: 160,
  toast: 160,
  expand: 180,
} as const;
export function resolveTheme(preference: ThemePreference, system: string | null | undefined) {
  return preference === 'system' ? (system === 'dark' ? 'dark' : 'light') : preference;
}
export function oppositeTheme(mode: 'light' | 'dark') {
  return mode === 'dark' ? 'light' : 'dark';
}
export function isThemePreference(value: unknown): value is ThemePreference {
  return value === 'light' || value === 'dark' || value === 'system';
}
export function statusColor(key: string, c: Colors) {
  return (
    (
      {
        VERDE: c.green,
        AMARILLO: c.yellow,
        ROJO: c.danger,
        PENDIENTE: c.purple,
        RETIRADO: c.neutral,
        REINGRESADO: c.neutral,
      } as Record<string, string>
    )[key] || c.neutral
  );
}
