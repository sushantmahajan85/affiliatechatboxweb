const TERMS_VERSION = "2023-11-25";
const STORAGE_KEY = `terms-accepted:${TERMS_VERSION}`;

export function hasAcceptedTerms(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(STORAGE_KEY) === "1";
}

export function markTermsAccepted(): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, "1");
}

export function clearTermsAcceptance(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}
