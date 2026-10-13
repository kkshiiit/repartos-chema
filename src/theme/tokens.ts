export type ThemePreference = 'light' | 'dark' | 'system';
export const THEME_KEY = 'chema:theme:v1';
export const dark = {
  bg: '#0F172A',
  panel: '#172235',
  panel2: '#1C2940',
  line: '#63738D',
  text: '#F4F6FA',
  muted: '#B5C2D5',
  subtle: '#A4B3C9',
  red: '#D32F2F',
  onPrimary: '#FFFFFF',
  green: '#4ADE80',
  yellow: '#FACC15',
  blue: '#83B9FC',
  orange: '#FDBA74',
  purple: '#B7BCFF',
  danger: '#FDA4AF',
  neutral: '#CBD5E1',
  dangerBg: '#402333',
  selection: '#263B55',
  focus: '#9AC8FF',
  overlay: '#000000AA',
  shadow: '#000000',
  disabled: '#9CAAC0',
};
export type Colors = typeof dark;
export const light: Colors = {
  bg: '#F1F4F8',
  panel: '#FFFFFF',
  panel2: '#E7EDF4',
  line: '#78889C',
  text: '#172033',
  muted: '#3F4D62',
  subtle: '#4E5E73',
  red: '#D32F2F',
  onPrimary: '#FFFFFF',
  green: '#146534',
  yellow: '#785000',
  blue: '#1554A0',
  orange: '#92400E',
  purple: '#5540A3',
  danger: '#A71936',
  neutral: '#40516A',
  dangerBg: '#FBE7EB',
  selection: '#DAE8FA',
  focus: '#145AB4',
  overlay: '#0F172A99',
  shadow: '#0F172A',
  disabled: '#536075',
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
