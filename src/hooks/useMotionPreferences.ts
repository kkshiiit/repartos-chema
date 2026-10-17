import { useCallback, useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
export type MotionPreference = 'ambient' | 'static';
export const MOTION_KEY = 'chema:motion:v1';

/** Defaults to still until both the accessibility preference and saved setting are known. */
export function useMotionPreferences() {
  const [motionPreference, setPreference] = useState<MotionPreference>('ambient');
  const [reduceMotion, setReduceMotion] = useState(true);
  const [active, setActive] = useState(AppState.currentState === 'active');
  const [ready, setReady] = useState(false);
  const [motionError, setError] = useState('');
  const writes = useRef(Promise.resolve());
  const onPreferenceChange = useRef(() => {});
  useEffect(() => {
    let mounted = true;
    let receivedReduceEvent = false;
    let changedPreference = false;
    const app = AppState.addEventListener('change', (state) => setActive(state === 'active'));
    const reduce = AccessibilityInfo.addEventListener('reduceMotionChanged', (value) => {
      receivedReduceEvent = true;
      if (mounted) setReduceMotion(value);
    });
    void AccessibilityInfo.isReduceMotionEnabled()
      .then((value) => {
        if (mounted && !receivedReduceEvent) setReduceMotion(value);
      })
      .catch(() => undefined);
    void AsyncStorage.getItem(MOTION_KEY)
      .then((value) => {
        if (mounted && !changedPreference && (value === 'ambient' || value === 'static'))
          setPreference(value);
      })
      .catch(() => {
        if (mounted) setError('No se pudo leer la preferencia de movimiento.');
      })
      .finally(() => {
        if (mounted) setReady(true);
      });
    // A selection made while storage loads takes priority over the old value.
    onPreferenceChange.current = () => {
      changedPreference = true;
    };
    return () => {
      mounted = false;
      app.remove();
      reduce.remove();
    };
  }, []);
  const setMotionPreference = useCallback((value: MotionPreference) => {
    onPreferenceChange.current();
    setPreference(value);
    setError('');
    writes.current = writes.current
      .catch(() => undefined)
      .then(() => AsyncStorage.setItem(MOTION_KEY, value))
      .catch(() => {
        setError(
          'El movimiento cambió, pero no pudo guardarse. Vuelve a elegirlo para reintentar.',
        );
      });
  }, []);
  const motionEnabled = ready && active && !reduceMotion && motionPreference === 'ambient';
  return {
    motionPreference,
    setMotionPreference,
    reduceMotion,
    motionEnabled,
    ambientEnabled: motionEnabled,
    motionError,
  };
}
