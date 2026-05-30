import { getApiBaseUrl } from "@/lib/api-base-url";

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
      }),
    });
    if (!res.ok) {
      console.warn("[fcm] firestore-push failed:", res.status);
    }
  } catch (err) {
    console.warn("[fcm] firestore-push error:", err);
  }
}
