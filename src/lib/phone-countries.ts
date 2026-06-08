export type PhoneCountry = {
  dial: string;
  iso: string;
  label: string;
};

export const PHONE_COUNTRIES: PhoneCountry[] = [
  { dial: "91", iso: "IN", label: "India" },
  { dial: "1", iso: "US", label: "United States" },
  { dial: "44", iso: "GB", label: "United Kingdom" },
  { dial: "61", iso: "AU", label: "Australia" },
  { dial: "971", iso: "AE", label: "United Arab Emirates" },
  { dial: "966", iso: "SA", label: "Saudi Arabia" },
  { dial: "880", iso: "BD", label: "Bangladesh" },
  { dial: "65", iso: "SG", label: "Singapore" },
  { dial: "60", iso: "MY", label: "Malaysia" },
  { dial: "92", iso: "PK", label: "Pakistan" },
  { dial: "94", iso: "LK", label: "Sri Lanka" },
  { dial: "977", iso: "NP", label: "Nepal" },
  { dial: "49", iso: "DE", label: "Germany" },
  { dial: "33", iso: "FR", label: "France" },
  { dial: "81", iso: "JP", label: "Japan" },
  { dial: "86", iso: "CN", label: "China" },
  { dial: "55", iso: "BR", label: "Brazil" },
  { dial: "27", iso: "ZA", label: "South Africa" },
  { dial: "234", iso: "NG", label: "Nigeria" },
  { dial: "254", iso: "KE", label: "Kenya" },
];

export const DEFAULT_PHONE_DIAL =
  String(process.env.NEXT_PUBLIC_PHONE_DEFAULT_DIAL || "91").replace(/\D/g, "") ||
  "91";

export const DEFAULT_COUNTRY_ISO =
  PHONE_COUNTRIES.find((c) => c.dial === DEFAULT_PHONE_DIAL)?.iso || "IN";

export function dialToIso(dial: string): string | null {
  const d = dial.replace(/\D/g, "");
  const match = [...PHONE_COUNTRIES]
    .sort((a, b) => b.dial.length - a.dial.length)
    .find((c) => d === c.dial || d.startsWith(c.dial));
  return match?.iso ?? null;
}

export function isoToCountry(iso: string): PhoneCountry | undefined {
  return PHONE_COUNTRIES.find((c) => c.iso === iso.toUpperCase());
}

export function isoToLabel(iso: string): string {
  return isoToCountry(iso)?.label ?? iso.toUpperCase();
}

export function countryOptionsForIso(currentIso?: string | null): PhoneCountry[] {
  const iso = currentIso?.toUpperCase();
  if (!iso || PHONE_COUNTRIES.some((c) => c.iso === iso)) {
    return PHONE_COUNTRIES;
  }
  return [...PHONE_COUNTRIES, { dial: "", iso, label: iso }];
}

export function splitStoredMobileForCountryInputs(
  fullDigits: string,
  defaultDial: string = DEFAULT_PHONE_DIAL
): { dial: string; national: string } {
  const raw = fullDigits.replace(/\D/g, "");
  if (!raw) return { dial: defaultDial, national: "" };
  const sorted = [...PHONE_COUNTRIES].sort((a, b) => b.dial.length - a.dial.length);
  for (const o of sorted) {
    if (raw.startsWith(o.dial) && raw.length > o.dial.length) {
      return { dial: o.dial, national: raw.slice(o.dial.length) };
    }
  }
  if (raw.length === 10) return { dial: defaultDial, national: raw };
  return { dial: defaultDial, national: raw };
}
