import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from "firebase/app-check";
import type { Auth } from "firebase/auth";
import { browserLocalPersistence, getAuth, initializeAuth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";

declare global {
  interface Window { FIREBASE_APPCHECK_DEBUG_TOKEN?: boolean | string; }
}

const firebaseAuthByApp = new WeakMap<FirebaseApp, Auth>();
let appCheckInitialized = false;

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
  const app = initializeApp({
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
  });
  // App Check is required for phone auth on web with Firebase SDK v11+.
  //
  // PRODUCTION: set NEXT_PUBLIC_RECAPTCHA_ENTERPRISE_SITE_KEY (see .env.example).
  // DEVELOPMENT: set NEXT_PUBLIC_FIREBASE_APPCHECK_DEBUG_TOKEN=true, then copy
  //   the UUID printed to the browser console and register it in:
  //   Firebase Console → App Check → Apps → (your web app) → Debug tokens → Add.
  if (typeof window !== "undefined" && !appCheckInitialized) {
    const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_ENTERPRISE_SITE_KEY;
    const debugToken = process.env.NEXT_PUBLIC_FIREBASE_APPCHECK_DEBUG_TOKEN;

    if (siteKey || debugToken) {
      if (debugToken) {
        window.FIREBASE_APPCHECK_DEBUG_TOKEN =
          debugToken === "true" ? true : debugToken;
      }
      try {
        initializeAppCheck(app, {
          provider: new ReCaptchaEnterpriseProvider(siteKey ?? "debug"),
          isTokenAutoRefreshEnabled: Boolean(siteKey),
        });
      } catch {
        /* hot-reload: already initialized */
      }
      appCheckInitialized = true;
    }
  }
  return app;
}

/** Browser-only Auth (Next.js–safe singleton per Firebase app). */
export function getClientFirebaseAuth(): Auth | null {
  if (typeof window === "undefined") return null;
  const app = getFirebaseApp();
  if (!app) return null;
  const cached = firebaseAuthByApp.get(app);
  if (cached) return cached;
  let auth: Auth;
  try {
    auth = initializeAuth(app, { persistence: browserLocalPersistence });
  } catch {
    auth = getAuth(app);
  }
  firebaseAuthByApp.set(app, auth);
  return auth;
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
