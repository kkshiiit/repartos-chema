/// <reference lib="webworker" />
import { initializeApp } from 'firebase/app';
import { getMessaging, onBackgroundMessage } from 'firebase/messaging/sw';
declare const __FIREBASE_CONFIG__: Record<string, string>;
const worker = self as unknown as ServiceWorkerGlobalScope;
if (__FIREBASE_CONFIG__.apiKey) {
  const messaging = getMessaging(initializeApp(__FIREBASE_CONFIG__));
  onBackgroundMessage(messaging, (payload) => {
    if (!payload.notification)
      void worker.registration.showNotification('Repartos Chema', {
        body: payload.data?.message || 'Nuevo evento de logística',
        tag: payload.data?.eventId,
        data: { obraId: payload.data?.obraId },
      });
  });
}
worker.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const data = event.notification.data;
  const id = data?.obraId || data?.FCM_MSG?.data?.obraId;
  const path = typeof id === 'string' && /^[\w-]+$/.test(id) ? `/obra/${id}` : '/';
  event.waitUntil(worker.clients.openWindow(path));
});
