import type { Auth } from "firebase/auth";
import { getClientFirebaseAuth, isFirebaseConfigured } from "@/lib/firebase-app";

export { isFirebaseConfigured };

export const RECAPTCHA_CONTAINER_ID = "recaptcha-container";

/** Only true when NEXT_PUBLIC_FIREBASE_PHONE_TEST_MODE=true — must be off for real SMS. */
export function isPhoneAuthTestMode(): boolean {
  return process.env.NEXT_PUBLIC_FIREBASE_PHONE_TEST_MODE === "true";
}

export function isLocalFirebaseHost(): boolean {
  if (typeof window === "undefined") return false;
  const host = window.location.hostname;
  return host === "localhost" || host === "127.0.0.1";
}

export function recaptchaLocalhostHint(): string {
  return (
    "On localhost, add localhost and 127.0.0.1 to Google Cloud → Security → reCAPTCHA → " +
    '"Key for Identity Platform reCAPTCHA integration" → Domains. ' +
    "Or test real SMS on your live site (affiliatechatbox.com)."
  );
}

export function applyPhoneAuthTestSettings(authInstance: Auth): void {
  authInstance.settings.appVerificationDisabledForTesting = isPhoneAuthTestMode();
}

let authInstance: Auth | null = null;

function resolveAuth(): Auth {
  if (typeof window === "undefined") {
    throw new Error("Firebase Auth is only available in the browser.");
  }
  if (!authInstance) {
    const instance = getClientFirebaseAuth();
    if (!instance) {
      throw new Error("Firebase not configured. Set NEXT_PUBLIC_FIREBASE_* in .env.local.");
    }
    authInstance = instance;
  }
  return authInstance;
}

/** Real Auth instance — use this with RecaptchaVerifier / signInWithPhoneNumber. */
export function getFirebaseAuth(): Auth {
  return resolveAuth();
}

/** Same usage as standard Firebase samples: `import { auth } from '@/lib/firebase'` */
export const auth = new Proxy({} as Auth, {
  get(_target, prop) {
    const instance = resolveAuth();
    const value = Reflect.get(instance, prop, instance);
    return typeof value === "function" ? value.bind(instance) : value;
  },
});

export function mapFirebaseAuthError(err: unknown): string {
  const e = err as { code?: string; message?: string };
  const messages: Record<string, string> = {
    "auth/invalid-phone-number": "Invalid phone number. Include country code (e.g. +880…).",
    "auth/too-many-requests": "Too many attempts. Try again later.",
    "auth/quota-exceeded": "SMS limit reached. Try again later.",
    "auth/invalid-verification-code": "Invalid or expired OTP code. Please try again.",
    "auth/code-expired": "Code expired. Send a new one.",
    "auth/captcha-check-failed":
      "reCAPTCHA verification failed. Set NEXT_PUBLIC_FIREBASE_PHONE_TEST_MODE=false for real SMS, disable ad blockers, and hard-refresh.",
    "auth/invalid-app-credential":
      "reCAPTCHA token invalid. Ensure reCAPTCHA Enterprise is configured in Firebase Console → Authentication → Settings → reCAPTCHA.",
    "auth/unauthorized-domain": "This domain is not authorized in Firebase Console.",
    "auth/network-request-failed": "Network error. Check your connection and try again.",
    "auth/internal-error":
      "reCAPTCHA failed to load. In Firebase Console → Authentication → Settings → Authorized domains, add localhost. Disable ad blockers and hard-refresh.",
  };
  if (e.code && messages[e.code]) return messages[e.code];

  const message = e.message || "";
  if (/invalid site key/i.test(message) || /6Ld[A-Za-z0-9_-]+/.test(message)) {
    return `reCAPTCHA site key is not allowed on this domain. ${recaptchaLocalhostHint()}`;
  }
  if (/timed out/i.test(message) && isLocalFirebaseHost()) {
    return `${message} ${recaptchaLocalhostHint()}`;
  }

  return message || "Something went wrong.";
}
