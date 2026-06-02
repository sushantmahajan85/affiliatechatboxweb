import { getApiBaseUrl } from "@/lib/api-base-url";

/** Start LinkedIn OAuth on the API; pass current site origin so callback returns here. */
export function getLinkedInAuthUrl(): string {
  const params = new URLSearchParams({ t: String(Date.now()) });
  if (typeof window !== "undefined") {
    params.set("frontend_origin", window.location.origin);
  }
  return `${getApiBaseUrl()}/auth/linkedin?${params.toString()}`;
}
