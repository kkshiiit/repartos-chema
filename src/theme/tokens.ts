export type ThemePreference = 'light' | 'dark' | 'system';
export const THEME_KEY = 'chema:theme:v1';
export const brand = {
  cobalto: '#3FD6C6',
  ink: '#151719',
  paper: '#F5F6F7',
  pink: '#3FD6C6',
  red: '#B52B40',
  violet: '#006D62',
  purple: '#006D62',
  black: '#050505',
  white: '#FFFFFF',
};
export const dark = {
  background: '#050505',
  surface: '#0E0E0E',
  surfaceMuted: '#181818',
  text: '#F2F2F2',
  muted: '#A6A9AD',
  primary: '#F2F2F2',
  onPrimary: '#050505',
  onDanger: '#FFFFFF',
  link: '#B3E8E0',
  selection: '#15332E',
  selectionText: '#B3E8E0',
  line: '#303030',
  controlBorder: '#777D85',
  infoBackground: '#19272C',
  infoText: '#B3D7E6',
  danger: '#FFA6B4',
  dangerBackground: '#341A21',
  success: '#A0DEC1',
  successBackground: '#142E24',
  warning: '#F2CA78',
  warningBackground: '#302719',
  bg: '#050505',
  panel: '#0E0E0E',
  panel2: '#181818',
  hairline: '#303030',
  subtle: '#A6A9AD',
  red: '#B52B40',
  green: '#A0DEC1',
  yellow: '#F2CA78',
  blue: '#A8C9FF',
  orange: '#F4BE91',
  purple: '#D0BCFF',
  neutral: '#A6A9AD',
  dangerBg: '#341A21',
  focus: '#3FD6C6',
  disabled: '#A6A9AD',
  accent: '#3FD6C6',
  glass: '#0E0E0E',
  reflection: '#181818',
  overlay: '#000000B3',
  shadow: '#000000',
  auroraOpacity: 0,
};
export type Colors = typeof dark;
export const light: Colors = {
  background: '#F5F6F7',
  surface: '#FFFFFF',
  surfaceMuted: '#ECEFF1',
  text: '#151719',
  muted: '#52575E',
  primary: '#151719',
  onPrimary: '#FFFFFF',
  onDanger: '#FFFFFF',
  link: '#006D62',
  selection: '#DCF1EB',
  selectionText: '#005C50',
  line: '#CBD0D5',
  controlBorder: '#7A8087',
  infoBackground: '#EAF1F5',
  infoText: '#315364',
  danger: '#A51F38',
  dangerBackground: '#FCE9ED',
  success: '#206344',
  successBackground: '#E5F3EA',
  warning: '#79500B',
  warningBackground: '#FFF1D5',
  bg: '#F5F6F7',
  panel: '#FFFFFF',
  panel2: '#ECEFF1',
  hairline: '#CBD0D5',
  subtle: '#52575E',
  red: '#B52B40',
  green: '#206344',
  yellow: '#79500B',
  blue: '#285A97',
  orange: '#8A4C1B',
  purple: '#6C3E9F',
  neutral: '#52575E',
  dangerBg: '#FCE9ED',
  focus: '#006D62',
  disabled: '#52575E',
  accent: '#006D62',
  glass: '#FFFFFF',
  reflection: '#ECEFF1',
  overlay: '#00000099',
  shadow: '#000000',
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
export const radius = { input: 12, object: 16, sheet: 24, pill: 999 } as const;
export const typography = {
  title: { fontSize: 28, lineHeight: 34, fontFamily: fonts.semibold },
  section: { fontSize: 22, lineHeight: 28, fontFamily: fonts.semibold },
  body: { fontSize: 15, lineHeight: 22, fontFamily: fonts.regular },
  secondary: { fontSize: 13, lineHeight: 19, fontFamily: fonts.regular },
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
