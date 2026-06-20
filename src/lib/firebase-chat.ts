import type { Firestore } from "firebase/firestore";
import { notifyFirestoreChatPush } from "@/lib/chat-push-notify";
import { sanitizePlainTextInput } from "@/lib/sanitize-plain-text";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  increment,
  limit,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import type { FirebaseStorage } from "firebase/storage";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";

/** Same admin user id as Flutter `contact_admin.dart` / `posts.dart`. */
export const FIRESTORE_ADMIN_SUPPORT_USER_ID = "658c582ff1bc8978d2300823";

export function isAdminSupportChatPartner(partnerId: string): boolean {
  return partnerId === FIRESTORE_ADMIN_SUPPORT_USER_ID;
}

export function buildChatRoomId(userA: string, userB: string): string {
  const [a, b] = [userA, userB].sort();
  return `${a}_${b}`;
}

export function getPartnerIdFromRoom(users: string[], currentUserId: string): string {
  return users.find((u) => u !== currentUserId) ?? "";
}

export function unreadForCurrentUser(
  data: Record<string, unknown>,
  currentUserId: string
): number {
  const receiverId = String(data.receiverId ?? "");
  const unreadTo = Number(data.unreadCountTo ?? 0);
  const unreadFrom = Number(data.unreadCountFrom ?? 0);
  if (currentUserId === receiverId) return unreadTo;
  return unreadFrom;
}

export interface FirestoreChatRoomRow {
  chatRoomId: string;
  partnerId: string;
  lastMessage: string;
  timestampMs: number;
  isRequested: string;
  unreadCount: number;
  senderId: string;
  receiverId: string;
  isBlocked?: boolean;
}

/** Optional filter — admin support is shown in main inbox / overlay (same as Chats tab). */
export function filterInboxFirestoreRooms(rows: FirestoreChatRoomRow[]): FirestoreChatRoomRow[] {
  return rows.filter((r) => !isAdminSupportChatPartner(r.partnerId));
}

export function subscribeMyChats(
  db: Firestore,
  currentUserId: string,
  onUpdate: (rows: FirestoreChatRoomRow[]) => void,
  onError?: (e: Error) => void
): () => void {
  const q = query(collection(db, "chats"), where("users", "array-contains", currentUserId));
  return onSnapshot(
    q,
    (snap) => {
      const rows: FirestoreChatRoomRow[] = snap.docs.map((d) => {
        const x = d.data();
        const users = (x.users as string[]) ?? [];
        const ts = x.timestamp;
        const timestampMs =
          ts && typeof (ts as { toMillis?: () => number }).toMillis === "function"
            ? (ts as { toMillis: () => number }).toMillis()
            : 0;
        return {
          chatRoomId: d.id,
          partnerId: getPartnerIdFromRoom(users, currentUserId),
          lastMessage: String(x.lastMessage ?? ""),
          timestampMs,
          isRequested: String(x.isRequested ?? ""),
          unreadCount: unreadForCurrentUser(x as Record<string, unknown>, currentUserId),
          senderId: String(x.senderId ?? ""),
          receiverId: String(x.receiverId ?? ""),
          isBlocked: Boolean(x.isBlocked),
        };
      });
      rows.sort((a, b) => b.timestampMs - a.timestampMs);
      onUpdate(rows);
    },
    (err) => onError?.(err instanceof Error ? err : new Error(String(err)))
  );
}

export interface FirestoreMessageRow {
  id: string;
  text: string;
  sender: "me" | "them";
  timeLabel: string;
  timestampMs: number;
  messageType: string;
  imageUrl: string | null;
}

function formatTime(ms: number): string {
  try {
    return new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(
      new Date(ms)
    );
  } catch {
    return "";
  }
}

