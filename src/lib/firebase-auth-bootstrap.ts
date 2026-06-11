import { getClientFirebaseAuth } from "@/lib/firebase-app";
import { initializeRecaptchaConfig } from "firebase/auth";

let authRecaptchaBootstrapPromise: Promise<void> | null = null;

/** Preload Auth reCAPTCHA Enterprise config so phone SMS does not fall back to broken v2 keys. */
export function bootstrapFirebaseAuthRecaptcha(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (authRecaptchaBootstrapPromise) return authRecaptchaBootstrapPromise;

  authRecaptchaBootstrapPromise = (async () => {
    const auth = getClientFirebaseAuth();
    if (!auth) return;
    await initializeRecaptchaConfig(auth);
  })().catch((err) => {
    authRecaptchaBootstrapPromise = null;
    console.warn(
      "[Auth] reCAPTCHA Enterprise preload failed; phone auth may fall back to v2.",
      err
    );
  });

  return authRecaptchaBootstrapPromise;
}
