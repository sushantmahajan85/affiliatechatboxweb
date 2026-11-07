// Lightweight request filter that runs on Netlify's edge before the site.
// Cloudflare already filters traffic to affiliatechatbox.com; this also covers the
// *.netlify.app origin URL, which can be hit directly and skips Cloudflare.
// The site has no database and no /api routes (the API lives on Render), so these
// rules are defence in depth and scanner-noise reduction, not a fix for a known hole.

type EdgeContext = { next: () => Promise<Response> };

const BLOCKED_PATHS = [
  "/.git",
  "/.svn",
  "/.env",
  "/.ds_store",
  "/wp-admin",
  "/wp-login.php",
  "/xmlrpc.php",
  "/phpmyadmin",
  "/cgi-bin/",
  "/api/",
];

// SQL / NoSQL / command / script injection markers in the URL path or query string.
const INJECTION = [
  /<\s*script/,
  /javascript:/,
  /\bunion\b[\s+]+(all[\s+]+)?\bselect\b/,
  /randomblob\s*\(/,
  /\bsleep\s*\(\s*\d+/,
  /\bpg_sleep\b/,
  /\bwaitfor\b[\s+]+\bdelay\b/,
  /\bbenchmark\s*\(/,
  /\$where\b/,
  /[;&|`]\s*(sleep|cat|wget|curl|bash|sh|nc)\b/,
  /\.\.\//,
];

// Boolean SQL probes and comment tails that scanners put into headers.
const HEADER_SQLI = /(\b(and|or)\b\s+['"]?\w+['"]?\s*=\s*['"]?\w+['"]?|\basc\s+--|['"]\s*--\s*$|randomblob\s*\()/;

const BAD_AGENTS = ["sqlmap", "nikto", "nmap", "masscan", "acunetix", "nessus", "wpscan", "dirbuster", "gobuster"];

function decode(value: string): string {
  let out = value;
  // Decode twice so double-encoded payloads (%253Cscript) are caught too.
  for (let i = 0; i < 2; i++) {
    try {
      out = decodeURIComponent(out.replace(/\+/g, " "));
    } catch {
      break;
    }
  }
  return out.toLowerCase();
}

function forbidden(reason: string): Response {
  console.warn(`[waf] blocked: ${reason}`);
  return new Response("Forbidden", {
    status: 403,
    headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" },
  });
}

export default async function waf(request: Request, context: EdgeContext): Promise<Response> {
  const url = new URL(request.url);
  const path = decode(url.pathname);
  const query = decode(url.search);
  const ua = (request.headers.get("user-agent") || "").toLowerCase();
  const referer = decode(request.headers.get("referer") || "");

  if (BLOCKED_PATHS.some((p) => path.startsWith(p))) return forbidden(`path ${url.pathname}`);
  if (INJECTION.some((re) => re.test(path) || re.test(query))) return forbidden(`url ${url.pathname}${url.search}`);
  if (BAD_AGENTS.some((a) => ua.includes(a))) return forbidden(`agent ${ua.slice(0, 60)}`);
  if (HEADER_SQLI.test(ua) || HEADER_SQLI.test(referer)) return forbidden("sql probe in user-agent/referer");

  return context.next();
}

// Static build assets are immutable files: skip them so they stay fast and do not
// count as edge function invocations.
export const config = {
  path: "/*",
  excludedPath: ["/_next/static/*", "/_next/image*", "/assets/*", "/favicon.ico"],
};
