export type ThemePreference = 'light' | 'dark' | 'system';
export const THEME_KEY = 'chema:theme:v1';
export const brand = {
  pink: '#FF2BD6',
  red: '#FF304F',
  violet: '#A100FF',
  purple: '#6E18D9',
  black: '#08070D',
  white: '#FFFFFF',
};
export const dark = {
  bg: '#08070D',
  panel: '#15121F',
  panel2: '#211B2D',
  line: '#83718F',
  hairline: '#41324F',
  text: '#F4F6FA',
  muted: '#B5C2D5',
  subtle: '#A4B3C9',
  red: '#BD1838',
  onPrimary: '#FFFFFF',
  green: '#4ADE80',
  yellow: '#FACC15',
  blue: '#83B9FC',
  orange: '#FDBA74',
  purple: '#B7BCFF',
  danger: '#FDA4AF',
  neutral: '#CBD5E1',
  dangerBg: '#402333',
  selection: '#342044',
  focus: '#F8ADFF',
  overlay: '#000000AA',
  shadow: '#000000',
  disabled: '#9CAAC0',
  primary: '#6E18D9',
  accent: '#FF91E8',
  glass: '#15121FF2',
  reflection: '#FFFFFF14',
  auroraOpacity: 0.23,
};
export type Colors = typeof dark;
export const light: Colors = {
  bg: '#FAF7FC',
  panel: '#FFFFFF',
  panel2: '#F2ECF7',
  line: '#887593',
  hairline: '#DCD0E5',
  text: '#172033',
  muted: '#3F4D62',
  subtle: '#4E5E73',
  red: '#BD1838',
  onPrimary: '#FFFFFF',
  green: '#146534',
  yellow: '#785000',
  blue: '#1554A0',
  orange: '#92400E',
  purple: '#5540A3',
  danger: '#A71936',
  neutral: '#40516A',
  dangerBg: '#FBE7EB',
  selection: '#EEDDFA',
  focus: '#6E18D9',
  overlay: '#0F172A99',
  shadow: '#0F172A',
  disabled: '#536075',
  primary: '#6E18D9',
  accent: '#8A1470',
  glass: '#FFFFFFF2',
  reflection: '#FFFFFFD9',
  auroraOpacity: 0.12,
};
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
