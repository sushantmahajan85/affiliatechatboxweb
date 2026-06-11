import { getApiBaseUrl } from "@/lib/api-base-url";

export function formatToE164(countryDial: string, nationalNumber: string): string {
  const dial = countryDial.replace(/\D/g, "");
  const national = nationalNumber.replace(/\D/g, "");
  if (!dial || !national) return "";
  return `+${dial}${national}`;
}

export function isValidE164(phone: string): boolean {
  return /^\+[1-9]\d{7,14}$/.test(phone);
}

export type OtpProvider = "firebase" | "server";

export function getPhoneOtpProvider(): OtpProvider {
  const forced = process.env.NEXT_PUBLIC_PHONE_OTP_PROVIDER?.trim();
  if (forced === "server") return "server";
  if (forced === "firebase") return "firebase";
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (host === "localhost" || host === "127.0.0.1") return "server";
  }
  return "firebase";
}

export function isInvalidRecaptchaSiteKey(message: string): boolean {
  return message.includes("Invalid site key") || message.includes("6LdNGRQt");
}

export function isRecaptchaPhoneError(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    isInvalidRecaptchaSiteKey(message) ||
    lower.includes("recaptcha placeholder") ||
    lower.includes("captcha-check-failed") ||
    lower.includes("invalid-app-credential")
  );
}

export function recaptchaSiteKeyFixMessage(): string {
  const isLocal =
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");

  if (isLocal) {
    return (
      "Phone reCAPTCHA failed on localhost. Use backend OTP (remove NEXT_PUBLIC_PHONE_OTP_PROVIDER=firebase) " +
      "or add localhost to the 6LdNGRQt reCAPTCHA key in Google Cloud."
    );
  }

  return (
    "Firebase phone reCAPTCHA failed. In Firebase Console → Authentication → Settings → reCAPTCHA, " +
    "set the Web key to None (App Check Enterprise cannot share keys with phone auth). Then hard-refresh."
  );
}

export async function sendServerPhoneOtp(
  e164: string,
  appJwt: string
): Promise<{ smsSent: boolean; devCode?: string }> {
  const digits = e164.replace(/\D/g, "");
  const res = await fetch(`${getApiBaseUrl()}/api/auth/send-phone-otp`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${appJwt}`,
    },
    body: JSON.stringify({ mobileNumber: digits }),
  });
  const data = (await res.json().catch(() => ({}))) as {
    message?: string;
    smsSent?: boolean;
    _devCode?: string;
  };
  if (!res.ok) {
    throw new Error(data.message || "Failed to send code");
  }
  return { smsSent: Boolean(data.smsSent), devCode: data._devCode };
}

export async function verifyServerPhoneOtp(
  e164: string,
  code: string,
  appJwt: string
): Promise<{ user: { jwttoken: string } & Record<string, unknown> }> {
  const digits = e164.replace(/\D/g, "");
  const res = await fetch(`${getApiBaseUrl()}/api/auth/verify_otp`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${appJwt}`,
    },
    body: JSON.stringify({ mobileNumber: digits, userOTP: code }),
  });
  const data = (await res.json().catch(() => ({}))) as {
    message?: string;
    user?: { jwttoken: string } & Record<string, unknown>;
  };
  if (!res.ok || !data.user) {
    throw new Error(data.message || "Invalid code");
  }
  return { user: data.user };
}
