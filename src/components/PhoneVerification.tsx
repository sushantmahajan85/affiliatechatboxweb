"use client";

import { auth } from "@/lib/firebase";
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

const testMode = process.env.NEXT_PUBLIC_FIREBASE_PHONE_TEST_MODE === "true";

declare global {
  interface Window {
    recaptchaVerifier?: RecaptchaVerifier | null;
    recaptchaWidgetId?: number;
    grecaptcha?: {
      reset: (widgetId?: number) => void;
    };
  }
}

function resetRecaptchaPerFirebaseDocs(): void {
  if (typeof window.grecaptcha !== "undefined" && window.recaptchaWidgetId !== undefined) {
    window.grecaptcha.reset(window.recaptchaWidgetId);
    return;
  }

  if (window.recaptchaVerifier) {
    void window.recaptchaVerifier.render().then((widgetId) => {
      window.recaptchaWidgetId = widgetId;
      window.grecaptcha?.reset(widgetId);
    });
  }
}

function destroyRecaptchaVerifier(): void {
  if (window.recaptchaVerifier) {
    try {
      window.recaptchaVerifier.clear();
    } catch (e) {
      console.error("Failed to clear verifier", e);
    }
    window.recaptchaVerifier = null;
  }
  window.recaptchaWidgetId = undefined;
  document.getElementById("recaptcha-container")?.replaceChildren();
}

function setupRecaptchaVerifier(onExpired: () => void): void {
  destroyRecaptchaVerifier();

  const element = document.getElementById("recaptcha-container");
  if (!element) return;

  if (testMode) {
    auth.settings.appVerificationDisabledForTesting = true;
  }

  window.recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", {
    size: "invisible",
    callback: () => {
      /* reCAPTCHA solved — signInWithPhoneNumber may proceed */
    },
    "expired-callback": () => {
      onExpired();
    },
  });

  void window.recaptchaVerifier.render().then((widgetId) => {
    window.recaptchaWidgetId = widgetId;
  });
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

  useEffect(() => {
    setupRecaptchaVerifier(() => {
      setError("reCAPTCHA verification expired. Please try again.");
      resetRecaptchaPerFirebaseDocs();
    });

    return () => {
      destroyRecaptchaVerifier();
    };
  }, []);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();

    console.log("Checking App Config ID:", auth.config.apiKey);

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
      const appVerifier = window.recaptchaVerifier;
      if (!appVerifier) {
        throw new Error("reCAPTCHA is not ready. Refresh the page and try again.");
      }

      const confirmation = await signInWithPhoneNumber(auth, phoneNumber.trim(), appVerifier);

      setConfirmationResult(confirmation);
      setSuccess("Verification code sent to your phone!");
    } catch (err) {
      console.error("Error sending OTP:", err);
      const caught = err as { message?: string; code?: string };
      setError(caught.message || "Failed to send OTP. Check number format.");

      resetRecaptchaPerFirebaseDocs();
      destroyRecaptchaVerifier();
      setupRecaptchaVerifier(() => {
        setError("reCAPTCHA verification expired. Please try again.");
        resetRecaptchaPerFirebaseDocs();
      });
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
      const user = result.user;

      if (!user.phoneNumber) {
        throw new Error("Verification failed.");
      }

      const firebaseIdToken = await user.getIdToken();
      const phoneE164 = user.phoneNumber;

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

      await signOut(auth);
      destroyRecaptchaVerifier();

      setSuccess("Phone verified successfully!");
      onVerified?.(phoneE164);
      if (data.user) onSuccess?.(data.user);
    } catch (err) {
      console.error("Error verifying OTP:", err);
      const caught = err as { message?: string };
      setError(caught.message || "Invalid or expired OTP code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleChangeNumber = () => {
    setOtp("");
    setError("");
    setSuccess("");
    setConfirmationResult(null);
    destroyRecaptchaVerifier();
    setupRecaptchaVerifier(() => {
      setError("reCAPTCHA verification expired. Please try again.");
      resetRecaptchaPerFirebaseDocs();
    });
  };

  return (
    <div className="mt-4 border-t border-[#F1F5F9] pt-4">
      <div className="mb-6 text-center sm:text-left">
        <p className="text-sm text-[#64748B]">
          {!confirmationResult
            ? "Enter your mobile number to securely receive your authentication token."
            : `We sent a 6-digit one-time code to ${phoneNumber}`}
        </p>
        {testMode && !confirmationResult ? (
          <p className="mt-1 text-xs text-amber-700">
            Test mode (per Firebase docs): use fictional numbers from Firebase Console →
            Authentication → Phone → Phone numbers for testing (e.g. +919876543211 / 987654).
            Real numbers fail on localhost even with test mode off.
          </p>
        ) : null}
      </div>

      {error ? (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      ) : null}

      {success ? (
        <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-600">
          {success}
        </div>
      ) : null}

      <div id="recaptcha-container" />

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

          <button
            type="submit"
            disabled={loading || disabled}
            className="w-full rounded-xl bg-[#0A7EA4] px-4 py-3 font-medium text-white shadow-md transition hover:bg-[#086a8a] focus:outline-none focus:ring-2 focus:ring-[#0A7EA4]/50 disabled:opacity-50"
          >
            {loading ? "Processing request..." : "Verify Now"}
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
