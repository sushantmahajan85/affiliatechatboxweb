const DEFAULT_PUBLIC_API_URL =
  "https://online-media-tools-server-vercel.vercel.app";

export function getApiBaseUrl(fallback = DEFAULT_PUBLIC_API_URL): string {
  const raw = process.env.NEXT_PUBLIC_API_URL?.trim();
  const base = raw && raw.length > 0 ? raw : fallback;
  return base.replace(/\/+$/, "");
}
