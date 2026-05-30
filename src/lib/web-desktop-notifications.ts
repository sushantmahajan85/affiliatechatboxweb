const KEY_PUSH_MASTER = "acbx_desktop_push_master";
const KEY_CHAT = "acbx_desktop_notif_chat";

export function getDesktopPushMasterEnabled(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(KEY_PUSH_MASTER) === "1";
}

export function setDesktopPushMasterEnabled(on: boolean): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY_PUSH_MASTER, on ? "1" : "0");
}

export function getDesktopChatNotificationsEnabled(): boolean {
  if (typeof window === "undefined") return true;
  const v = window.localStorage.getItem(KEY_CHAT);
  if (v === null) return true;
  return v === "1";
}

export function setDesktopChatNotificationsEnabled(on: boolean): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY_CHAT, on ? "1" : "0");
}

export function browserNotificationsSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

export async function requestBrowserNotificationPermission(): Promise<NotificationPermission> {
  if (!browserNotificationsSupported()) return "denied";
  if (Notification.permission === "granted") return "granted";
  if (Notification.permission === "denied") return "denied";
  try {
    return await Notification.requestPermission();
  } catch {
    return "denied";
  }
}

export function tryShowDesktopNotification(options: {
  title: string;
  body: string;
  tag: string;
  navigateUrl?: string;
}): void {
  if (!browserNotificationsSupported() || Notification.permission !== "granted") return;
  if (!getDesktopChatNotificationsEnabled()) return;
  // Background tab: FCM service worker handles alerts when push master is on.
  if (
    getDesktopPushMasterEnabled() &&
    typeof document !== "undefined" &&
    document.visibilityState === "hidden"
  ) {
    return;
  }
  try {
    const n = new Notification(options.title, {
      body: options.body,
      tag: options.tag,
      silent: false,
    });
    n.onclick = () => {
      try {
        window.focus();
        if (options.navigateUrl) {
          window.location.assign(options.navigateUrl);
        }
      } finally {
        n.close();
      }
    };
  } catch {
    /* ignore */
  }
}
