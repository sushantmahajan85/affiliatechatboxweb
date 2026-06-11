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

export function recaptchaSiteKeyFixMessage(): string {
  return (
    "Phone reCAPTCHA failed. Try: (1) hard-refresh, (2) open http://127.0.0.1:3000 instead of localhost, " +
    '(3) Google Cloud → reCAPTCHA → "Key for Identity Platform reCAPTCHA integration" (6LdNGRQt…) → ' +
    "add localhost + 127.0.0.1, (4) Firebase Console → Authentication → Settings → reCAPTCHA → set Web key to " +
    "None if App Check Enterprise is enabled, or (5) remove NEXT_PUBLIC_PHONE_OTP_PROVIDER=firebase to use server OTP locally."
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
