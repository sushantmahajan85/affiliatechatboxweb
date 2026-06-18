const STORAGE_KEY_PREFIX = "featured-posts-visible:";

function storageKey(userId: string | null | undefined): string {
  return `${STORAGE_KEY_PREFIX}${userId || "guest"}`;
}

export function readFeaturedPostsVisible(userId: string | null | undefined): boolean {
  if (typeof window === "undefined") return true;
  const stored = window.localStorage.getItem(storageKey(userId));
  if (stored === "0") return false;
  return true;
}

export function writeFeaturedPostsVisible(
  userId: string | null | undefined,
  visible: boolean
): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(storageKey(userId), visible ? "1" : "0");
}
