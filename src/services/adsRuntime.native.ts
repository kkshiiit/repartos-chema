import Constants, { ExecutionEnvironment } from 'expo-constants';
export async function prepareAdMob(): Promise<void> {
  if (Constants.executionEnvironment === ExecutionEnvironment.StoreClient)
    throw new Error(
      'AdMob no funciona en Expo Go. Usa un development build con la configuración de anuncios.',
    );
  const sdk = await import('react-native-google-mobile-ads');
  const consent = await sdk.AdsConsent.gatherConsent();
  if (!consent.canRequestAds)
    throw new Error(
      'Sin autorización para solicitar anuncios. La operación seguirá funcionando sin publicidad.',
    );
  await sdk.default().setRequestConfiguration({ maxAdContentRating: sdk.MaxAdContentRating.G });
  await sdk.default().initialize();
}
export async function adPrivacyOptions(): Promise<void> {
  const sdk = await import('react-native-google-mobile-ads');
  await sdk.AdsConsent.showPrivacyOptionsForm();
}
