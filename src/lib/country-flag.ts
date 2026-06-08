import { isoToLabel } from "@/lib/phone-countries";

const REGIONAL_INDICATOR_BASE = 0x1f1e6;
const REGIONAL_INDICATOR_END = 0x1f1ff;

/** ISO 3166-1 alpha-2 from "IN", "🇮🇳", or similar stored values. */
export function normalizeCountryCode(flag?: string | null): string | null {
  if (!flag) return null;

  const trimmed = flag.trim();
  if (!trimmed) return null;

  if (/^[a-z]{2}$/i.test(trimmed)) {
    return trimmed.toUpperCase();
  }

  const codePoints = Array.from(trimmed).map((char) => char.codePointAt(0) ?? 0);
  if (
    codePoints.length === 2 &&
    codePoints.every(
      (cp) => cp >= REGIONAL_INDICATOR_BASE && cp <= REGIONAL_INDICATOR_END
    )
  ) {
    return String.fromCharCode(
      ...codePoints.map((cp) => cp - REGIONAL_INDICATOR_BASE + 65)
    );
  }

  return null;
}

export function countryFlagImageUrl(countryCode: string, width = 20): string {
  return `https://flagcdn.com/w${width}/${countryCode.toLowerCase()}.png`;
}

/** Same format as Flutter IntlPhoneField → SharedPreferences flag storage. */
export function countryLabelFromFlag(flag?: string | null): string {
  const iso = normalizeCountryCode(flag);
  return iso ? isoToLabel(iso) : "Global";
}

export function countryCodeToFlagEmoji(isoCode: string): string {
  return isoCode
    .toUpperCase()
    .split("")
    .map((char) => String.fromCodePoint(127397 + char.charCodeAt(0)))
    .join("");
}
