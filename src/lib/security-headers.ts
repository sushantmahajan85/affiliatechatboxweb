type HeaderEntry = { key: string; value: string };

function buildCsp(isProduction: boolean): string {
  const connectSrc = [
    "'self'",
    ...(isProduction
      ? []
      : [
          "http://localhost:*",
          "http://127.0.0.1:*",
          "ws://localhost:*",
          "ws://127.0.0.1:*",
        ]),
    "https://online-media-tools-server-vercel.onrender.com",
    "https://*.googleapis.com",
    "https://*.firebaseio.com",
    "https://*.firebase.googleapis.com",
    "wss://*.firebaseio.com",
    "https://accounts.google.com",
    "https://www.googleapis.com",
    "https://flagcdn.com",
    "https://onlinemediadeals.s3.eu-north-1.amazonaws.com",
    "https://lh3.googleusercontent.com",
    "https://media.licdn.com",
    "https://static.cloudflareinsights.com",
    "https://assets.mixkit.co",
  ];

  // Only the hosts the app actually loads images from (uploads, Google/LinkedIn avatars,
  // generated avatars, flags, chat images), instead of any https: origin.
  const imgSrc = [
    "'self'",
    "data:",
    "blob:",
    "https://onlinemediadeals.s3.eu-north-1.amazonaws.com",
    "https://*.googleusercontent.com",
    "https://*.gstatic.com",
    "https://firebasestorage.googleapis.com",
    "https://media.licdn.com",
    "https://static.licdn.com",
    "https://ui-avatars.com",
    "https://flagcdn.com",
    "https://user-images.githubusercontent.com",
  ];

  // Post videos (S3), chat media (Firebase Storage), notification sound.
  const mediaSrc = [
    "'self'",
    "blob:",
    "https://onlinemediadeals.s3.eu-north-1.amazonaws.com",
    "https://firebasestorage.googleapis.com",
    "https://assets.mixkit.co",
  ];

  // React only needs eval in development (debug stacks); production must not allow it.
  const scriptSrc = [
    "'self'",
    "'unsafe-inline'",
    ...(isProduction ? [] : ["'unsafe-eval'"]),
    "https://www.gstatic.com",
    "https://www.googleapis.com",
    "https://apis.google.com",
    "https://accounts.google.com",
    "https://static.cloudflareinsights.com",
  ];

  const directives = [
    "default-src 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "object-src 'none'",
    `script-src ${scriptSrc.join(" ")}`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' data: https://fonts.gstatic.com",
    `img-src ${imgSrc.join(" ")}`,
    `media-src ${mediaSrc.join(" ")}`,
    `connect-src ${connectSrc.join(" ")}`,
    "frame-src 'self' https://accounts.google.com https://www.linkedin.com https://*.firebaseapp.com",
    "worker-src 'self' blob:",
    "manifest-src 'self'",
  ];

  if (isProduction) {
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
