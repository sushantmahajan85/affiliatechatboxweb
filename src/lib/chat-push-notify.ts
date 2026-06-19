import { getApiBaseUrl } from "@/lib/api-base-url";

/**
 * Web chat notifications: FCM + in-app only.
 * Do not request SMTP email here — it duplicated legacy EmailJS/mobile sends and overloaded the server.
 */
export async function notifyFirestoreChatPush(params: {
  senderId: string;
  receiverId: string;
  message: string;
  messageType?: "text" | "image" | "audio";
  jwt?: string;
}): Promise<void> {
  if (!params.jwt || !params.senderId || !params.receiverId) return;

  const base = getApiBaseUrl("http://localhost:8000");
  try {
    const res = await fetch(`${base}/api/chat/firestore-push`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${params.jwt}`,
      },
      body: JSON.stringify({
        senderId: params.senderId,
        receiverId: params.receiverId,
        message: params.message,
        messageType: params.messageType ?? "text",
        /** Web client: never send duplicate SMTP emails (push/in-app only). */
        skipSmtpEmail: true,
        source: "web",
      }),
    });
    if (!res.ok) {
      let detail = "";
      try {
        const body = (await res.json()) as { message?: string };
        detail = body.message ? `: ${body.message}` : "";
      } catch {
        /* ignore */
      }
      console.warn(
        `[fcm] firestore-push failed (${res.status})${detail} — chat push not sent to receiver`
      );
    }
  } catch (err) {
    console.warn("[fcm] firestore-push error — chat push not sent:", err);
  }
}
