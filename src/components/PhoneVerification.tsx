"use client";

import {
  applyPhoneAuthTestSettings,
  getFirebaseAuth,
  isLocalFirebaseHost,
  isPhoneAuthTestMode,
  mapFirebaseAuthError,
  recaptchaLocalhostHint,
  RECAPTCHA_CONTAINER_ID,
} from "@/lib/firebase";
import { ensureRecaptchaConfig } from "@/lib/firebase-phone-recaptcha";
import { getApiBaseUrl } from "@/lib/api-base-url";
import {
  type ConfirmationResult,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  signOut,
} from "firebase/auth";
import { useEffect, useState } from "react";

type PhoneVerificationProps = {
  appJwt: string;
  disabled?: boolean;
  onVerified?: (phoneE164: string) => void;
  onSuccess?: (user: { jwttoken: string; mobileNumber?: string }) => void;
};

declare global {
  interface Window {
    recaptchaVerifier?: RecaptchaVerifier | null;
  }
}

const RENDER_TIMEOUT_MS = 20_000;
const SMS_TIMEOUT_MS = 30_000;

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

function clearRecaptcha(): void {
  if (window.recaptchaVerifier) {
    try {
      window.recaptchaVerifier.clear();
    } catch {
      /* ignore */
    }
    window.recaptchaVerifier = null;
  }
  document.getElementById(RECAPTCHA_CONTAINER_ID)?.replaceChildren();
}

async function createRecaptchaVerifier(): Promise<RecaptchaVerifier> {
  clearRecaptcha();

  const container = document.getElementById(RECAPTCHA_CONTAINER_ID);
  if (!container) {
    throw new Error("reCAPTCHA container missing. Refresh the page and try again.");
  }

  const firebaseAuth = getFirebaseAuth();
  applyPhoneAuthTestSettings(firebaseAuth);

  await ensureRecaptchaConfig();

  const testMode = isPhoneAuthTestMode();
  const verifier = new RecaptchaVerifier(firebaseAuth, container, {
    size: testMode ? "invisible" : "normal",
    callback: () => {
      /* solved */
    },
    "expired-callback": () => {
      clearRecaptcha();
    },
  });

  await withTimeout(
    verifier.render(),
    RENDER_TIMEOUT_MS,
    "reCAPTCHA timed out. Disable ad blockers, allow google.com/recaptcha, and try again."
  );

  window.recaptchaVerifier = verifier;
  return verifier;
}

