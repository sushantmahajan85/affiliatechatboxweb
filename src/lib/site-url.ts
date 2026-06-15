const DEFAULT_SITE_URL = "https://affiliatechatbox.com";

export function getSiteUrl(): string {
  const fromOrigin = process.env.NEXT_PUBLIC_WEB_APP_ORIGIN?.trim();
  if (fromOrigin) {
    return fromOrigin.replace(/\/+$/, "");
  }

  const vercelUrl = process.env.VERCEL_URL?.trim();
  if (vercelUrl) {
    return `https://${vercelUrl.replace(/\/+$/, "")}`;
  }

  return DEFAULT_SITE_URL;
}
