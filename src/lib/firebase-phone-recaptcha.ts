import { initializeRecaptchaConfig } from "firebase/auth";
import {
  getFirebaseAuth,
  isLocalFirebaseHost,
  isPhoneAuthTestMode,
} from "@/lib/firebase";

const RECAPTCHA_CONFIG_TIMEOUT_MS = 15_000;

let recaptchaConfigPromise: Promise<void> | null = null;

function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(message)), ms);
    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((err: unknown) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

/**
 * Preload reCAPTCHA Enterprise config. Times out instead of hanging forever.
 * On failure, phone auth falls back to reCAPTCHA v2 via RecaptchaVerifier.
 */
export function ensureRecaptchaConfig(): Promise<void> {
  if (isPhoneAuthTestMode() || isLocalFirebaseHost()) {
    return Promise.resolve();
  }

  if (!recaptchaConfigPromise) {
    recaptchaConfigPromise = withTimeout(
      initializeRecaptchaConfig(getFirebaseAuth()),
      RECAPTCHA_CONFIG_TIMEOUT_MS,
      "reCAPTCHA Enterprise config timed out"
    )
      .then(() => undefined)
      .catch((err: unknown) => {
        recaptchaConfigPromise = null;
        console.warn(
          "[Firebase] initializeRecaptchaConfig skipped, using reCAPTCHA v2:",
          err
        );
      });
  }

  return recaptchaConfigPromise;
}

export function resetRecaptchaConfigCache(): void {
  recaptchaConfigPromise = null;
}