export function subscribeChatMessages(
  db: Firestore,
  chatRoomId: string,
  currentUserId: string,
  onUpdate: (rows: FirestoreMessageRow[]) => void,
  onError?: (e: Error) => void
): () => void {
  const q = query(
    collection(doc(db, "chats", chatRoomId), "messages"),
    orderBy("timestamp", "asc"),
    limit(200)
  );
  return onSnapshot(
    q,
    (snap) => {
      const rows: FirestoreMessageRow[] = snap.docs.map((d) => {
        const x = d.data();
        const ts = x.timestamp;
        const timestampMs =
          ts && typeof (ts as { toMillis?: () => number }).toMillis === "function"
            ? (ts as { toMillis: () => number }).toMillis()
            : 0;
        const sid = String(x.senderId ?? "");
        return {
          id: d.id,
          text: String(x.message ?? ""),
          sender: sid === currentUserId ? "me" : "them",
          timeLabel: formatTime(timestampMs),
          timestampMs,
          messageType: String(x.type ?? "text"),
          imageUrl: x.imageUrl != null ? String(x.imageUrl) : null,
        };
      });
      onUpdate(rows);
    },
    (err) => onError?.(err instanceof Error ? err : new Error(String(err)))
  );
}

export function subscribeChatRoomDoc(
  db: Firestore,
  chatRoomId: string,
  onUpdate: (data: Record<string, unknown> | null) => void,
  onError?: (e: Error) => void
): () => void {
  const ref = doc(db, "chats", chatRoomId);
  return onSnapshot(
    ref,
    (snap) => {
      onUpdate(snap.exists() ? (snap.data() as Record<string, unknown>) : null);
    },
    (err) => onError?.(err instanceof Error ? err : new Error(String(err)))
  );
}

export async function sendFirestoreChatMessage(
  db: Firestore,
  params: {
    currentUserId: string;
    receiverId: string;
    message: string;
    messageType: "text" | "image" | "audio";
    imageUrl?: string | null;
    audioUrl?: string | null;
    authToken?: string;
  }
): Promise<string> {
  const { currentUserId, receiverId, message, messageType, imageUrl, audioUrl, authToken } = params;
  const safeMessage = sanitizePlainTextInput(message);
  const chatRoomId = buildChatRoomId(currentUserId, receiverId);
  const chatRef = doc(db, "chats", chatRoomId);

  await runTransaction(db, async (txn) => {
    const snap = await txn.get(chatRef);
    const newMsgRef = doc(collection(chatRef, "messages"));
    const msg: Record<string, unknown> = {
      senderId: currentUserId,
      receiverId,
      message: safeMessage,
      timestamp: serverTimestamp(),
      lastMessageStatus: "Delivered",
      type: messageType,
    };
    if (imageUrl) msg.imageUrl = imageUrl;
    if (audioUrl) msg.audioUrl = audioUrl;
    txn.set(newMsgRef, msg);

    if (!snap.exists()) {
      txn.set(chatRef, {
        users: [currentUserId, receiverId].sort(),
        senderId: currentUserId,
        receiverId,
        chatRoomId,
        isRequested: "pending",
        unreadCountFrom: 0,
        unreadCountTo: 1,
        lastMessage: safeMessage,
        timestamp: serverTimestamp(),
      });
      return;
    }

    const d = snap.data() as Record<string, unknown>;
    const updates: Record<string, unknown> = {
      lastMessage: safeMessage,
      timestamp: serverTimestamp(),
    };
    if (currentUserId === String(d.senderId ?? "")) {
      updates.unreadCountTo = increment(1);
    } else {
      updates.unreadCountFrom = increment(1);
    }
    txn.update(chatRef, updates);
  });

  void notifyFirestoreChatPush({
    senderId: currentUserId,
    receiverId,
    message: safeMessage,
    messageType,
    jwt: authToken,
  });

  return chatRoomId;
}

