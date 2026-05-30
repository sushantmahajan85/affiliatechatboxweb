import { getApiBaseUrl } from "@/lib/api-base-url";
import { getFirebaseApp, isFirebaseConfigured } from "@/lib/firebase-app";

export function getFirebaseWebVapidKey(): string | undefined {
  const k = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY?.trim();
  return k || undefined;
}

export type FcmSyncResult =
  | { ok: true }
  | { ok: false; reason: string };

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

async function getMessagingServiceWorkerRegistration(): Promise<ServiceWorkerRegistration> {
  const existing = await navigator.serviceWorker.getRegistration("/");
  if (existing?.active) {
    await existing.update();
    return existing;
  }
  const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js", {
    scope: "/",
  });
  await navigator.serviceWorker.ready;
  await registration.update();
  return registration;
}

function mapFcmError(err: unknown): string {
  const code =
    err && typeof err === "object" && "code" in err
      ? String((err as { code?: string }).code)
      : "";
  if (code === "messaging/permission-blocked") {
    return "Notifications are blocked in your browser. Allow them in site settings and try again.";
  }
  if (code === "messaging/permission-default") {
    return "Notification permission was not granted.";
  }
  if (code === "messaging/failed-service-worker-registration") {
    return "Could not register the push service worker. Hard-refresh the page and try again.";
  }
  if (code === "messaging/unsupported-browser") {
    return "This browser does not support Firebase web push.";
  }
  if (err instanceof Error && err.message) return err.message;
  return "Could not obtain a Firebase web push token.";
}

export async function syncWebFcmTokenToServer(
  userId: string,
  jwt: string
): Promise<FcmSyncResult> {
  if (typeof window === "undefined" || !userId || !jwt) {
    return { ok: false, reason: "You must be logged in on this browser." };
  }
  if (!isFirebaseConfigured()) {
    return { ok: false, reason: "Firebase is not configured (NEXT_PUBLIC_FIREBASE_*)." };
  }
  const vapidKey = getFirebaseWebVapidKey();
  if (!vapidKey) {
    return {
      ok: false,
      reason:
        "Missing NEXT_PUBLIC_FIREBASE_VAPID_KEY (Firebase Console → Cloud Messaging → Web Push certificates).",
    };
  }

  try {
    const { getMessaging, getToken, isSupported } = await import("firebase/messaging");
    if (!(await isSupported())) {
      return { ok: false, reason: "This browser does not support Firebase web push." };
    }

    const app = getFirebaseApp();
    if (!app) {
      return { ok: false, reason: "Firebase app failed to initialize." };
    }

    const messaging = getMessaging(app);
    const registration = await getMessagingServiceWorkerRegistration();

    const fcmToken = await getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration: registration,
    });
    if (!fcmToken) {
      return { ok: false, reason: "Firebase returned an empty device token." };
    }

    const base = getApiBaseUrl("http://localhost:8000");
    const res = await fetch(`${base}/api/auth/${userId}/update_web_fcm_token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${jwt}`,
      },
      body: JSON.stringify({ webFcmToken: fcmToken }),
    });

    if (!res.ok) {
      let detail = "";
      try {
        const body = (await res.json()) as { message?: string };
        detail = body.message ? `: ${body.message}` : "";
      } catch {
        /* ignore */
      }
      return {
        ok: false,
        reason: `Server rejected the web push token (${res.status})${detail}. Check NEXT_PUBLIC_API_URL and that you are logged in.`,
      };
    }

    return { ok: true };
  } catch (err) {
    return { ok: false, reason: mapFcmError(err) };
  }
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
