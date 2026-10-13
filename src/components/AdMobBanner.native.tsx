import React, { useEffect, useState } from 'react';
import { Platform, View, Text } from 'react-native';
import { adTestMode } from '../context/AdsContext';
import { bannerId } from '../services/adsPolicy';
import { C } from './ui';
type SDK = typeof import('react-native-google-mobile-ads');
export function AdMobBanner() {
  const [sdk, setSdk] = useState<SDK | null>(null),
    [failed, setFailed] = useState(false);
  useEffect(() => {
    let active = true;
    void import('react-native-google-mobile-ads')
      .then((value) => {
        if (active) setSdk(value);
      })
      .catch(() => {
        if (active) setFailed(true);
      });
    return () => {
      active = false;
    };
  }, []);
  if (!sdk || failed) return null;
  const test = __DEV__ || adTestMode;
  const unit = bannerId(
    Platform.OS,
    test,
    Platform.OS === 'ios'
      ? process.env.EXPO_PUBLIC_ADMOB_IOS_BANNER_ID
      : process.env.EXPO_PUBLIC_ADMOB_ANDROID_BANNER_ID,
    sdk.TestIds.BANNER,
  );
  if (!unit) return null;
  const Banner = sdk.BannerAd;
  return (
    <View
      style={{
        alignItems: 'center',
        gap: 6,
        marginTop: 20,
        paddingTop: 16,
        borderTopWidth: 1,
        borderColor: C.line,
      }}
    >
      <Text style={{ color: C.subtle, fontSize: 10 }}>
        {test ? 'Publicidad · anuncio de prueba' : 'Publicidad'}
      </Text>
      <View style={{ minHeight: 50 }}>
        <Banner
          unitId={unit}
          size={sdk.BannerAdSize.BANNER}
          requestOptions={{ requestNonPersonalizedAdsOnly: true }}
          onAdFailedToLoad={() => setFailed(true)}
        />
      </View>
    </View>
  );
}
