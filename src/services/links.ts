import { Linking } from 'react-native';
export async function openLink(url: string) {
  if (!/^https:\/\//.test(url)) throw new Error('Enlace no permitido.');
  try {
    await Linking.openURL(url);
  } catch {
    throw new Error('No se pudo abrir el enlace. Revisa las aplicaciones disponibles.');
  }
}
