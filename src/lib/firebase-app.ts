import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";

function envReady(value: string | undefined): boolean {
  return Boolean(value && value.trim());
}

export function isFirebaseConfigured(): boolean {
  return (
    envReady(process.env.NEXT_PUBLIC_FIREBASE_API_KEY) &&
    envReady(process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN) &&
    envReady(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) &&
    envReady(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET) &&
    envReady(process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID) &&
    envReady(process.env.NEXT_PUBLIC_FIREBASE_APP_ID)
  );
}

export function getFirebaseApp(): FirebaseApp | null {
  if (!isFirebaseConfigured()) return null;
  if (getApps().length > 0) return getApps()[0]!;
  return initializeApp({
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
  });
}

export function getFirestoreDb(): Firestore | null {
  const app = getFirebaseApp();
  if (!app) return null;
  return getFirestore(app);
}

export function getFirebaseStorage(): FirebaseStorage | null {
  const app = getFirebaseApp();
  if (!app) return null;
  return getStorage(app);
}
