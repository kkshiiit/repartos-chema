export type ThemePreference = 'light' | 'dark' | 'system';
export const THEME_KEY = 'chema:theme:v1';
export const brand = {
  cobalto: '#335CFF',
  ink: '#18232D',
  paper: '#F4F2EC',
  pink: '#335CFF',
  red: '#A83B34',
  violet: '#2447CF',
  purple: '#2447CF',
  black: '#121A22',
  white: '#FFFFFF',
};
export const dark = {
  background: '#121A22',
  surface: '#1D2732',
  surfaceMuted: '#263341',
  text: '#F1F0E8',
  muted: '#A8B5C2',
  primary: '#335CFF',
  onPrimary: '#FFFFFF',
  link: '#B8CBFF',
  selection: '#283B64',
  selectionText: '#D3DFFF',
  line: '#8493A3',
  controlBorder: '#8493A3',
  infoBackground: '#332F29',
  infoText: '#E6CEAB',
  danger: '#E59C91',
  dangerBackground: '#3D2529',
  success: '#92CFB0',
  successBackground: '#19382F',
  warning: '#E3B76C',
  warningBackground: '#392E1D',
  bg: '#121A22',
  panel: '#1D2732',
  panel2: '#263341',
  hairline: '#3E4A59',
  subtle: '#A8B5C2',
  red: '#A83B34',
  green: '#92CFB0',
  yellow: '#E3B76C',
  blue: '#B8CBFF',
  orange: '#E3B76C',
  purple: '#B8CBFF',
  neutral: '#A8B5C2',
  dangerBg: '#3D2529',
  focus: '#D3DFFF',
  disabled: '#A8B5C2',
  accent: '#B8CBFF',
  glass: '#1D2732',
  reflection: '#1D2732',
  overlay: '#00000099',
  shadow: '#000000',
  auroraOpacity: 0,
};
export type Colors = typeof dark;
export const light: Colors = {
  background: '#F4F2EC',
  surface: '#FFFFFF',
  surfaceMuted: '#ECEAE4',
  text: '#18232D',
  muted: '#62717A',
  primary: '#335CFF',
  onPrimary: '#FFFFFF',
  link: '#2447CF',
  selection: '#E8EEFF',
  selectionText: '#2447CF',
  line: '#7D8792',
  controlBorder: '#7D8792',
  infoBackground: '#F5EBDD',
  infoText: '#654824',
  danger: '#A83B34',
  dangerBackground: '#F8E5E0',
  success: '#1E6A51',
  successBackground: '#E1F0E8',
  warning: '#8A4D00',
  warningBackground: '#FAEBCF',
  bg: '#F4F2EC',
  panel: '#FFFFFF',
  panel2: '#ECEAE4',
  hairline: '#D6DADE',
  subtle: '#62717A',
  red: '#A83B34',
  green: '#1E6A51',
  yellow: '#8A4D00',
  blue: '#2447CF',
  orange: '#8A4D00',
  purple: '#2447CF',
  neutral: '#62717A',
  dangerBg: '#F8E5E0',
  focus: '#2447CF',
  disabled: '#62717A',
  accent: '#2447CF',
  glass: '#FFFFFF',
  reflection: '#FFFFFF',
  overlay: '#00000099',
  shadow: '#000000',
  auroraOpacity: 0,
};
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
export const radius = { input: 12, object: 16, sheet: 24, pill: 999 } as const;
export const typography = {
  title: { fontSize: 28, lineHeight: 34 },
  section: { fontSize: 19, lineHeight: 25 },
  body: { fontSize: 16, lineHeight: 23 },
  secondary: { fontSize: 14, lineHeight: 20 },
  caption: { fontSize: 12, lineHeight: 17 },
} as const;
export const motionMs = {
  press: 100,
  release: 140,
  tab: 180,
  sheetEnter: 240,
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
