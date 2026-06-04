import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID ?? '',
};

export const hasFirebaseConfig = (): boolean =>
  config.apiKey !== '' && config.projectId !== '';

let db: ReturnType<typeof getFirestore> | null = null;

export function getDb() {
  if (db) return db;
  if (!hasFirebaseConfig()) return null;
  const app = initializeApp(config);
  db = getFirestore(app);
  return db;
}
