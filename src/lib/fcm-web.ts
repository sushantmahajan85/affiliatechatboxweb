import { getApiBaseUrl } from "@/lib/api-base-url";
import { getFirebaseApp, isFirebaseConfigured } from "@/lib/firebase-app";

export function getFirebaseWebVapidKey(): string | undefined {
  const k = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY?.trim();
  return k || undefined;
}

function resolveOpenUrl(data: Record<string, string> | undefined): string {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  if (!data) return `${origin}/notifications`;
  const type = data.type || "";
  if (type === "chat_message" && data.senderId) {
    return `${origin}/chats?userId=${encodeURIComponent(data.senderId)}`;
  }
  if (data.postId) {
    return `${origin}/post/${encodeURIComponent(data.postId)}`;
  }
  return `${origin}/notifications`;
}

export async function syncWebFcmTokenToServer(
  userId: string,
  jwt: string
): Promise<boolean> {
  if (typeof window === "undefined" || !userId || !jwt) return false;
  if (!isFirebaseConfigured()) return false;
  const vapidKey = getFirebaseWebVapidKey();
  if (!vapidKey) return false;

  const { getMessaging, getToken, isSupported } = await import("firebase/messaging");
  if (!(await isSupported())) return false;

  const app = getFirebaseApp();
  if (!app) return false;

  const messaging = getMessaging(app);
  const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js", {
    scope: "/",
  });
  await navigator.serviceWorker.ready;
  await registration.update();

  const fcmToken = await getToken(messaging, {
    vapidKey,
    serviceWorkerRegistration: registration,
  });
  if (!fcmToken) return false;

  const base = getApiBaseUrl("http://localhost:8000");
  const res = await fetch(`${base}/api/auth/${userId}/update_web_fcm_token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${jwt}`,
    },
    body: JSON.stringify({ webFcmToken: fcmToken }),
  });
  return res.ok;
}

export async function subscribeForegroundFcm(
  onDisplay: (title: string, body: string, url: string, tag: string) => void
): Promise<() => void> {
  if (typeof window === "undefined" || !isFirebaseConfigured()) {
    return () => undefined;
  }
  if (!getFirebaseWebVapidKey()) {
    return () => undefined;
  }

  const { getMessaging, onMessage, isSupported } = await import("firebase/messaging");
  if (!(await isSupported())) {
    return () => undefined;
  }

  const app = getFirebaseApp();
  if (!app) {
    return () => undefined;
  }

  const messaging = getMessaging(app);
  return onMessage(messaging, (payload) => {
    const data = payload.data as Record<string, string> | undefined;
    const title = payload.notification?.title || "Affiliate Chat Box";
    const body = payload.notification?.body || "";
    const url = resolveOpenUrl(data);
    const tag = `fcm-${data?.type || "n"}-${data?.senderId || data?.postId || Date.now()}`;
    onDisplay(title, body, url, tag);
  });
}
