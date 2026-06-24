function svgDataUri(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg.trim())}`;
}

const LINKEDIN_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48" fill="none"><rect width="48" height="48" rx="12" fill="#0A66C2"/><path fill="#fff" d="M14.5 19.5h4.2v14.5H14.5V19.5zm2.1-6.8a2.4 2.4 0 1 1 0 4.8 2.4 2.4 0 0 1 0-4.8zm6.4 6.8h4v2h.1c.6-1.1 2-2.3 4.1-2.3 4.4 0 5.2 2.9 5.2 6.7v8.1h-4.2v-7.2c0-1.7 0-3.9-2.4-3.9s-2.8 1.9-2.8 3.8v7.3h-4.2V19.5z"/></svg>`;

const WEB_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48" fill="none"><rect width="48" height="48" rx="12" fill="#0A7EA4"/><circle cx="24" cy="24" r="11" stroke="#fff" stroke-width="2"/><ellipse cx="24" cy="24" rx="5" ry="11" stroke="#fff" stroke-width="2"/><path stroke="#fff" stroke-width="2" d="M13 24h22M14 18h20M14 30h20"/></svg>`;

const GOOGLE_PLAY_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48" fill="none"><rect width="48" height="48" rx="12" fill="#01875F"/><path fill="#fff" d="M17 15.5 31.5 24 17 32.5V15.5z"/><path fill="#34A853" d="M17 15.5 24.5 24 17 32.5V15.5z" opacity=".9"/><path fill="#FBBC04" d="M24.5 24 31.5 19.2 31.5 28.8 24.5 24z"/><path fill="#EA4335" d="M31.5 19.2 35.5 21.5c.8.5 1.3 1.3 1.3 2.3s-.5 1.8-1.3 2.3l-4 2.3-4-7.2z"/></svg>`;

const APPLE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48" fill="none"><rect width="48" height="48" rx="12" fill="#111827"/><path fill="#fff" d="M30.8 25.1c-.1-2.5 2-3.7 2.1-3.8-1.1-1.7-2.9-1.9-3.5-2-1.5-.2-3 .9-3.8.9-.8 0-2-.9-3.3-.9-1.7 0-3.2 1-4.1 2.5-1.7 3-.4 7.4 1.2 9.8.8 1.2 1.8 2.5 3.1 2.4 1.2-.1 1.7-.8 3.2-.8 1.5 0 1.9.8 3.2.8 1.3 0 2.1-1.2 2.9-2.4 1-1.3 1.4-2.6 1.4-2.7-.1 0-2.8-1.1-2.8-4.2z"/><path fill="#fff" d="M28.5 17.8c.7-.8 1.1-2 .9-3.2-1 .1-2.2.7-2.9 1.5-.6.7-1.2 1.9-1 3 1.1.1 2.3-.6 3-1.3z"/></svg>`;

export const EMAIL_PROMO_ICON_DATA_URIS = {
  linkedin: svgDataUri(LINKEDIN_SVG),
  web: svgDataUri(WEB_SVG),
  googlePlay: svgDataUri(GOOGLE_PLAY_SVG),
  apple: svgDataUri(APPLE_SVG),
} as const;
