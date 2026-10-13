import type { ConfigContext, ExpoConfig } from 'expo/config';
// IDs públicos de demostración publicados por Google en sus guías de inicio.
// No pertenecen a Grupo Chema y no generan ingresos.
const googleSampleAppIds = {
  android: 'ca-app-pub-3940256099942544~3347511713',
  ios: 'ca-app-pub-3940256099942544~1458002511',
};
export default ({ config }: ConfigContext): ExpoConfig => {
  const live =
    process.env.EXPO_PUBLIC_ADS_PROVIDER === 'admob' &&
    process.env.EXPO_PUBLIC_ADS_TEST_MODE === 'false';
  const android = process.env.ADMOB_ANDROID_APP_ID,
    ios = process.env.ADMOB_IOS_APP_ID;
  if (
    live &&
    (!android ||
      !ios ||
      !process.env.EXPO_PUBLIC_ADMOB_ANDROID_BANNER_ID ||
      !process.env.EXPO_PUBLIC_ADMOB_IOS_BANNER_ID)
  )
    throw new Error(
      'AdMob real: completa App IDs y Banner IDs de ambas plataformas antes de compilar.',
    );
  return {
    ...config,
    name: config.name || 'Repartos Chema',
    slug: config.slug || 'repartos-chema',
    plugins: [
      ...(config.plugins || []),
      [
        'react-native-google-mobile-ads',
        {
          androidAppId: android || googleSampleAppIds.android,
          iosAppId: ios || googleSampleAppIds.ios,
          delayAppMeasurementInit: true,
        },
      ],
    ],
  };
};
