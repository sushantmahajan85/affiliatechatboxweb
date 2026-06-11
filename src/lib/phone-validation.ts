import { isValidPhoneNumber, parsePhoneNumber } from "react-phone-number-input";
import type { Country } from "react-phone-number-input";

const FORMAT_HINTS: Partial<Record<Country, string>> = {
  BD: "11 digits starting with 01 (e.g. 01712345678)",
  IN: "10 digits starting with 6, 7, 8, or 9",
  US: "10 digits",
  GB: "10 or 11 digits",
  PK: "10 digits starting with 3",
  AE: "9 digits",
  SA: "9 digits starting with 5",
};

export function getPhoneFormatHint(country?: Country): string | null {
  if (!country) return null;
  return FORMAT_HINTS[country] ?? null;
}

export function getPhoneValidationError(
  value: string | undefined,
  country?: Country
): string | null {
  if (!value?.trim()) {
    return "Enter your mobile number.";
  }

  const parsed = parsePhoneNumber(value);
  if (!parsed) {
    const hint = getPhoneFormatHint(country);
    return hint ? `Invalid number. Use ${hint}.` : "Enter a valid phone number.";
  }

  if (isValidPhoneNumber(value)) {
    return null;
  }

  if (country === "BD") {
    const nationalDigits = parsed.nationalNumber.replace(/\D/g, "");
    if (nationalDigits.length < 10) {
      return "Too short. Bangladesh numbers need 11 digits (e.g. 01712345678).";
    }
    if (!/^1[3-9]\d{8}$/.test(nationalDigits)) {
      return "Invalid Bangladesh number. Use 01[3-9] followed by 8 digits.";
    }
    return "Invalid Bangladesh mobile number.";
  }

  const hint = getPhoneFormatHint(country);
  return hint ? `Invalid number. Use ${hint}.` : "Enter a valid phone number.";
}