export function PhoneVerification({
  appJwt,
  disabled = false,
  onVerified,
  onSuccess,
}: PhoneVerificationProps) {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const testMode = isPhoneAuthTestMode();

  useEffect(() => {
    return () => {
      clearRecaptcha();
    };
  }, []);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    if (!phoneNumber.startsWith("+")) {
      setError("Phone number must start with a country code (e.g., +880 or +1)");
      setLoading(false);
      return;
    }

    if (!appJwt) {
      setError("Log in first to verify your phone.");
      setLoading(false);
      return;
    }

    try {
      const appVerifier = await createRecaptchaVerifier();
      const firebaseAuth = getFirebaseAuth();

      if (!testMode) {
        await withTimeout(
          appVerifier.verify(),
          RENDER_TIMEOUT_MS,
          "reCAPTCHA verification timed out. Tick the checkbox above and try again."
        );
      }

      const confirmation = await withTimeout(
        signInWithPhoneNumber(firebaseAuth, phoneNumber.trim(), appVerifier),
        SMS_TIMEOUT_MS,
        "SMS request timed out. Tick the reCAPTCHA checkbox, then try again."
      );

      setConfirmationResult(confirmation);
      setSuccess("Verification code sent to your phone!");
    } catch (err) {
      console.error("Error sending OTP:", err);
      setError(mapFirebaseAuthError(err));
      clearRecaptcha();
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    if (!confirmationResult) {
      setError("Session expired. Send a new code.");
      setLoading(false);
      return;
    }

    try {
      const result = await confirmationResult.confirm(otp);
      const firebaseUser = result.user;

      if (!firebaseUser.phoneNumber) {
        throw new Error("Verification failed — no phone number on Firebase user.");
      }

      const firebaseIdToken = await firebaseUser.getIdToken();
      const phoneE164 = firebaseUser.phoneNumber;

      const res = await fetch(`${getApiBaseUrl()}/api/auth/firebase-phone-verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${appJwt}`,
        },
        body: JSON.stringify({ firebaseIdToken }),
      });

      const data = (await res.json()) as {
        message?: string;
        user?: { jwttoken: string; mobileNumber?: string };
      };

      if (!res.ok) {
        throw new Error(data.message || "Could not save phone number to your account.");
      }

      await signOut(getFirebaseAuth());
      clearRecaptcha();

      setSuccess("Phone verified successfully!");
      onVerified?.(phoneE164);
      if (data.user) onSuccess?.(data.user);
    } catch (err) {
      console.error("Error verifying OTP:", err);
      setError(mapFirebaseAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleChangeNumber = () => {
    setOtp("");
    setError("");
    setSuccess("");
    setConfirmationResult(null);
    clearRecaptcha();
  };

  return (
    <div className="mt-4 border-t border-[#F1F5F9] pt-4">
      <div className="mb-4 text-center sm:text-left">
        <p className="text-sm text-[#64748B]">
          {!confirmationResult
            ? "Enter your mobile number to securely receive your authentication token."
            : `We sent a 6-digit one-time code to ${phoneNumber}`}
        </p>
        {testMode && !confirmationResult ? (
          <p className="mt-1 text-xs text-amber-700">
            Dev test mode: use a number from Firebase Console → Phone → Phone numbers for testing
            (e.g. +919876543211) and its 6-digit code — no real SMS is sent.
          </p>
        ) : !confirmationResult ? (
          <>
            <p className="mt-1 text-xs text-[#64748B]">
              Complete the &quot;I&apos;m not a robot&quot; check below, then click Verify Now.
            </p>
            {isLocalFirebaseHost() ? (
              <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 p-2 text-xs text-amber-800">
                {recaptchaLocalhostHint()}
              </p>
            ) : null}
          </>
        ) : null}
      </div>

      {error ? (
        <div
          className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600"
          role="alert"
        >
          {error}
        </div>
      ) : null}

      {success ? (
        <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-600">
          {success}
        </div>
      ) : null}

      {!confirmationResult ? (
        <form onSubmit={(e) => void handleSendOtp(e)} className="space-y-4">
          <div>
            <label
              htmlFor="phone"
              className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[#64748B]"
            >
              Phone Number
            </label>
            <input
              id="phone"
              type="tel"
              placeholder="+880 1XXX-XXXXXX or +1 234-567-8901"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              disabled={loading || disabled}
              required
              className="w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3 text-[#1A1A2E] shadow-sm transition placeholder:text-[#94A3B8] focus:border-[#0A7EA4] focus:outline-none focus:ring-2 focus:ring-[#0A7EA4]/20"
            />
          </div>

          <div
            id={RECAPTCHA_CONTAINER_ID}
            className={testMode ? "hidden" : "flex min-h-[78px] justify-center"}
            aria-hidden={testMode}
          />

          <button
            type="submit"
            disabled={loading || disabled}
            className="w-full rounded-xl bg-[#0A7EA4] px-4 py-3 font-medium text-white shadow-md transition hover:bg-[#086a8a] focus:outline-none focus:ring-2 focus:ring-[#0A7EA4]/50 disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="h-5 w-5 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Processing request...
              </span>
            ) : (
              "Verify Now"
            )}
          </button>
        </form>
      ) : (
        <form onSubmit={(e) => void handleVerifyOtp(e)} className="space-y-4">
          <div>
            <label
              htmlFor="otp"
              className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[#64748B]"
            >
              One-Time Security Code
            </label>
            <input
              id="otp"
              type="text"
              maxLength={6}
              placeholder="6-Digit Code"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              disabled={loading || disabled}
              required
              className="w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3 text-center text-lg font-bold tracking-[0.5em] text-[#1A1A2E] shadow-sm transition placeholder:text-[#94A3B8] focus:border-[#0A7EA4] focus:outline-none focus:ring-2 focus:ring-[#0A7EA4]/20"
            />
          </div>

          <button
            type="submit"
            disabled={loading || disabled}
            className="w-full rounded-xl bg-emerald-600 px-4 py-3 font-medium text-white shadow-md transition hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 disabled:opacity-50"
          >
            {loading ? "Confirming authorization..." : "Confirm Code"}
          </button>

          <button
            type="button"
            onClick={handleChangeNumber}
            disabled={loading}
            className="mt-2 block w-full text-center text-xs font-medium text-[#64748B] transition hover:text-[#1A1A2E] disabled:opacity-50"
          >
            ← Change phone number
          </button>
        </form>
      )}
    </div>
  );
}
