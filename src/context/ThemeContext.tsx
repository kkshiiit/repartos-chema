import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { ActivityIndicator, Platform, View, useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SystemUI from 'expo-system-ui';
import { StatusBar } from 'expo-status-bar';
import { useMotionPreferences } from '../hooks/useMotionPreferences';
import {
  dark,
  light,
  isThemePreference,
  oppositeTheme,
  resolveTheme,
  THEME_KEY,
  ThemePreference,
} from '../theme/tokens';
interface Value extends ReturnType<typeof useMotionPreferences> {
  preference: ThemePreference;
  mode: 'light' | 'dark';
  colors: typeof dark;
  error: string;
  setPreference: (value: ThemePreference) => void;
  toggle: () => void;
}
const Context = createContext<Value | null>(null);
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const system = useColorScheme();
  const motion = useMotionPreferences();
  const [preference, set] = useState<ThemePreference>('system'),
    [ready, setReady] = useState(false),
    [error, setError] = useState('');
  const writes = useRef(Promise.resolve());
  useEffect(() => {
    let active = true;
    void AsyncStorage.getItem(THEME_KEY)
      .then((v) => {
        if (active && isThemePreference(v)) set(v);
      })
      .catch(() => {
        if (active) setError('No se pudo leer la preferencia de apariencia.');
      })
      .finally(() => {
        if (active) setReady(true);
      });
    return () => {
      active = false;
    };
  }, []);
  const mode = resolveTheme(preference, system),
    colors = mode === 'dark' ? dark : light;
  const setPreference = useCallback((value: ThemePreference) => {
    set(value);
    setError('');
    writes.current = writes.current
      .catch(() => undefined)
      .then(() => AsyncStorage.setItem(THEME_KEY, value))
      .catch(() =>
        setError('El tema cambió, pero no pudo guardarse. Vuelve a elegirlo para reintentar.'),
      );
  }, []);
  useEffect(() => {
    if (Platform.OS !== 'web')
      void SystemUI.setBackgroundColorAsync(colors.bg).catch(() => undefined);
  }, [colors.bg]);
  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.documentElement.style.colorScheme = mode;
      document.documentElement.style.backgroundColor = colors.bg;
      document.documentElement.lang = 'es';
      document.body.style.backgroundColor = colors.bg;
      let meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
      if (!meta) {
        meta = document.createElement('meta');
        meta.name = 'theme-color';
        document.head.appendChild(meta);
      }
      meta.content = colors.bg;
      let css = document.getElementById('chema-focus');
      if (!css) {
        css = document.createElement('style');
        css.id = 'chema-focus';
        document.head.appendChild(css);
      }
      css.textContent = `:focus-visible{outline:3px solid ${colors.focus}!important;outline-offset:3px}input,textarea{caret-color:${colors.text}}`;
    }
  }, [mode, colors]);
  const value = useMemo(
    () => ({
      ...motion,
      preference,
      mode,
      colors,
      error,
      setPreference,
      toggle: () => setPreference(oppositeTheme(mode)),
    }),
    [preference, mode, colors, error, setPreference, motion],
  );
  return (
    <Context.Provider value={value}>
      <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
      {ready ? (
        children
      ) : (
        <View style={{ flex: 1, backgroundColor: colors.bg, justifyContent: 'center' }}>
          <ActivityIndicator accessibilityLabel="Cargando apariencia" color={colors.red} />
        </View>
      )}
    </Context.Provider>
  );
}
export function useTheme() {
  const c = useContext(Context);
  if (!c) throw new Error('Falta el proveedor de apariencia.');
  return c;
}
