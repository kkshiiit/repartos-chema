export type ThemePreference = 'light' | 'dark' | 'system';
export const THEME_KEY = 'chema:theme:v1';
export const brand = {
  red: '#C8102E',
  ink: '#15191E',
  concrete: '#F2F3F5',
  white: '#FFFFFF',
};
/**
 * Noche: gris acero oscuro (no negro puro), texto claro y el rojo de la marca un punto más
 * luminoso para que mantenga contraste sobre fondo oscuro.
 */
export const dark = {
  background: '#0F1216',
  surface: '#181C22',
  surfaceMuted: '#20252D',
  text: '#EEF1F4',
  muted: '#A6AFBB',
  primary: '#2563EB',
  onPrimary: '#FFFFFF',
  onDanger: '#FFFFFF',
  link: '#8AB6FF',
  selection: '#16233A',
  selectionText: '#A8CBFF',
  line: '#2C323B',
  controlBorder: '#6B7480',
  infoBackground: '#14243A',
  infoText: '#A8CBFF',
  danger: '#FF6B7D',
  dangerBackground: '#3A1219',
  success: '#5FD38D',
  successBackground: '#10301F',
  warning: '#F7B955',
  warningBackground: '#36280C',
  bg: '#0F1216',
  panel: '#181C22',
  panel2: '#20252D',
  hairline: '#262C34',
  subtle: '#8B95A2',
  red: '#E0213F',
  green: '#5FD38D',
  yellow: '#F7B955',
  blue: '#8AB6FF',
  orange: '#F7B955',
  purple: '#C4A6FF',
  neutral: '#A6AFBB',
  dangerBg: '#3A1219',
  focus: '#8AB6FF',
  disabled: '#8B95A2',
  accent: '#8AB6FF',
  glass: '#181C22',
  reflection: '#20252D',
  overlay: '#000000B8',
  shadow: '#000000',
  auroraOpacity: 0,
  /** Franja de marca (cabecera). */
  band: '#1A1E25',
  onBand: '#FFFFFF',
  onBandMuted: '#C9CFD7',
};
export type Colors = typeof dark;
/**
 * Sol: gris hormigón claro con tarjetas blancas y tinta casi negra.
 * Un solo color de acción (azul de señal obligatoria): los botones que hacen algo son azules.
 * El rojo queda reservado a lo urgente (atrasos, borrar) y a la marca, para que salte a la vista.
 */
export const light: Colors = {
  background: '#F2F3F5',
  surface: '#FFFFFF',
  surfaceMuted: '#E9ECEF',
  text: '#15191E',
  muted: '#4F5864',
  primary: '#1A56DB',
  onPrimary: '#FFFFFF',
  onDanger: '#FFFFFF',
  link: '#1A56DB',
  selection: '#E7EEFC',
  selectionText: '#123F87',
  line: '#D5DAE0',
  controlBorder: '#737C88',
  infoBackground: '#E6EFFD',
  infoText: '#123F87',
  danger: '#B0102C',
  dangerBackground: '#FCE8EB',
  success: '#12703A',
  successBackground: '#E3F4EA',
  warning: '#8A4B00',
  warningBackground: '#FFF2D6',
  bg: '#F2F3F5',
  panel: '#FFFFFF',
  panel2: '#E9ECEF',
  hairline: '#E1E5EA',
  subtle: '#5E6773',
  red: '#C8102E',
  green: '#12703A',
  yellow: '#8A4B00',
  blue: '#1A56DB',
  orange: '#8A4B00',
  purple: '#6D28D9',
  neutral: '#4F5864',
  dangerBg: '#FCE8EB',
  focus: '#1A56DB',
  disabled: '#8A939E',
  accent: '#1A56DB',
  glass: '#FFFFFF',
  reflection: '#E9ECEF',
  overlay: '#15191EB3',
  shadow: '#15191E',
  auroraOpacity: 0,
  band: '#15191E',
  onBand: '#FFFFFF',
  onBandMuted: '#C9CFD7',
};
/**
 * Barlow: letra de cartelería vial, clara a pleno sol. Condensed para títulos y números grandes,
 * con el mismo carácter angosto y fuerte del logo.
 */
export const fonts = {
  regular: 'Barlow',
  medium: 'BarlowMedium',
  semibold: 'BarlowSemiBold',
  bold: 'BarlowBold',
  display: 'BarlowCondensedBold',
  displaySemi: 'BarlowCondensedSemiBold',
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
  title: { fontSize: 28, lineHeight: 32, fontFamily: fonts.display },
  section: { fontSize: 20, lineHeight: 24, fontFamily: fonts.display },
  body: { fontSize: 16, lineHeight: 22, fontFamily: fonts.regular },
  secondary: { fontSize: 14, lineHeight: 20, fontFamily: fonts.regular },
  caption: { fontSize: 13, lineHeight: 18, fontFamily: fonts.medium },
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
