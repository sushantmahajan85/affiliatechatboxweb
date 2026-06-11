/**
 * Firebase = SMS OTP only. Your app login stays on JWT (Redux/cookies).
 */
import { getClientFirebaseAuth, isFirebaseConfigured } from "@/lib/firebase-app";
import { bootstrapFirebaseAuthRecaptcha } from "@/lib/firebase-auth-bootstrap";
import { isInvalidRecaptchaSiteKey, recaptchaSiteKeyFixMessage } from "@/lib/phone-otp";
import {
  type ConfirmationResult,
  initializeRecaptchaConfig,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  signOut,
} from "firebase/auth";

export const RECAPTCHA_CONTAINER_ID = "recaptcha-container";

let verifier: InstanceType<typeof RecaptchaVerifier> | null = null;

export { isFirebaseConfigured };
export { formatToE164 } from "@/lib/phone-otp";

export function mapFirebaseAuthError(err: unknown): string {
  const e = err as { code?: string; message?: string };
  if (e.message && isInvalidRecaptchaSiteKey(e.message)) {
    return recaptchaSiteKeyFixMessage();
  }
  const messages: Record<string, string> = {
    "auth/invalid-phone-number": "Invalid phone number.",
    "auth/too-many-requests": "Too many attempts. Try again later.",
    "auth/quota-exceeded": "SMS limit reached. Try again later.",
    "auth/invalid-verification-code": "Wrong code.",
    "auth/code-expired": "Code expired. Send again.",
    "auth/captcha-check-failed": "Complete Google's security check and try again.",
    "auth/unauthorized-domain": "Add this domain in Firebase Console → Authentication → Authorized domains.",
  };
  if (e.code && messages[e.code]) return messages[e.code];
  return e.message || "Something went wrong.";
}

function resetVerifier(): void {
  try {
    verifier?.clear();
  } catch {
    /* ignore */
  }
  verifier = null;
  document.getElementById(RECAPTCHA_CONTAINER_ID)?.replaceChildren();
}

/** Step 1: Firebase sends SMS (reCAPTCHA required by Google on web). */
export async function sendPhoneOtp(
  e164: string,
  container: HTMLElement
): Promise<ConfirmationResult> {
  const auth = getClientFirebaseAuth();
  if (!auth) throw new Error("Firebase not configured");

  if (process.env.NEXT_PUBLIC_FIREBASE_PHONE_TEST_MODE === "true") {
    auth.settings.appVerificationDisabledForTesting = true;
  }

  await bootstrapFirebaseAuthRecaptcha();
  await initializeRecaptchaConfig(auth);
  resetVerifier();

  const host =
    container.id === RECAPTCHA_CONTAINER_ID
      ? container
      : (document.getElementById(RECAPTCHA_CONTAINER_ID) ?? container);
  if (!host.isConnected) {
    throw new Error("reCAPTCHA container is not in the document.");
  }

  verifier = new RecaptchaVerifier(auth, host, { size: "invisible" });
  await verifier.render();

  try {
    return await signInWithPhoneNumber(auth, e164, verifier);
  } catch (err) {
    resetVerifier();
    throw err;
  }
}

/** Step 2: Confirm OTP, then sign out Firebase immediately. */
export async function confirmPhoneOtp(
  confirmationResult: ConfirmationResult,
  code: string
): Promise<{ phoneE164: string; firebaseIdToken: string }> {
  const auth = getClientFirebaseAuth();
  if (!auth) throw new Error("Firebase not configured");

  await confirmationResult.confirm(code);

  const user = auth.currentUser;
  if (!user?.phoneNumber) throw new Error("Verification failed");

  const result = { phoneE164: user.phoneNumber, firebaseIdToken: await user.getIdToken() };

  await signOut(auth);
  resetVerifier();

  return result;
}
