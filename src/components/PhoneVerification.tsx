"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  confirmPhoneOtp,
  formatToE164,
  isFirebaseConfigured,
  mapFirebaseAuthError,
  RECAPTCHA_CONTAINER_ID,
  sendPhoneOtp,
} from "@/lib/firebase";
import { getApiBaseUrl } from "@/lib/api-base-url";
import {
  getPhoneOtpProvider,
  isInvalidRecaptchaSiteKey,
  isValidE164,
  recaptchaSiteKeyFixMessage,
  sendServerPhoneOtp,
  verifyServerPhoneOtp,
} from "@/lib/phone-otp";
import { DEFAULT_PHONE_DIAL, PHONE_COUNTRIES } from "@/lib/phone-countries";
import type { ConfirmationResult } from "firebase/auth";
import { useEffect, useRef, useState } from "react";
import { FiLoader, FiShield, FiSmartphone } from "react-icons/fi";
import { toast } from "sonner";

const RESEND_COOLDOWN_SECONDS = 60;

type PhoneVerificationProps = {
  appJwt: string;
  onSuccess: (user: { jwttoken: string } & Record<string, unknown>) => void;
  onVerified?: (phoneNumber: string) => void;
  initialCountryDial?: string;
  initialNationalNumber?: string;
};

type PhoneVerificationDialogProps = PhoneVerificationProps & {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function maskPhone(e164: string): string {
  const d = e164.replace(/\D/g, "");
  if (d.length <= 4) return "••••";
  return `+${"•".repeat(Math.max(0, d.length - 4))}${d.slice(-4)}`;
}

function ensureRecaptchaHost(): HTMLDivElement {
  const existing = document.getElementById(RECAPTCHA_CONTAINER_ID);
  if (existing instanceof HTMLDivElement) return existing;

  const host = document.createElement("div");
  host.id = RECAPTCHA_CONTAINER_ID;
  host.setAttribute("aria-hidden", "true");
  host.style.cssText = "position:fixed;left:-9999px;top:0;width:1px;height:1px;overflow:visible;";
  document.body.appendChild(host);
  return host;
}

function StepIndicator({ step }: { step: "phone" | "otp" }) {
  return (
    <div className="flex items-center gap-2 text-xs font-medium">
      <span
        className={`flex h-6 w-6 items-center justify-center rounded-full ${
          step === "phone" ? "bg-[#0A7EA4] text-white" : "bg-[#0A7EA4]/15 text-[#0A7EA4]"
        }`}
      >
        1
      </span>
      <span className={step === "phone" ? "text-[#1A1A2E]" : "text-[#94A3B8]"}>Number</span>
      <span className="h-px w-6 bg-[#E2E8F0]" />
      <span
        className={`flex h-6 w-6 items-center justify-center rounded-full ${
          step === "otp" ? "bg-[#0A7EA4] text-white" : "bg-[#F1F5F9] text-[#94A3B8]"
        }`}
      >
        2
      </span>
      <span className={step === "otp" ? "text-[#1A1A2E]" : "text-[#94A3B8]"}>Code</span>
    </div>
  );
}

export function PhoneVerification({
  appJwt,
  onSuccess,
  onVerified,
  initialCountryDial = DEFAULT_PHONE_DIAL,
  initialNationalNumber = "",
}: PhoneVerificationProps) {
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [countryDial, setCountryDial] = useState(initialCountryDial);
  const [nationalNumber, setNationalNumber] = useState(initialNationalNumber);
  const [otp, setOtp] = useState("");
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [phoneE164, setPhoneE164] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSeconds, setResendSeconds] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [useServerOtp, setUseServerOtp] = useState(() => getPhoneOtpProvider() === "server");
  const [recaptchaError, setRecaptchaError] = useState<string | null>(null);
  const [devCodeHint, setDevCodeHint] = useState<string | null>(null);
  const sendLockRef = useRef(false);

  useEffect(() => {
    if (resendSeconds <= 0) return;
    const timer = window.setTimeout(() => setResendSeconds((s) => s - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [resendSeconds]);

  useEffect(() => {
    if (!useServerOtp) ensureRecaptchaHost();
    const onWindowError = (event: ErrorEvent): void => {
      if (isInvalidRecaptchaSiteKey(event.message || "")) {
        setRecaptchaError(recaptchaSiteKeyFixMessage());
      }
    };
    window.addEventListener("error", onWindowError);
    return () => {
      window.removeEventListener("error", onWindowError);
      if (!useServerOtp) document.getElementById(RECAPTCHA_CONTAINER_ID)?.remove();
    };
  }, [useServerOtp]);

  const sendCode = async (isResend = false): Promise<void> => {
    if (loading || resendLoading || sendLockRef.current) return;
    if (isResend && resendSeconds > 0) return;

    const e164 = formatToE164(countryDial, nationalNumber);
    if (!e164 || !isValidE164(e164)) {
      const message = "Enter a valid phone number in international format (e.g. +8801XXXXXXXXX).";
      setErrorMessage(message);
      toast.error(message);
      return;
    }

    sendLockRef.current = true;
    if (isResend) setResendLoading(true);
    else setLoading(true);
    setRecaptchaError(null);
    setErrorMessage(null);
    setDevCodeHint(null);

    try {
      if (useServerOtp) {
        const result = await sendServerPhoneOtp(e164, appJwt);
        setPhoneE164(e164);
        setStep("otp");
        setResendSeconds(RESEND_COOLDOWN_SECONDS);
        if (result.devCode) setDevCodeHint(result.devCode);
        toast.success(result.smsSent ? "Code sent by SMS" : "Dev code generated (see below)");
        return;
      }

      if (!isFirebaseConfigured()) {
        const message = "Firebase not configured in .env.local";
        setErrorMessage(message);
        toast.error(message);
        return;
      }

      const result = await sendPhoneOtp(e164, ensureRecaptchaHost());
      setConfirmationResult(result);
      setPhoneE164(e164);
      setStep("otp");
      setResendSeconds(RESEND_COOLDOWN_SECONDS);
      toast.success("Verification code sent");
    } catch (err) {
      const message = mapFirebaseAuthError(err);
      if (isInvalidRecaptchaSiteKey(message)) setRecaptchaError(message);
      setErrorMessage(message);
      toast.error(message);
    } finally {
      setLoading(false);
      setResendLoading(false);
      sendLockRef.current = false;
    }
  };

  const verifyCode = async (): Promise<void> => {
    if (loading) return;
    const code = otp.replace(/\D/g, "");
    if (!/^\d{6}$/.test(code)) {
      const message = "Enter the 6-digit code";
      setErrorMessage(message);
      toast.error(message);
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    try {
      if (useServerOtp) {
        const { user } = await verifyServerPhoneOtp(phoneE164, code, appJwt);
        toast.success("Mobile number verified");
        onVerified?.(phoneE164);
        onSuccess(user);
        return;
      }

      if (!confirmationResult) {
        throw new Error("Send a verification code first.");
      }

      const payload = await confirmPhoneOtp(confirmationResult, code);
      const res = await fetch(`${getApiBaseUrl()}/api/auth/firebase-phone-verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${appJwt}`,
        },
        body: JSON.stringify({ firebaseIdToken: payload.firebaseIdToken }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { message?: string }).message || "Could not save phone");
      }

      const data = (await res.json()) as {
        success?: boolean;
        phoneNumber?: string;
        user?: { jwttoken: string } & Record<string, unknown>;
      };

      if (!data.user) {
        throw new Error("Verification succeeded but user data was missing");
      }

      toast.success("Mobile number verified");
      onVerified?.(data.phoneNumber || payload.phoneE164);
      onSuccess(data.user);
    } catch (err) {
      const message = err instanceof Error ? err.message : mapFirebaseAuthError(err);
      setErrorMessage(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  if (step === "phone") {
    return (
      <div className="flex flex-col gap-5">
        <StepIndicator step="phone" />

        {useServerOtp ? (
          <p className="rounded-xl border border-[#BAE6FD] bg-[#F0F9FF] px-3 py-2 text-xs text-[#0369A1]">
            Local dev: SMS via your API (no Firebase reCAPTCHA). Production uses Firebase.
          </p>
        ) : null}

        {recaptchaError ? (
          <p className="rounded-xl border border-[#FECACA] bg-[#FEF2F2] px-3 py-2 text-xs text-[#B91C1C]">
            {recaptchaError}
          </p>
        ) : null}

        {errorMessage ? (
          <p className="rounded-xl border border-[#FECACA] bg-[#FEF2F2] px-3 py-2 text-xs text-[#B91C1C]">
            {errorMessage}
          </p>
        ) : null}

        <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-[#64748B]">
            Mobile number
          </label>
          <div className="flex gap-2">
            <select
              value={countryDial}
              disabled={loading}
              onChange={(e) => setCountryDial(e.target.value)}
              className="h-11 min-w-[130px] max-w-[42%] rounded-xl border border-[#E2E8F0] bg-white px-2 text-sm text-[#1A1A2E] font-medium shrink-0"
              aria-label="Country code"
            >
              {PHONE_COUNTRIES.map((c) => (
                <option key={c.dial} value={c.dial}>
                  {c.label} +{c.dial}
                </option>
              ))}
            </select>
            <Input
              type="tel"
              inputMode="numeric"
              autoComplete="tel-national"
              placeholder="1712345678"
              value={nationalNumber}
              disabled={loading}
              onChange={(e) => setNationalNumber(e.target.value.replace(/[^\d\s-]/g, ""))}
              className="h-11 flex-1 rounded-xl border-[#E2E8F0] bg-white text-[#1A1A2E] placeholder:text-[#94A3B8]"
            />
          </div>
          {!useServerOtp ? (
            <p className="mt-2 text-[11px] text-[#94A3B8]">
              Google may show a quick security check when you tap Send code.
            </p>
          ) : null}
        </div>

        <Button
          type="button"
          className="h-11 w-full rounded-xl bg-[#0A7EA4] text-white hover:bg-[#086a8a] disabled:opacity-60"
          disabled={loading || nationalNumber.replace(/\D/g, "").length < 6}
          onClick={() => void sendCode(false)}
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <FiLoader className="h-4 w-4 animate-spin" />
              Sending…
            </span>
          ) : (
            "Send OTP"
          )}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <StepIndicator step="otp" />

      <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4 text-center">
        <p className="text-sm text-[#64748B]">Code sent to</p>
        <p className="mt-1 text-lg font-semibold text-[#1A1A2E] tracking-wide">
          {maskPhone(phoneE164)}
        </p>
        {devCodeHint ? (
          <p className="mt-2 text-sm font-mono text-[#0A7EA4]">
            Dev code: {devCodeHint}
          </p>
        ) : null}
      </div>

      {errorMessage ? (
        <p className="rounded-xl border border-[#FECACA] bg-[#FEF2F2] px-3 py-2 text-xs text-[#B91C1C]">
          {errorMessage}
        </p>
      ) : null}

      <div>
        <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-[#64748B]">
          6-digit code
        </label>
        <Input
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          placeholder="• • • • • •"
          maxLength={6}
          value={otp}
          disabled={loading}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
          className="h-12 rounded-xl border-[#E2E8F0] bg-white text-center text-2xl tracking-[0.45em] font-mono text-[#1A1A2E] placeholder:text-[#CBD5E1]"
        />
      </div>

      <Button
        type="button"
        className="h-11 w-full rounded-xl bg-[#0A7EA4] text-white hover:bg-[#086a8a] disabled:opacity-60"
        disabled={loading || otp.length < 6}
        onClick={() => void verifyCode()}
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <FiLoader className="h-4 w-4 animate-spin" />
            Verifying…
          </span>
        ) : (
          "Verify OTP"
        )}
      </Button>

      <div className="flex items-center justify-between gap-2">
        <Button
          type="button"
          variant="ghost"
          className="text-[#64748B] hover:text-[#1A1A2E]"
          disabled={loading || resendLoading}
          onClick={() => {
            setStep("phone");
            setOtp("");
            setConfirmationResult(null);
            setResendSeconds(0);
            setErrorMessage(null);
          }}
        >
          Change number
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="text-[#0A7EA4] hover:text-[#086a8a]"
          disabled={loading || resendLoading || resendSeconds > 0}
          onClick={() => void sendCode(true)}
        >
          {resendLoading ? (
            <span className="flex items-center gap-2">
              <FiLoader className="h-4 w-4 animate-spin" />
              Sending…
            </span>
          ) : resendSeconds > 0 ? (
            `Resend in ${resendSeconds}s`
          ) : (
            "Resend OTP"
          )}
        </Button>
      </div>
    </div>
  );
}

export function PhoneVerificationDialog({
  open,
  onOpenChange,
  appJwt,
  onSuccess,
  onVerified,
  initialCountryDial,
  initialNationalNumber,
}: PhoneVerificationDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="gap-0 overflow-hidden p-0 sm:max-w-[420px] rounded-2xl border border-[#E2E8F0] bg-white shadow-xl"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <div className="border-b border-[#E2E8F0] bg-gradient-to-br from-[#E8F7FC] to-white px-6 pt-6 pb-5">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0A7EA4]/10">
            <FiShield className="h-6 w-6 text-[#0A7EA4]" aria-hidden />
          </div>
          <DialogHeader className="space-y-1.5 text-left">
            <DialogTitle className="text-xl font-bold text-[#1A1A2E]">
              Verify mobile number
            </DialogTitle>
            <DialogDescription className="flex items-start gap-2 text-sm text-[#64748B]">
              <FiSmartphone className="mt-0.5 h-4 w-4 shrink-0 text-[#0A7EA4]" aria-hidden />
              <span>
                Firebase sends a one-time SMS code. Your account login does not change.
              </span>
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="px-6 py-5">
          {open && appJwt ? (
            <PhoneVerification
              key={`${initialCountryDial}-${initialNationalNumber}-${open}`}
              appJwt={appJwt}
              initialCountryDial={initialCountryDial}
              initialNationalNumber={initialNationalNumber}
              onVerified={onVerified}
              onSuccess={(user) => {
                onSuccess(user);
                onOpenChange(false);
              }}
            />
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
