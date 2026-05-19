import { getClientFirebaseAuth } from "@/lib/firebase-app";
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
  // Remove the element entirely so the next call gets a fresh DOM node.
  // replaceChildren() leaves stale grecaptcha widget registry entries.
  const el = document.getElementById(FIREBASE_PHONE_RECAPTCHA_ID);
  if (el) el.remove();
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


function ensureRecaptchaHost(): HTMLElement {
  let el = document.getElementById(FIREBASE_PHONE_RECAPTCHA_ID);
  if (!el) {
    el = document.createElement("div");
    el.id = FIREBASE_PHONE_RECAPTCHA_ID;
    el.style.cssText = "position:absolute;width:0;height:0;overflow:hidden;visibility:hidden;";
    document.body.appendChild(el);
  }
  return el;
}

/**
 * Web equivalent of Android's FirebaseAuth.verifyPhoneNumber().
 *
 * Flow mirrors Android:
 *   verifyPhoneNumber → codeSent(verificationId) → [user enters SMS code]
 *   → PhoneAuthProvider.credential(verificationId, code) → signInWithCredential
 *
 * reCAPTCHA is required on web (Android uses Play Integrity instead).
 * If you see CAPTCHA_CHECK_FAILED/MALFORMED, go to Firebase Console →
 * Authentication → Settings → Advanced → reCAPTCHA Enterprise → Disable.
 */
export async function sendFirebasePhoneOtp(e164: string): Promise<string> {
  const auth = getClientFirebaseAuth();
  if (!auth) throw new Error("Firebase is not configured.");

  if (!/^\+\d{8,15}$/.test(e164)) {
    throw Object.assign(new Error("Invalid phone format"), {
      code: "auth/invalid-phone-number",
    });
  }

  if (isPhoneTestMode()) {
    auth.settings.appVerificationDisabledForTesting = true;
  }

  resetPhoneRecaptcha();
  ensureRecaptchaHost();

  try {
    activeVerifier = new RecaptchaVerifier(auth, FIREBASE_PHONE_RECAPTCHA_ID, {
      size: "invisible",
    });

    const confirmation = await signInWithPhoneNumber(auth, e164, activeVerifier);
    return confirmation.verificationId;
  } catch (err) {
    resetPhoneRecaptcha();
    throw err;
  }
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
      return "reCAPTCHA verification failed. Check Firebase Console → Authentication → Authorized domains includes this domain.";
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
