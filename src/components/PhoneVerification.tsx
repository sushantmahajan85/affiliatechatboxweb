"use client";

import { auth } from "@/lib/firebase";
import { getApiBaseUrl } from "@/lib/api-base-url";
import { DEFAULT_COUNTRY_ISO } from "@/lib/phone-countries";
import { getPhoneFormatHint, getPhoneValidationError } from "@/lib/phone-validation";
import { PhoneCountrySelect } from "@/components/phone-country-select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { cn } from "@/components/ui/utils";
import {
  type ConfirmationResult,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  signOut,
} from "firebase/auth";
import { forwardRef, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FiLoader, FiPhone } from "react-icons/fi";
import PhoneInput from "react-phone-number-input";
import type { Country, Value as E164Number } from "react-phone-number-input";

type PhoneVerificationModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appJwt: string;
  defaultCountry?: Country;
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

const PhoneNumberInput = forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      {...props}
      className={cn(
        "h-12 min-w-0 flex-1 rounded-xl border border-[#E2E8F0] bg-white px-4 text-sm text-[#1A1A2E] shadow-sm",
        "placeholder:text-[#94A3B8] focus:border-[#0A7EA4] focus:outline-none focus:ring-2 focus:ring-[#0A7EA4]/20",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
    />
  )
);
PhoneNumberInput.displayName = "PhoneNumberInput";

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

function destroyRecaptchaVerifier(container?: HTMLElement | null): void {
  if (window.recaptchaVerifier) {
    try {
      window.recaptchaVerifier.clear();
    } catch (e) {
      console.error("Failed to clear verifier", e);
    }
    window.recaptchaVerifier = null;
  }
  window.recaptchaWidgetId = undefined;
  container?.replaceChildren();
}

function setupRecaptchaVerifier(
  container: HTMLElement | null,
  onExpired: () => void
): RecaptchaVerifier | null {
  destroyRecaptchaVerifier(container);

  if (!container) return null;

  if (testMode) {
    auth.settings.appVerificationDisabledForTesting = true;
  }

  window.recaptchaVerifier = new RecaptchaVerifier(auth, container, {
    size: "invisible",
    callback: () => {
      /* reCAPTCHA solved */
    },
    "expired-callback": () => {
      onExpired();
    },
  });

  return window.recaptchaVerifier;
}

async function ensureRecaptchaRendered(
  container: HTMLElement | null,
  onExpired: () => void
): Promise<RecaptchaVerifier> {
  let verifier = window.recaptchaVerifier ?? setupRecaptchaVerifier(container, onExpired);
  if (!verifier) {
    throw new Error("reCAPTCHA is not ready. Close and reopen this dialog.");
  }

  const widgetId = await verifier.render();
  window.recaptchaWidgetId = widgetId;
  return verifier;
}

function resetModalState(
  setPhoneNumber: (v: E164Number | undefined) => void,
  setOtp: (v: string) => void,
  setConfirmationResult: (v: ConfirmationResult | null) => void,
  setError: (v: string) => void,
  setSuccess: (v: string) => void
): void {
  setPhoneNumber(undefined);
  setOtp("");
  setConfirmationResult(null);
  setError("");
  setSuccess("");
}

