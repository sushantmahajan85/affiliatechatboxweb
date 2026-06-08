const DISMISS_STORAGE_KEY = "acb_mobile_app_install_dismissed_until";
const DISMISS_MS = 7 * 24 * 60 * 60 * 1000;

export const ANDROID_PLAY_STORE_URL =
  process.env.NEXT_PUBLIC_ANDROID_APP_URL ||
  "https://play.google.com/store/apps/details?id=com.project.omd";

export const IOS_APP_STORE_URL =
  process.env.NEXT_PUBLIC_IOS_APP_URL ||
  "https://apps.apple.com/app/affiliate-chat-box/id6477887051";

export function isMobileOrTabletDevice(): boolean {
  if (typeof navigator === "undefined") return false;

  const ua = navigator.userAgent || "";

  if (/Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua)) {
    return true;
  }

  if (/iPad/i.test(ua)) return true;

  if (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1) {
    return true;
  }

  return false;
}

export function getMobileAppStoreUrl(): string {
  if (typeof navigator === "undefined") return ANDROID_PLAY_STORE_URL;

  const ua = navigator.userAgent || "";
  const isApple =
    /iPhone|iPad|iPod/i.test(ua) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

  return isApple ? IOS_APP_STORE_URL : ANDROID_PLAY_STORE_URL;
}

export function isMobileAppInstallPromptDismissed(): boolean {
  if (typeof window === "undefined") return true;

  try {
    const until = localStorage.getItem(DISMISS_STORAGE_KEY);
    if (!until) return false;
    return Date.now() < new Date(until).getTime();
  } catch {
    return false;
  }
}

export function dismissMobileAppInstallPrompt(): void {
  if (typeof window === "undefined") return;

  try {
    const until = new Date(Date.now() + DISMISS_MS);
    localStorage.setItem(DISMISS_STORAGE_KEY, until.toISOString());
  } catch {
    /* ignore quota / private mode */
  }
}

export function shouldShowMobileAppInstallPrompt(): boolean {
  return isMobileOrTabletDevice() && !isMobileAppInstallPromptDismissed();
}
