import { useMemo } from "react";
import { useAppSelector } from "@/store/hooks";
import { useGetConversationsQuery } from "@/store/endpoints/chats";
import { useFirebaseChatRoomsContext, useChatBackendIsFirebase } from "@/context/FirebaseChatRoomsProvider";
import { filterInboxFirestoreRooms, isAdminSupportChatPartner } from "@/lib/firebase-chat";

export type InboxPreviewChat = {
  id: string;
  name: string;
  avatar: string;
  lastMsg: string;
  status: "online" | "offline";
  unreadCount: number;
  isRequest: boolean;
};

export function useInboxPreviewChats(): {
  recentChats: InboxPreviewChat[];
  inboxReady: boolean;
  useFb: boolean;
} {
  const currentUser = useAppSelector((s) => s.auth.user);
  const useFb = useChatBackendIsFirebase();
  const listCtx = useFirebaseChatRoomsContext();

  const convQuery = useGetConversationsQuery(currentUser?._id || "", {
    skip: !currentUser?._id || useFb,
    pollingInterval: 5000,
  });

  const recentChats = useMemo((): InboxPreviewChat[] => {
    if (useFb) {
      return filterInboxFirestoreRooms(listCtx.rooms).map((r) => ({
        id: r.partnerId,
        name: "User",
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(r.partnerId.slice(-6))}&background=0A66C2&color=fff`,
        lastMsg: r.lastMessage,
        status: "online" as const,
        unreadCount: r.unreadCount,
        isRequest: r.isRequested !== "accepted",
      }));
    }
    const convData = convQuery.data;
    if (!convData?.conversations) return [];
    return convData.conversations
      .filter((c) => !isAdminSupportChatPartner(String(c.id)))
      .map((c) => ({
        id: c.id,
        name: c.name,
        avatar: c.avatar,
        lastMsg: c.lastMessage,
        status: c.online ? ("online" as const) : ("offline" as const),
        unreadCount: c.unreadCount,
        isRequest: c.unreadCount > 0,
      }));
  }, [useFb, listCtx.rooms, convQuery.data]);

  const inboxReady = useFb
    ? listCtx.listLoaded
    : Boolean(currentUser?._id) && !useFb && convQuery.isSuccess;

  return { recentChats, inboxReady, useFb };
}