/** Matches Flutter `ChatService.sendAdminMessage` — new admin threads start as `accepted`, not `pending`. */
export async function sendFirestoreAdminMessage(
  db: Firestore,
  params: {
    currentUserId: string;
    adminReceiverId: string;
    message: string;
    messageType: "text" | "image";
    imageUrl?: string | null;
    authToken?: string;
  }
): Promise<string> {
  const { currentUserId, adminReceiverId, message, messageType, imageUrl, authToken } = params;
  const safeMessage = sanitizePlainTextInput(message);
  const chatRoomId = buildChatRoomId(currentUserId, adminReceiverId);
  const chatRef = doc(db, "chats", chatRoomId);

  await runTransaction(db, async (txn) => {
    const snap = await txn.get(chatRef);
    const newMsgRef = doc(collection(chatRef, "messages"));
    const msg: Record<string, unknown> = {
      senderId: currentUserId,
      receiverId: adminReceiverId,
      message: safeMessage,
      timestamp: serverTimestamp(),
      lastMessageStatus: "Delivered",
      type: messageType,
    };
    if (imageUrl) msg.imageUrl = imageUrl;
    txn.set(newMsgRef, msg);

    if (!snap.exists()) {
      txn.set(chatRef, {
        users: [currentUserId, adminReceiverId].sort(),
        senderId: currentUserId,
        receiverId: adminReceiverId,
        chatRoomId,
        isRequested: "accepted",
        unreadCountFrom: 0,
        unreadCountTo: 1,
        lastMessage: safeMessage,
        timestamp: serverTimestamp(),
      });
      return;
    }

    const d = snap.data() as Record<string, unknown>;
    const updates: Record<string, unknown> = {
      lastMessage: safeMessage,
      timestamp: serverTimestamp(),
    };
    if (currentUserId === String(d.senderId ?? "")) {
      updates.unreadCountTo = increment(1);
    } else {
      updates.unreadCountFrom = increment(1);
    }
    txn.update(chatRef, updates);
  });

  void notifyFirestoreChatPush({
    senderId: currentUserId,
    receiverId: adminReceiverId,
    message: safeMessage,
    messageType,
    jwt: authToken,
  });

  return chatRoomId;
}

export async function uploadFirestoreChatImage(
  storage: FirebaseStorage,
  params: { userId: string; chatRoomId: string; data: Uint8Array; contentType: string }
): Promise<string> {
  const fileName = `${params.userId}-${Date.now()}.jpg`;
  const storageRef = ref(storage, `chat_images/${params.chatRoomId}/${fileName}`);
  await uploadBytes(storageRef, params.data, { contentType: params.contentType });
  return getDownloadURL(storageRef);
}

export async function acceptFirestoreChatRequest(db: Firestore, chatRoomId: string): Promise<void> {
  await updateDoc(doc(db, "chats", chatRoomId), { isRequested: "accepted" });
}

export async function resetUnreadCount(
  db: Firestore,
  chatRoomId: string,
  currentUserId: string
): Promise<void> {
  const chatRef = doc(db, "chats", chatRoomId);
  const snap = await getDoc(chatRef);
  if (!snap.exists()) return;
  const chatData = snap.data() as Record<string, unknown>;
  const users = (chatData.users as string[]) ?? [];
  if (!users.includes(currentUserId)) return;
  if (currentUserId === String(chatData.receiverId ?? "")) {
    await updateDoc(chatRef, { unreadCountTo: 0 });
  } else if (currentUserId === String(chatData.senderId ?? "")) {
    await updateDoc(chatRef, { unreadCountFrom: 0 });
  }
}

export async function markDeliveredMessagesAsSeen(
  db: Firestore,
  chatRoomId: string,
  currentUserId: string
): Promise<void> {
  const chatRef = doc(db, "chats", chatRoomId);
  const snap = await getDocs(collection(chatRef, "messages"));
  for (const messageDoc of snap.docs) {
    const m = messageDoc.data();
    if (m.lastMessageStatus === "Delivered" && String(m.receiverId ?? "") === currentUserId) {
      await updateDoc(messageDoc.ref, { lastMessageStatus: "Seen" });
    }
  }
}

export async function onChatOpenSideEffects(
  db: Firestore,
  chatRoomId: string,
  currentUserId: string
): Promise<void> {
  await markDeliveredMessagesAsSeen(db, chatRoomId, currentUserId);
  await resetUnreadCount(db, chatRoomId, currentUserId);
}
