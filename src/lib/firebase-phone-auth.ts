import { getClientFirebaseAuth } from "@/lib/firebase-app";
import type { Auth } from "firebase/auth";
import {
  PhoneAuthProvider,
  RecaptchaVerifier,
  signInWithCredential,
  signInWithPhoneNumber,
} from "firebase/auth";

/** Stable DOM id — RecaptchaVerifier works more reliably with a string id than a ref. */
export const FIREBASE_PHONE_RECAPTCHA_ID = "firebase-phone-recaptcha";

export function phoneDigitsOnly(e164: string): string {
  return e164.replace(/\D/g, "");
}

export function toAppPhonePayload(e164: string): string {
  const digits = phoneDigitsOnly(e164);
  return digits ? `+${digits}` : "";
}

let activeVerifier: InstanceType<typeof RecaptchaVerifier> | null = null;

export function resetPhoneRecaptcha(): void {
  clearRecaptchaVerifier(activeVerifier);
  activeVerifier = null;
  const el = document.getElementById(FIREBASE_PHONE_RECAPTCHA_ID);
  if (el) el.replaceChildren();
}

export function clearRecaptchaVerifier(
  verifier: InstanceType<typeof RecaptchaVerifier> | null
): void {
  if (!verifier) return;
  try {
    verifier.clear();
  } catch {
    /* ignore */
  }
}

function isPhoneTestMode(): boolean {
  return (
    process.env.NODE_ENV === "development" &&
    process.env.NEXT_PUBLIC_FIREBASE_PHONE_TEST_MODE === "true"
  );
}

function enableFirebasePhoneTestMode(auth: Auth): void {
  if (isPhoneTestMode()) {
    auth.settings.appVerificationDisabledForTesting = true;
  }
}

function ensureRecaptchaHost(): HTMLElement {
  let el = document.getElementById(FIREBASE_PHONE_RECAPTCHA_ID);
  if (!el) {
    el = document.createElement("div");
    el.id = FIREBASE_PHONE_RECAPTCHA_ID;
    el.setAttribute("aria-label", "Firebase security check");
    el.className =
      "fixed bottom-6 left-1/2 z-200 flex min-h-[78px] w-[min(100%,22rem)] -translate-x-1/2 items-center justify-center rounded-xl border border-[#E2E8F0] bg-white p-2 shadow-lg";
    document.body.appendChild(el);
  }
  return el;
}

/**
 * Firebase phone OTP (web) — same SMS pipeline as Android `verifyPhoneNumber`.
 * User must complete the visible reCAPTCHA; then SMS is sent.
 */
export function sendFirebasePhoneOtp(e164: string): Promise<string> {
  const auth = getClientFirebaseAuth();
  if (!auth) {
    return Promise.reject(new Error("Firebase is not configured."));
  }

  if (!/^\+\d{8,15}$/.test(e164)) {
    return Promise.reject(
      Object.assign(new Error("Invalid phone format"), {
        code: "auth/invalid-phone-number",
      })
    );
  }

  enableFirebasePhoneTestMode(auth);
  resetPhoneRecaptcha();
  ensureRecaptchaHost();

  return new Promise((resolve, reject) => {
    let settled = false;
    const fail = (err: unknown) => {
      if (settled) return;
      settled = true;
      resetPhoneRecaptcha();
      reject(err);
    };
    const succeed = (verificationId: string) => {
      if (settled) return;
      settled = true;
      resolve(verificationId);
    };

    try {
      activeVerifier = new RecaptchaVerifier(auth, FIREBASE_PHONE_RECAPTCHA_ID, {
        size: "normal",
        callback: async () => {
          if (!activeVerifier) {
            fail(
              Object.assign(new Error("reCAPTCHA not ready"), {
                code: "auth/missing-app-credential",
              })
            );
            return;
          }
          try {
            const confirmation = await signInWithPhoneNumber(
              auth,
              e164,
              activeVerifier
            );
            succeed(confirmation.verificationId);
          } catch (err) {
            fail(err);
          }
        },
        "expired-callback": () => {
          fail(
            Object.assign(new Error("reCAPTCHA expired"), {
              code: "auth/captcha-check-failed",
            })
          );
        },
      });
    } catch (err) {
      fail(err);
      return;
    }

    activeVerifier
      .render()
      .then(() => {
        if (isPhoneTestMode()) {
          // With test numbers + appVerificationDisabledForTesting, solve immediately.
          void activeVerifier?.verify().catch(fail);
        }
      })
      .catch(fail);
  });
}

export async function confirmFirebasePhoneOtp(
  verificationId: string,
  smsCode: string
): Promise<void> {
  const auth = getClientFirebaseAuth();
  if (!auth) throw new Error("Firebase is not configured.");

  const credential = PhoneAuthProvider.credential(verificationId, smsCode);
  await signInWithCredential(auth, credential);
}

export async function getFirebasePhoneAuthIdToken(): Promise<string> {
  const auth = getClientFirebaseAuth();
  const user = auth?.currentUser;
  if (!user) {
    throw new Error("Phone sign-in did not complete. Request a new code.");
  }
  return user.getIdToken(true);
}

export function firebasePhoneAuthErrorMessage(err: unknown): string {
  const e = err as { code?: string; message?: string };
  switch (e.code) {
    case "auth/argument-error":
      return isPhoneTestMode()
        ? "Test mode: add this number under Firebase → Authentication → Phone numbers for testing, then complete reCAPTCHA below."
        : "Phone verification setup error. Refresh the page, complete reCAPTCHA, and try again.";
    case "auth/invalid-phone-number":
      return "Invalid phone number. Use country code + number.";
    case "auth/too-many-requests":
      return "Too many attempts. Try again later.";
    case "auth/invalid-verification-code":
      return "Incorrect code. Try again.";
    case "auth/code-expired":
      return "Code expired. Request a new code.";
    case "auth/invalid-app-credential":
    case "auth/missing-app-credential":
      return "Complete the reCAPTCHA box below, then try again. Also check Firebase → Authorized domains includes localhost.";
    case "auth/captcha-check-failed":
      return "reCAPTCHA failed. Refresh and try again.";
    case "auth/operation-not-allowed":
      return "Phone sign-in is disabled in Firebase Console (Authentication → Sign-in method → Phone).";
    case "auth/quota-exceeded":
      return "SMS quota exceeded. Try again later or use a Firebase test number.";
    case "auth/invalid-verification-id":
      return "Session expired. Request a new code.";
    default:
      return e.code
        ? `${e.message || "Phone verification failed."} (${e.code})`
        : e.message || "Phone verification failed.";
  }
}
