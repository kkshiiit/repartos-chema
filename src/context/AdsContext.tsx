import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';
import { prepareAdMob, adPrivacyOptions } from '../services/adsRuntime';
import { sponsorLink, AdProvider } from '../services/adsPolicy';
const configured = process.env.EXPO_PUBLIC_ADS_PROVIDER;
export const adProvider: AdProvider =
  configured === 'admob' || configured === 'sponsor' ? configured : 'none';
export const adTestMode = process.env.EXPO_PUBLIC_ADS_TEST_MODE !== 'false';
export const sponsor = {
  name: process.env.EXPO_PUBLIC_SPONSOR_NAME || '',
  text: process.env.EXPO_PUBLIC_SPONSOR_TEXT || '',
  url: sponsorLink(process.env.EXPO_PUBLIC_SPONSOR_URL || ''),
};
interface AdsValue {
  enabled: boolean;
  error: string;
  setEnabled: (enabled: boolean) => Promise<void>;
  privacy: () => Promise<void>;
}
const Context = createContext<AdsValue | null>(null);
const validateAds = async () => {
  if (adProvider === 'none')
    throw new Error('Publicidad pendiente de configurar. Consulta docs/PUBLICIDAD.md.');
  if (adProvider === 'sponsor' && (!sponsor.name || !sponsor.text || !sponsor.url))
    throw new Error('Completa nombre, texto y enlace HTTPS del patrocinador.');
  if (adProvider === 'admob') await prepareAdMob();
};
export function AdsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [enabled, setEnabledState] = useState(false),
    [error, setError] = useState('');

  useEffect(() => {
    if (!user?.uid) return;
    let active = true;
    void AsyncStorage.getItem('chema:ads-enabled')
      .then(async (value) => {
        if (value === 'true') {
          await validateAds();
          if (active) setEnabledState(true);
        }
      })
      .catch((e) => {
        if (active) setError(e instanceof Error ? e.message : 'No se pudo cargar publicidad.');
      });
    return () => {
      active = false;
    };
  }, [user?.uid]);
  const value: AdsValue = {
    enabled,
    error,
    setEnabled: async (value) => {
      if (user?.role !== 'ADMIN') throw new Error('Solo administración configura la publicidad.');
      if (value) await validateAds();
      await AsyncStorage.setItem('chema:ads-enabled', String(value));
      setEnabledState(value);
      setError('');
    },
    privacy: async () => {
      await adPrivacyOptions();
      await AsyncStorage.setItem('chema:ads-enabled', 'false');
      setEnabledState(false);
    },
  };
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useAds() {
  const value = useContext(Context);
  if (!value) throw new Error('Falta contexto de publicidad.');
  return value;
}
