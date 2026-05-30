const AUTH_REQUIRED_EXACT = new Set(["/profile", "/chats"]);

export function isAuthRequiredPath(pathname: string): boolean {
  if (AUTH_REQUIRED_EXACT.has(pathname)) return true;
  if (pathname.startsWith("/chats/")) return true;
  return false;
}

export function isAuthRequiredMenuPath(path: string): boolean {
  return AUTH_REQUIRED_EXACT.has(path);
}
