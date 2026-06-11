/**
 * Must run before Firebase App Check initializes.
 * Import this module once on the client (see Providers.tsx).
 */
declare global {
  interface Window {
    FIREBASE_APPCHECK_DEBUG_TOKEN?: boolean | string;
  }
}

function bootstrapFirebaseAppCheckDebug(): void {
  if (typeof window === "undefined") return;
  const debugToken = process.env.NEXT_PUBLIC_FIREBASE_APPCHECK_DEBUG_TOKEN?.trim();
  if (!debugToken) return;

  window.FIREBASE_APPCHECK_DEBUG_TOKEN =
    debugToken === "true" ? true : debugToken;

  if (debugToken === "true" && process.env.NODE_ENV === "development") {
    console.info(
      "[App Check] Debug mode on. After reload, copy the UUID from the next console line starting with " +
        '"App Check debug token:" and add it under Firebase Console → App Check → your Web app → Manage debug tokens.'
    );
  }
}

bootstrapFirebaseAppCheckDebug();