export function PhoneVerificationModal({
  open,
  onOpenChange,
  appJwt,
  defaultCountry = DEFAULT_COUNTRY_ISO as Country,
  disabled = false,
  onVerified,
  onSuccess,
}: PhoneVerificationModalProps) {
  const recaptchaContainerRef = useRef<HTMLDivElement>(null);
  const [country, setCountry] = useState<Country | undefined>(defaultCountry);
  const [phoneNumber, setPhoneNumber] = useState<E164Number | undefined>();
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [otp, setOtp] = useState("");
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const phoneFieldError =
    phoneTouched || phoneNumber ? getPhoneValidationError(phoneNumber, country) : null;
  const phoneFormatHint = getPhoneFormatHint(country);
  const canSendOtp = Boolean(phoneNumber) && !phoneFieldError;

  const onRecaptchaExpired = () => {
    setError("reCAPTCHA verification expired. Please try again.");
    resetRecaptchaPerFirebaseDocs();
  };

  useLayoutEffect(() => {
    if (!open) return;

    void ensureRecaptchaRendered(recaptchaContainerRef.current, onRecaptchaExpired).catch(
      (err: unknown) => {
        console.error("reCAPTCHA init failed:", err);
      }
    );

    return () => {
      destroyRecaptchaVerifier(recaptchaContainerRef.current);
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      resetModalState(setPhoneNumber, setOtp, setConfirmationResult, setError, setSuccess);
      setCountry(defaultCountry);
      setPhoneTouched(false);
      destroyRecaptchaVerifier(recaptchaContainerRef.current);
    }
  }, [open, defaultCountry]);

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      resetModalState(setPhoneNumber, setOtp, setConfirmationResult, setError, setSuccess);
      setCountry(defaultCountry);
      setPhoneTouched(false);
      destroyRecaptchaVerifier(recaptchaContainerRef.current);
    }
    onOpenChange(next);
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    setPhoneTouched(true);
    const validationError = getPhoneValidationError(phoneNumber, country);
    if (validationError || !phoneNumber) {
      setError(validationError ?? "Enter your mobile number.");
      setLoading(false);
      return;
    }

    if (!appJwt) {
      setError("Log in first to verify your phone.");
      setLoading(false);
      return;
    }

    try {
      const appVerifier = await ensureRecaptchaRendered(
        recaptchaContainerRef.current,
        onRecaptchaExpired
      );

      const confirmation = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
      setConfirmationResult(confirmation);
      setSuccess("Verification code sent to your phone.");
    } catch (err) {
      console.error("Error sending OTP:", err);
      const caught = err as { message?: string };
      setError(caught.message || "Failed to send OTP. Check the number and try again.");

      resetRecaptchaPerFirebaseDocs();
      destroyRecaptchaVerifier(recaptchaContainerRef.current);
      await ensureRecaptchaRendered(recaptchaContainerRef.current, onRecaptchaExpired);
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

    if (otp.length !== 6) {
      setError("Enter the 6-digit code.");
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
      destroyRecaptchaVerifier(recaptchaContainerRef.current);

      setSuccess("Phone verified successfully!");
      onVerified?.(phoneE164);
      if (data.user) onSuccess?.(data.user);

      setTimeout(() => handleOpenChange(false), 600);
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
    void ensureRecaptchaRendered(recaptchaContainerRef.current, onRecaptchaExpired);
  };

  const recaptchaHost =
    open && typeof document !== "undefined"
      ? createPortal(
          <div
            ref={recaptchaContainerRef}
            id="recaptcha-container"
            className="pointer-events-none fixed left-0 top-0 -z-10 h-px w-px overflow-hidden opacity-0"
            aria-hidden
          />,
          document.body
        )
      : null;

  return (
    <>
    {recaptchaHost}
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="gap-0 overflow-hidden rounded-[24px] border border-[#E2E8F0] bg-white p-0 sm:max-w-[440px]">
        <DialogHeader className="border-b border-[#F1F5F9] px-6 pb-4 pt-6 text-left">
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#0A7EA4]/10">
            <FiPhone className="h-5 w-5 text-[#0A7EA4]" />
          </div>
          <DialogTitle className="text-[18px] font-bold text-[#1A1A2E]">
            {confirmationResult ? "Enter verification code" : "Add phone number"}
          </DialogTitle>
          <DialogDescription className="text-[13px] leading-relaxed text-[#64748B]">
            {confirmationResult
              ? `We sent a 6-digit code to ${phoneNumber ?? "your phone"}.`
              : "Select your country, enter your mobile number, and we will send a one-time SMS code."}
          </DialogDescription>
          {testMode && !confirmationResult ? (
            <p className="pt-1 text-xs text-amber-700">
              Test mode: use fictional numbers from Firebase Console (e.g. +919876543211 / 987654).
            </p>
          ) : null}
        </DialogHeader>

        <div className="px-6 py-5">
          {error ? (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          ) : null}

          {success ? (
            <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-600">
              {success}
            </div>
          ) : null}

          {!confirmationResult ? (
            <form onSubmit={(e) => void handleSendOtp(e)} className="space-y-5">
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[#64748B]">
                  Phone Number
                </label>
                <PhoneInput
                  international={false}
                  limitMaxLength
                  country={country}
                  defaultCountry={defaultCountry}
                  countryCallingCodeEditable={false}
                  countrySelectComponent={PhoneCountrySelect}
                  inputComponent={PhoneNumberInput}
                  value={phoneNumber}
                  onChange={setPhoneNumber}
                  onCountryChange={(next) => {
                    setCountry(next);
                    setPhoneNumber(undefined);
                    setPhoneTouched(false);
                  }}
                  disabled={loading || disabled}
                  placeholder="Mobile number"
                  className="flex w-full items-center gap-2"
                  numberInputProps={{
                    autoComplete: "tel-national",
                    inputMode: "numeric",
                    onBlur: () => setPhoneTouched(true),
                    "aria-invalid": Boolean(phoneFieldError),
                    className: cn(
                      phoneFieldError &&
                        "border-red-400 focus:border-red-400 focus:ring-red-400/20"
                    ),
                  }}
                />
                {phoneFormatHint ? (
                  <p className="mt-1.5 text-xs text-[#94A3B8]">{phoneFormatHint}</p>
                ) : null}
                {phoneFieldError ? (
                  <p className="mt-1.5 text-xs text-red-600">{phoneFieldError}</p>
                ) : null}
              </div>

              <button
                type="submit"
                disabled={loading || disabled || !canSendOtp}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0A7EA4] px-4 py-3 text-sm font-bold text-white shadow-md transition hover:bg-[#086a8a] disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <FiLoader className="h-4 w-4 animate-spin" />
                    Sending code...
                  </>
                ) : (
                  "Send verification code"
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={(e) => void handleVerifyOtp(e)} className="space-y-5">
              <div className="flex flex-col items-center gap-4">
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#64748B]">
                  One-time code
                </label>
                <InputOTP
                  maxLength={6}
                  value={otp}
                  onChange={setOtp}
                  disabled={loading || disabled}
                  containerClassName="justify-center"
                >
                  <InputOTPGroup className="gap-2">
                    {Array.from({ length: 6 }, (_, i) => (
                      <InputOTPSlot
                        key={i}
                        index={i}
                        className="h-12 w-11 rounded-xl border-[#E2E8F0] bg-white text-base font-bold text-[#1A1A2E] shadow-sm first:rounded-xl last:rounded-xl data-[active=true]:border-[#0A7EA4] data-[active=true]:ring-2 data-[active=true]:ring-[#0A7EA4]/20"
                      />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
                <p className="text-center text-xs text-[#94A3B8]">
                  Enter the 6-digit code from your SMS message
                </p>
              </div>

              <button
                type="submit"
                disabled={loading || disabled || otp.length !== 6}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white shadow-md transition hover:bg-emerald-700 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <FiLoader className="h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  "Verify code"
                )}
              </button>

              <button
                type="button"
                onClick={handleChangeNumber}
                disabled={loading}
                className="block w-full text-center text-xs font-medium text-[#64748B] transition hover:text-[#1A1A2E] disabled:opacity-50"
              >
                Change phone number
              </button>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}
