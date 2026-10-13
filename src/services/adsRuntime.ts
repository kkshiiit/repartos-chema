export async function prepareAdMob(): Promise<void> {
  throw new Error(
    'AdMob requiere una versión Android o iOS. En web puedes configurar patrocinio directo.',
  );
}
export async function adPrivacyOptions(): Promise<void> {
  throw new Error('Este entorno no usa el consentimiento de AdMob.');
}
