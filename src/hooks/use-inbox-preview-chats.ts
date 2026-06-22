import { useMemo } from "react";
import { useAppSelector } from "@/store/hooks";
import { useGetConversationsQuery } from "@/store/endpoints/chats";
import { useGetChatRequestNotificationsQuery } from "@/store/endpoints/notifications";
import { useFirebaseChatRoomsContext, useChatBackendIsFirebase } from "@/context/FirebaseChatRoomsProvider";
import { isSelfChatPartner } from "@/lib/linkedin-messaging";

export type InboxPreviewChat = {
  id: string;
  name: string;
  avatar: string;
  lastMsg: string;
  time: string | null;
  status: "online" | "offline";
  unreadCount: number;
  isRequest: boolean;
  isSuspended?: boolean;
  isDeleted?: boolean;
  accountDisabled?: boolean;
  accountStatus?: "active" | "suspended" | "deleted";
};

function isRestChatRequest(
  partnerId: string,
  currentUserId: string,
  notifs: { senderId?: string; receiverId?: string | null; type: string; isRead: boolean }[] | undefined
): boolean {
  if (!notifs?.length) return false;
  const incoming = notifs.some(
    (n) =>
      String(n.senderId) === String(partnerId) &&
      String(n.receiverId) === String(currentUserId) &&
      n.type === "chat_request" &&
      !n.isRead
  );
  const outgoing = notifs.some(
    (n) =>
      String(n.senderId) === String(currentUserId) &&
      String(n.receiverId) === String(partnerId) &&
      n.type === "chat_request" &&
      !n.isRead
  );
  return incoming || outgoing;
}

export function useInboxPreviewChats(): {
  recentChats: InboxPreviewChat[];
  inboxReady: boolean;
  useFb: boolean;
} {
  const currentUser = useAppSelector((s) => s.auth.user);
  const currentUserId = currentUser?._id || "";
  const useFb = useChatBackendIsFirebase();
  const listCtx = useFirebaseChatRoomsContext();

  const convQuery = useGetConversationsQuery(currentUserId, {
    skip: !currentUserId || useFb,
    pollingInterval: 15000,
  });

  const { data: notifData } = useGetChatRequestNotificationsQuery(currentUserId, {
    skip: !currentUserId || useFb,
    pollingInterval: 15000,
  });

  const recentChats = useMemo((): InboxPreviewChat[] => {
    if (useFb) {
      return listCtx.rooms
        .filter((r) => !isSelfChatPartner(currentUserId, r.partnerId))
        .map((r) => ({
        id: r.partnerId,
        name: "User",
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(r.partnerId.slice(-6))}&background=0A66C2&color=fff`,
        lastMsg: r.lastMessage,
        time: r.timestampMs ? new Date(r.timestampMs).toISOString() : null,
        status: "online" as const,
        unreadCount: r.unreadCount,
        isRequest: r.isRequested !== "accepted",
      }));
    }
    const convData = convQuery.data;
    if (!convData?.conversations) return [];
    return convData.conversations
      .map((c) => ({
        id: c.id,
        name: c.name,
        avatar: c.avatar,
        lastMsg: c.lastMessage,
        time: c.time,
        status: c.online && !c.accountDisabled ? ("online" as const) : ("offline" as const),
        unreadCount: c.accountDisabled ? 0 : c.unreadCount,
        isRequest: isRestChatRequest(c.id, currentUserId, notifData?.notifs),
        isSuspended: c.isSuspended,
        isDeleted: c.isDeleted,
        accountDisabled: c.accountDisabled,
        accountStatus: c.accountStatus,
      }));
  }, [useFb, listCtx.rooms, convQuery.data, notifData?.notifs, currentUserId]);

  const inboxReady = useFb
    ? listCtx.listLoaded
    : Boolean(currentUserId) && !useFb && convQuery.isSuccess;

  return { recentChats, inboxReady, useFb };
}
