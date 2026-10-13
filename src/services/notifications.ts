import { Platform } from 'react-native';
import { httpsCallable } from 'firebase/functions';
import { DATA_MODE, firebase } from './firebase';
export async function enableNotifications() {
  if (DATA_MODE === 'demo')
    throw new Error('Modo demo: avisos guardados como pendientes; FCM no está configurado.');
  if (Platform.OS !== 'web')
    throw new Error(
      'FCM nativo requiere un development build y el puente de mensajería. Consulta docs/FIREBASE.md.',
    );
  if (!process.env.EXPO_PUBLIC_FIREBASE_VAPID_KEY)
    throw new Error('Falta la clave pública VAPID y configurar el service worker.');
  const messaging = await import('firebase/messaging');
  if (!(await messaging.isSupported())) throw new Error('Este navegador no admite FCM.');
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') throw new Error('Notificaciones no autorizadas.');
  const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
    scope: '/push/',
  });
  const token = await messaging.getToken(messaging.getMessaging(firebase().app), {
    vapidKey: process.env.EXPO_PUBLIC_FIREBASE_VAPID_KEY,
    serviceWorkerRegistration: registration,
  });
  if (!token) throw new Error('No se obtuvo un token FCM.');
  await httpsCallable(firebase().functions, 'registerPushToken')({ token });
}
