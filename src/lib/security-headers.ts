type HeaderEntry = { key: string; value: string };

function buildCsp(includeUpgradeInsecureRequests: boolean): string {
  const directives = [
    "default-src 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.gstatic.com https://www.googleapis.com https://apis.google.com https://accounts.google.com https://static.cloudflareinsights.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' data: https://fonts.gstatic.com",
    "img-src 'self' data: blob: https:",
    "media-src 'self' https: blob:",
    "connect-src 'self' http://localhost:* http://127.0.0.1:* ws://localhost:* ws://127.0.0.1:* https://online-media-tools-server-vercel.vercel.app https://online-media-tools-server-vercel.onrender.com https://*.googleapis.com https://*.firebaseio.com https://*.firebase.googleapis.com wss://*.firebaseio.com https://accounts.google.com https://www.googleapis.com https://flagcdn.com https://onlinemediadeals.s3.eu-north-1.amazonaws.com https://lh3.googleusercontent.com https://media.licdn.com https://static.cloudflareinsights.com https://assets.mixkit.co",
    "frame-src 'self' https://accounts.google.com https://www.linkedin.com https://*.firebaseapp.com",
    "worker-src 'self' blob:",
    "manifest-src 'self'",
  ];

  if (includeUpgradeInsecureRequests) {
    directives.push("upgrade-insecure-requests");
  }

  return directives.join("; ");
}

export function getSecurityHeaders(isProduction: boolean): HeaderEntry[] {
  const headers: HeaderEntry[] = [
    { key: "Content-Security-Policy", value: buildCsp(isProduction) },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    {
      key: "Permissions-Policy",
      value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
    },
    { key: "X-DNS-Prefetch-Control", value: "on" },
  ];

  if (isProduction) {
    headers.splice(1, 0, {
      key: "Strict-Transport-Security",
      value: "max-age=63072000; includeSubDomains; preload",
    });
  }

  return headers;
}

export const STATIC_CACHE_HEADERS: HeaderEntry[] = [
  { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
];
