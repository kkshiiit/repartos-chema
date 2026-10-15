import { Platform } from 'react-native';
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, initializeAuth } from 'firebase/auth';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  memoryLocalCache,
  doc,
  getDocFromServer,
} from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getStorage } from 'firebase/storage';
import { authPersistence } from './authPersistence';
import type { AppState, Operation } from '../types';
import type { RemoteAdapter } from '../data/repository';
export const DATA_MODE = process.env.EXPO_PUBLIC_DATA_MODE === 'firebase' ? 'firebase' : 'demo';
const config = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};
function createServices() {
  if (Object.values(config).some((v) => !v))
    throw new Error('Firebase sin configurar. Completa .env o selecciona modo demo.');
  const app = getApps()[0] || initializeApp(config);
  let auth;
  try {
    auth = initializeAuth(app, { persistence: authPersistence });
  } catch (e) {
    if ((e as { code?: string }).code !== 'auth/already-initialized') throw e;
    auth = getAuth(app);
  }
  const db = initializeFirestore(app, {
    localCache:
      Platform.OS === 'web'
        ? persistentLocalCache({ tabManager: persistentMultipleTabManager() })
        : memoryLocalCache(),
  });
  return {
    app,
    auth,
    db,
    storage: getStorage(app),
    functions: getFunctions(
      app,
      process.env.EXPO_PUBLIC_FIREBASE_FUNCTIONS_REGION || 'us-central1',
    ),
  };
}
let cached: ReturnType<typeof createServices> | undefined;
export function firebase() {
  if (DATA_MODE !== 'firebase') throw new Error('Función disponible al configurar Firebase.');
  return (cached ??= createServices());
}
export const cloudAdapter: RemoteAdapter = {
  async fetch() {
    const snap = await getDocFromServer(doc(firebase().db, 'system', 'state'));
    if (!snap.exists()) throw new Error('Ejecuta la inicialización del backend.');
    return snap.data() as AppState;
  },
  async commit(operation: Operation) {
    if (firebase().auth.currentUser?.uid !== operation.actor.uid)
      throw new Error(
        'La operación pertenece a otra sesión. Vuelve al acceso original para revisar sus pendientes.',
      );
    if (operation.action.type === 'PHOTO' && operation.action.photo.status !== 'SYNCED') {
      const { uploadPhoto } = await import('./storageService');
      operation = {
        ...operation,
        action: {
          ...operation.action,
          photo: await uploadPhoto(operation.action.obraId, operation.action.photo),
        },
      };
    }
    const call = httpsCallable<{ id: string; action: Operation['action'] }, AppState>(
      firebase().functions,
      'applyMovement',
    );
    return (await call({ id: operation.id, action: operation.action })).data;
  },
};
