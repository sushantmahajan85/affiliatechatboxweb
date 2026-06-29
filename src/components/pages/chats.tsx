"use client";

import { ChatComposer } from "../chat-composer";
import { sanitizeTextOnChange } from "@/lib/sanitize-plain-text";
import { LinkedinChatGuardDialog } from "@/components/linkedin-chat-guard-dialog";
import { getLinkedinChatBlockReason, isSelfChatPartner } from "@/lib/linkedin-messaging";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";
import { useFirebaseChatModule } from "@/hooks/useFirebaseChatModule";
import { useChatBackendIsFirebase } from "@/context/FirebaseChatRoomsProvider";
import { getFirebaseStorage, getFirestoreDb, isFirebaseConfigured } from "@/lib/firebase-app";
import {
  buildChatRoomId,
  isAdminSupportChatPartner,
  sendFirestoreAdminMessage,
  sendFirestoreChatMessage,
  uploadFirestoreChatImage,
} from "@/lib/firebase-chat";
import { buildInitialsAvatarDataUrl, resolveUserProfileImageUrl } from "@/lib/user-profile-image";
import { useGetProfileQuery } from "@/store/endpoints/auth";
import { useGetChatHistoryQuery, useGetConversationsQuery, useMarkChatAsReadMutation } from "@/store/endpoints/chats";
import { useGetChatRequestNotificationsQuery } from "@/store/endpoints/notifications";
import { useInboxPreviewChats } from "@/hooks/use-inbox-preview-chats";
import { useAppSelector } from "@/store/hooks";
import {
  chatPartnerDisabledMessage,
  chatPartnerRowClassName,
  chatPartnerStatusBadge,
  resolveChatPartnerAccountStatus,
  type ChatPartnerAccountStatus,
} from "@/lib/chat-partner-account";
import { useGetChatPartnerStatusesQuery } from "@/store/endpoints/members";
import type { ChatPartner } from "@/store/endpoints/chats";
import { clsx } from "clsx";
import { formatChatMessageTime, formatChatTime } from "@/lib/format-chat-time";
import {
  ArrowLeft,
  CheckCheck,
  MoreVertical,
  Phone,
  Search,
  User,
  Video
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { toast } from "sonner";

function FirebaseChatSidebarRow(props: {
  partnerId: string;
  lastMessage: string;
  displayTime: string;
  unreadCount: number;
  selected: boolean;
  pendingOutgoing: boolean;
  accountStatus: ChatPartnerAccountStatus;
  onSelect: () => void;
}) {
  const skipProfile = !props.partnerId || props.accountStatus.accountDisabled;
  const { data, isLoading } = useGetProfileQuery(props.partnerId, { skip: skipProfile });
  const u = data?.user;
  const name =
    props.accountStatus.displayName ||
    (u
      ? `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.email
      : isLoading
        ? "…"
        : "User");
  const avatar = resolveUserProfileImageUrl(u, name);
  const statusBadge = chatPartnerStatusBadge(props.accountStatus.statusLabel);

  return (
    <div
      onClick={props.onSelect}
      className={chatPartnerRowClassName(props.selected, props.accountStatus.accountDisabled)}
      aria-disabled={props.accountStatus.accountDisabled}
    >
      <div className="relative shrink-0">
        <div className="w-12 h-12 rounded-full overflow-hidden border border-[#E0E0E0]">
          <ImageWithFallback src={avatar} alt={name} className="w-full h-full object-cover" />
        </div>
        {!props.accountStatus.accountDisabled && (
          <div className="absolute bottom-0 right-0 w-3 h-3 bg-[#4ADE80] border-2 border-white rounded-full" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start mb-1 gap-2">
          <div className="min-w-0 flex items-center gap-2">
            <h3
              className={clsx(
                "font-bold text-[16px] truncate",
                props.accountStatus.accountDisabled ? "text-[#9CA3AF]" : "text-[#111b21]"
              )}
            >
              {name}
            </h3>
            {statusBadge ? (
              <span className="shrink-0 rounded-full bg-[#E5E7EB] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#6B7280]">
                {statusBadge}
              </span>
            ) : null}
          </div>
          <span className="text-[12px] text-[#667781] shrink-0 font-medium">{props.displayTime}</span>
        </div>
        <div className="flex items-center justify-between">
          <p
            className={clsx(
              "text-[14px] truncate pr-2 flex-1",
              props.accountStatus.accountDisabled ? "text-[#9CA3AF]" : "text-[#667781]"
            )}
          >
            {props.unreadCount === 0 && props.pendingOutgoing ? (
              <span className="text-[#0A7EA4] font-medium italic">Pending Request...</span>
            ) : (
              props.lastMessage
            )}
          </p>
          {props.unreadCount > 0 && !props.accountStatus.accountDisabled && (
            <div className="min-w-[20px] h-5 bg-[#00a884] rounded-full flex items-center justify-center px-1.5 shadow-sm">
              <span className="text-white text-[11px] font-bold">{props.unreadCount}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function RestChatSidebarRow(props: {
  chat: ChatPartner;
  selected: boolean;
  accountStatus: ChatPartnerAccountStatus;
  pendingOutgoing: boolean;
  onSelect: () => void;
}) {
  const { chat, accountStatus } = props;
  const statusBadge = chatPartnerStatusBadge(accountStatus.statusLabel);

  return (
    <div
      onClick={props.onSelect}
      className={chatPartnerRowClassName(props.selected, accountStatus.accountDisabled)}
      aria-disabled={accountStatus.accountDisabled}
    >
      <div className="relative shrink-0">
        <div className="w-12 h-12 rounded-full overflow-hidden border border-[#E0E0E0]">
          <ImageWithFallback src={chat.avatar} alt={chat.name} className="w-full h-full object-cover" />
        </div>
        {chat.online && !accountStatus.accountDisabled && (
          <div className="absolute bottom-0 right-0 w-3 h-3 bg-[#4ADE80] border-2 border-white rounded-full" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start mb-1 gap-2">
          <div className="min-w-0 flex items-center gap-2">
            <h3
              className={clsx(
                "font-bold text-[16px] truncate",
                accountStatus.accountDisabled ? "text-[#9CA3AF]" : "text-[#111b21]"
              )}
            >
              {chat.name}
            </h3>
            {statusBadge ? (
              <span className="shrink-0 rounded-full bg-[#E5E7EB] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#6B7280]">
                {statusBadge}
              </span>
            ) : null}
          </div>
          <span className="text-[12px] text-[#667781] shrink-0 font-medium">{chat.time}</span>
        </div>
        <div className="flex items-center justify-between">
          <p
            className={clsx(
              "text-[14px] truncate pr-2 flex-1",
              accountStatus.accountDisabled ? "text-[#9CA3AF]" : "text-[#667781]"
            )}
          >
            {props.pendingOutgoing && chat.unreadCount === 0 ? (
              <span className="text-[#0A7EA4] font-medium italic">Pending Request...</span>
            ) : (
              chat.lastMessage
            )}
          </p>
          {chat.unreadCount > 0 && !accountStatus.accountDisabled && (
            <div className="min-w-[20px] h-5 bg-[#00a884] rounded-full flex items-center justify-center px-1.5 shadow-sm">
              <span className="text-white text-[11px] font-bold">{chat.unreadCount}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function ChatsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { userId: authUserId, user: authUser, token } = useAppSelector((state) => state.auth);
  const currentUserId = authUserId || authUser?._id || undefined;
  const isAdminChatUser = authUser?.role === "admin";

  const [activeTab, setActiveTab] = useState<"messages" | "requests">("messages");
  const [selectedChatId, setSelectedChatId] = useState<string | number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [messageInput, setMessageInput] = useState("");
  const [lastNotifId, setLastNotifId] = useState<string | null>(null);
  const [isFbSending, setIsFbSending] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const [linkedinGuardOpen, setLinkedinGuardOpen] = useState(false);
  const [linkedinGuardReason, setLinkedinGuardReason] = useState<
    "sender_not_verified" | "recipient_not_verified" | null
  >(null);

  const useFirestore = useChatBackendIsFirebase();
  const fbChat = useFirebaseChatModule(currentUserId || undefined, selectedChatId);
  const { recentChats: inboxPreviewChats } = useInboxPreviewChats();

  const inboxFbRooms = useMemo(() => {
    if (!useFirestore || !fbChat.active) return [];
    return fbChat.rooms.filter((r) => !isSelfChatPartner(currentUserId, r.partnerId));
  }, [useFirestore, fbChat.active, fbChat.rooms, currentUserId]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [markAsRead] = useMarkChatAsReadMutation();
  const { data: convData } = useGetConversationsQuery(currentUserId || "", {
    skip: !currentUserId || useFirestore,
    pollingInterval: 15000,
  });

  // Fetch real history for selected chat
  const { data: historyData } = useGetChatHistoryQuery({
    userId1: currentUserId || "",
    userId2: String(selectedChatId)
  }, {
    skip: !currentUserId || !selectedChatId || useFirestore,
    pollingInterval: 15000,
  });

  // Fallback profile fetching for when we click from a profile page
  // (The user might not be in our conversation list yet)
  const isRealMongoId = typeof selectedChatId === "string" && selectedChatId.length > 10;
  const inRestConv = !!convData?.conversations?.find(
    (c) => String(c.id) === String(selectedChatId)
  );
  const { data: profileData } = useGetProfileQuery(selectedChatId as string, {
    skip: !isRealMongoId || inRestConv,
  });

  const guardPartnerMongoId =
    selectedChatId && String(selectedChatId).length > 10 ? String(selectedChatId) : "";
  const { data: partnerLinkedinGuard, isSuccess: partnerLinkedinGuardReady } = useGetProfileQuery(
    guardPartnerMongoId,
    { skip: !guardPartnerMongoId || isAdminChatUser },
  );

  useEffect(() => {
    if (isAdminChatUser) return;
    if (!authUser?.isLinkedinVerified || !guardPartnerMongoId) return;
    if (!partnerLinkedinGuardReady) return;
    const pu = partnerLinkedinGuard?.user;
    if (!pu || String(pu._id) !== guardPartnerMongoId) return;
    if (isSelfChatPartner(currentUserId, guardPartnerMongoId)) return;
    const recipientIsAdmin = pu.role === "admin";
    if (!pu.isLinkedinVerified && !recipientIsAdmin) {
      setLinkedinGuardReason("recipient_not_verified");
      setLinkedinGuardOpen(true);
      setSelectedChatId(null);
      router.replace("/chats");
    }
  }, [
    isAdminChatUser,
    authUser?.isLinkedinVerified,
    guardPartnerMongoId,
    partnerLinkedinGuardReady,
    partnerLinkedinGuard,
    router,
  ]);

  // Combined data to handle chats not in the mock list
  const selectedChat = useMemo(() => {
    if (!selectedChatId) return null;
    if (isSelfChatPartner(currentUserId, String(selectedChatId))) return null;

    if (useFirestore && fbChat.active) {
      const row = inboxFbRooms.find((r) => r.partnerId === String(selectedChatId));
      if (row) {
        if (profileData?.user) {
          const u = profileData.user;
          return {
            id: u._id,
            name: `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.email,
            avatar: resolveUserProfileImageUrl(u, u.firstName || "U"),
            online: true,
            lastMessage: row.lastMessage,
            time: row.timestampMs ? formatChatMessageTime(new Date(row.timestampMs)) : "Now",
            unreadCount: row.unreadCount,
            tab: "messages",
          };
        }
        return {
          id: row.partnerId,
          name: "User",
          avatar: buildInitialsAvatarDataUrl("User"),
          online: true,
          lastMessage: row.lastMessage,
          time: row.timestampMs ? formatChatMessageTime(new Date(row.timestampMs)) : "Now",
          unreadCount: row.unreadCount,
          tab: "messages",
        };
      }
    }

    // 1. Check if it's already in our active conversations list
    const existing = convData?.conversations?.find((c) => String(c.id) === String(selectedChatId));
    if (existing) return existing;

    // 2. If it's a real user from profileData, use that
    if (profileData?.user) {
        const u = profileData.user;
        return {
            id: u._id,
            name: `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.email,
            avatar: resolveUserProfileImageUrl(u, u.firstName || "U"),
            online: true,
            lastMessage: "",
            time: "Now",
            unreadCount: 0,
            tab: "messages"
        };
    }

    // 3. Fallback placeholder
    return {
      id: selectedChatId,
      name: `User`,
      avatar: buildInitialsAvatarDataUrl("User"),
      online: true,
      lastMessage: "",
      time: "Now",
      unreadCount: 0,
      tab: "messages"
    };
  }, [selectedChatId, convData, profileData, useFirestore, fbChat.active, inboxFbRooms]);

  const { data: notificationsData } = useGetChatRequestNotificationsQuery(currentUserId || "", {
    skip: !currentUserId,
    pollingInterval: 15000,
  });

  // Request gate: Firestore matches Android chat doc; otherwise Mongo notifications + history
  const { isSenderPending, isRecipientPending } = useMemo(() => {
    if (useFirestore && fbChat.active) {
      return {
        isSenderPending: fbChat.isSenderPending,
        isRecipientPending: fbChat.isRecipientPending,
      };
    }
    if (!selectedChatId || !currentUserId || !notificationsData?.notifs) {
        return { isSenderPending: false, isRecipientPending: false };
    }

    // Is there an unread request FROM me TO them?
    const sentRequest = notificationsData.notifs.find(n => 
        String(n.senderId) === String(currentUserId) && 
        String(n.receiverId) === String(selectedChatId) && 
        n.type === "chat_request" && 
        !n.isRead
    );

    // Is there an unread request FROM them TO me?
    const receivedRequest = notificationsData.notifs.find(n => 
        String(n.senderId) === String(selectedChatId) && 
        String(n.receiverId) === String(currentUserId) && 
        n.type === "chat_request" && 
        !n.isRead
    );

    // Logic refinement: Has the message recipient ever replied?
    const hasMeReplied = historyData?.history?.some(m => String(m.senderId) === String(currentUserId));
    const hasPartnerReplied = historyData?.history?.some(m => String(m.senderId) === String(selectedChatId));

    return {
        isSenderPending: sentRequest && !hasPartnerReplied, // Block A until B replies
        isRecipientPending: receivedRequest && !hasMeReplied // Show banner to B until B replies
    };
  }, [useFirestore, fbChat.active, fbChat.isSenderPending, fbChat.isRecipientPending, selectedChatId, currentUserId, notificationsData, historyData]);

  // Sound and Mark-as-read logic (Mongo bell only — not used for Firestore chat)
  useEffect(() => {
    if (useFirestore && fbChat.active) return;
    const unread = notificationsData?.notifs?.filter(n => n.type === "chat_request" && !n.isRead);
    if (!unread || unread.length === 0) return;

    const newest = unread[0];
    if (newest._id !== lastNotifId) {
      const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3");
      audio.play().catch(() => undefined);
      setLastNotifId(newest._id);
      
      if (selectedChatId && newest.senderId === String(selectedChatId) && !isRecipientPending) {
          markAsRead({ userId: currentUserId || "", partnerId: String(selectedChatId) });
      }
    }
  }, [useFirestore, fbChat.active, notificationsData, selectedChatId, currentUserId, lastNotifId, markAsRead, isRecipientPending]);

  useEffect(() => {
    if (useFirestore && fbChat.active) return;
    if (selectedChatId && currentUserId && !isRecipientPending) {
        markAsRead({ userId: currentUserId, partnerId: String(selectedChatId) });
    }
  }, [useFirestore, fbChat.active, selectedChatId, currentUserId, markAsRead, isRecipientPending]);

  // Unified list of all conversation partners (shared unread counts with messaging overlay)
  const allConversations = useMemo(() => {
    if (!convData?.conversations) return [];

    return convData.conversations
      .filter((c) => !isSelfChatPartner(currentUserId, String(c.id)))
      .map((c) => {
        let displayTime = "";
        if (c.time) {
            displayTime = formatChatTime(new Date(c.time));
        }

        const preview = inboxPreviewChats.find((p) => String(p.id) === String(c.id));

        return {
            ...c,
            lastMessage: preview?.lastMsg ?? c.lastMessage,
            unreadCount: preview?.unreadCount ?? c.unreadCount,
            time: displayTime,
            tab: "messages"
        };
    });
  }, [convData, currentUserId, inboxPreviewChats]);

  // Requests include:
  // 1. Incoming unread messages/requests (unreadCount > 0)
  // 2. Outgoing pending requests (we sent but they haven't accepted/replied)
  const realRequests = useMemo(() => {
    return allConversations.filter(c => {
        const isUnread = c.unreadCount > 0;
        
        // Find if I have a pending OUTGOING request to this person
        const sentRequest = notificationsData?.notifs?.find(n => 
            String(n.senderId) === String(currentUserId) && 
            String(n.receiverId) === String(c.id) && 
            n.type === "chat_request" && 
            !n.isRead
        );
        
        // Only consider it a 'Pending Request' if I haven't replied to them yet (or vice versa)
        const hasMeReplied = historyData?.history?.some(m => String(m.senderId) === String(currentUserId) && String(m.receiverId) === String(c.id));
        const hasPartnerReplied = historyData?.history?.some(m => String(m.senderId) === String(c.id) && String(m.receiverId) === String(currentUserId));
        
        const isIncomingPending = isUnread && !hasMeReplied;
        const isOutgoingPending = !!sentRequest && !hasPartnerReplied;

        return isIncomingPending || isOutgoingPending;
    });
  }, [allConversations, notificationsData, currentUserId, historyData]);

  const realConversations = useMemo(() => {
      // Mutually Exclusive: Messages tab should NOT include Requests
      const requestIds = new Set(realRequests.map(r => String(r.id)));
      return allConversations.filter(c => !requestIds.has(String(c.id)));
  }, [allConversations, realRequests]);

  const firestoreRequestRows = useMemo(() => {
    if (!useFirestore || !fbChat.active) return [];
    return inboxFbRooms.filter((r) => r.isRequested === "pending" || r.isRequested === "declined");
  }, [useFirestore, fbChat.active, inboxFbRooms]);

  const firestoreAcceptedRows = useMemo(() => {
    if (!useFirestore || !fbChat.active) return [];
    return inboxFbRooms.filter((r) => r.isRequested === "accepted");
  }, [useFirestore, fbChat.active, inboxFbRooms]);

  const filteredFirestoreRows = useMemo(() => {
    if (!useFirestore || !fbChat.active) return [];
    const basis = activeTab === "requests" ? firestoreRequestRows : firestoreAcceptedRows;
    const q = searchQuery.toLowerCase();
    return basis.filter(
      (r) => r.lastMessage.toLowerCase().includes(q) || r.partnerId.toLowerCase().includes(q)
    );
  }, [useFirestore, fbChat.active, activeTab, firestoreRequestRows, firestoreAcceptedRows, searchQuery]);

  const filteredChats = useMemo(() => {
    // If we're on requests tab, show only the real requests
    if (activeTab === "requests") {
      return realRequests.filter(chat => 
        chat.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    return realConversations.filter(chat => 
      chat.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [activeTab, searchQuery, realConversations, realRequests]);

  const sidebarPartnerIds = useMemo(() => {
    const ids = new Set<string>();
    if (useFirestore && fbChat.active) {
      filteredFirestoreRows.forEach((r) => ids.add(r.partnerId));
    } else {
      filteredChats.forEach((c) => ids.add(String(c.id)));
    }
    return [...ids];
  }, [useFirestore, fbChat.active, filteredFirestoreRows, filteredChats]);

  const { data: partnerStatusData } = useGetChatPartnerStatusesQuery(sidebarPartnerIds, {
    skip: sidebarPartnerIds.length === 0,
  });

  const resolvePartnerStatus = useCallback(
    (partnerId: string, chat?: ChatPartner): ChatPartnerAccountStatus => {
      if (chat) {
        return resolveChatPartnerAccountStatus({
          isSuspended: chat.isSuspended,
          isDeleted: chat.isDeleted,
          accountDisabled: chat.accountDisabled,
          statusLabel: chat.accountStatus,
          displayName: chat.name,
        });
      }
      return resolveChatPartnerAccountStatus(partnerStatusData?.statuses?.[partnerId]);
    },
    [partnerStatusData]
  );

  const openPartnerChat = useCallback(
    (partnerId: string, chat?: ChatPartner) => {
      const status = resolvePartnerStatus(partnerId, chat);
      if (status.accountDisabled) {
        toast.error(chatPartnerDisabledMessage(status.statusLabel));
        return;
      }
      setSelectedChatId(partnerId);
    },
    [resolvePartnerStatus]
  );

  useEffect(() => {
    const userId = searchParams?.get("userId");
    if (!userId || !currentUserId) return;
    const id = userId.length > 10 ? userId : String(parseInt(userId, 10));
    if (isSelfChatPartner(currentUserId, id)) {
      toast.error("You cannot chat with yourself");
      setSelectedChatId(null);
      router.replace("/chats");
      return;
    }
    openPartnerChat(id);
  }, [searchParams, currentUserId, router, openPartnerChat]);

  useEffect(() => {
    if (!selectedChatId) return;
    const chat = filteredChats.find((c) => String(c.id) === String(selectedChatId));
    const status = resolvePartnerStatus(String(selectedChatId), chat);
    if (status.accountDisabled) setSelectedChatId(null);
  }, [selectedChatId, filteredChats, resolvePartnerStatus]);

  const requestCount = useFirestore && fbChat.active ? firestoreRequestRows.length : realRequests.length;

  // Real history from backend or Firestore stream
  const currentMessages = useMemo(() => {
    if (useFirestore && fbChat.active && selectedChatId) {
      return fbChat.messages.map((m) => ({
        id: m.id,
        text: m.text,
        sender: m.sender,
        time: m.timeLabel,
        messageType: m.messageType,
        imageUrl: m.imageUrl,
      }));
    }
    if (!historyData?.history) return [];

    return historyData.history.map((m) => ({
      id: m._id,
      text: m.message,
      sender: String(m.senderId) === String(currentUserId) ? "me" : "them",
      time: formatChatMessageTime(new Date(m.timestamp)),
      messageType: "text" as const,
      imageUrl: null as string | null,
    }));
  }, [useFirestore, fbChat.active, fbChat.messages, selectedChatId, historyData, currentUserId]);

  const validateChatSend = (): boolean => {
    if (!selectedChatId || !currentUserId) return false;

    if (isSelfChatPartner(currentUserId, String(selectedChatId))) {
      toast.error("You cannot chat with yourself");
      return false;
    }

    const partnerUser = partnerLinkedinGuard?.user;
    const recipientIsAdmin = partnerUser?.role === "admin";
    const blockReason = getLinkedinChatBlockReason(
      authUser?.isLinkedinVerified,
      partnerUser?.isLinkedinVerified,
      isAdminChatUser,
      recipientIsAdmin
    );
    if (blockReason) {
      if (blockReason === "recipient_not_verified") {
        if (!partnerLinkedinGuardReady || !partnerLinkedinGuard?.user) {
          toast.error("Please wait a moment.");
          return false;
        }
        if (String(partnerLinkedinGuard.user._id) !== String(selectedChatId)) {
          toast.error("Please wait a moment.");
          return false;
        }
      }
      setLinkedinGuardReason(blockReason);
      setLinkedinGuardOpen(true);
      return false;
    }

    return true;
  };

  const sendChatPayload = async (payload: {
    message: string;
    messageType: "text" | "image";
    imageUrl?: string | null;
  }): Promise<boolean> => {
    if (!selectedChatId || !currentUserId) return false;
    if (!isFirebaseConfigured()) {
      toast.error("Firebase chat is not configured");
      return false;
    }
    const db = getFirestoreDb();
    if (!db) {
      toast.error("Firebase is not ready");
      return false;
    }
    try {
      if (fbChat.active && fbChat.isRecipientPending && fbChat.activeChatRoomId) {
        await fbChat.acceptFirestoreInvite(fbChat.activeChatRoomId);
      }
      if (isAdminSupportChatPartner(String(selectedChatId))) {
        await sendFirestoreAdminMessage(db, {
          currentUserId,
          adminReceiverId: String(selectedChatId),
          message: payload.message,
          messageType: payload.messageType,
          imageUrl: payload.imageUrl,
          authToken: token ?? undefined,
        });
      } else {
        await sendFirestoreChatMessage(db, {
          currentUserId,
          receiverId: String(selectedChatId),
          message: payload.message,
          messageType: payload.messageType,
          imageUrl: payload.imageUrl,
          authToken: token ?? undefined,
        });
      }
      return true;
    } catch (err) {
      console.error("Failed to send Firestore message:", err);
      const message =
        err instanceof Error && err.message ? err.message : null;
      toast.error(
        message ||
          (payload.messageType === "image" ? "Failed to send image" : "Failed to send message")
      );
      return false;
    }
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !validateChatSend()) return;

    const messageText = messageInput.trim();
    setMessageInput("");
    setIsFbSending(true);
    const ok = await sendChatPayload({ message: messageText, messageType: "text" });
    if (!ok) setMessageInput(messageText);
    setIsFbSending(false);
  };

  const handleAttachImage = async (file: File, caption: string): Promise<boolean> => {
    if (!validateChatSend()) return false;
    if (!currentUserId || !selectedChatId) return false;

    const storage = getFirebaseStorage();
    const chatRoomId = buildChatRoomId(currentUserId, String(selectedChatId));
    if (!storage) {
      toast.error("Firebase is not ready");
      return false;
    }

    setIsUploadingImage(true);
    try {
      const buf = new Uint8Array(await file.arrayBuffer());
      const imageUrl = await uploadFirestoreChatImage(storage, {
        userId: currentUserId,
        chatRoomId,
        data: buf,
        contentType: file.type || "image/jpeg",
      });
      return await sendChatPayload({
        message: caption,
        messageType: "image",
        imageUrl,
      });
    } catch (err) {
      console.error(err);
      toast.error("Failed to send image");
      return false;
    } finally {
      setIsUploadingImage(false);
    }
  };

  useEffect(() => {
    if (fbChat.listError) toast.error(fbChat.listError);
  }, [fbChat.listError]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentMessages, selectedChatId]);

  if (authUser && !authUser.isLinkedinVerified && !isAdminChatUser) {
    return (
      <div className="bg-white rounded-[14px] shadow-[0_2px_8px_rgba(0,0,0,0.06)] p-8 max-w-lg mx-auto border border-[#F3F4F6]">
        <h1 className="text-[20px] font-bold text-[#1A1A2E] mb-2">Chats</h1>
        <p className="text-[#64748b] text-[14px] mb-6">
          Messaging is only available between LinkedIn-verified members. Complete LinkedIn verification on your profile
          to use chat.
        </p>
        <button
          type="button"
          onClick={() => router.push("/profile")}
          className="px-6 py-2.5 bg-[#0A7EA4] text-white rounded-xl text-sm font-bold hover:bg-[#086a8a] transition-colors"
        >
          Go to profile
        </button>
      </div>
    );
  }

  return (
    <>
    <div className="bg-white rounded-[14px] shadow-[0_2px_8px_rgba(0,0,0,0.06)] h-[calc(100vh-180px)] min-h-[500px] flex overflow-hidden border border-[#F3F4F6]">
      {/* Sidebar - Chat List */}
      <div className={clsx(
        "w-full md:w-[360px] flex flex-col border-r border-[#F3F4F6] transition-all",
        selectedChatId !== null && "hidden md:flex"
      )}>
        {/* Header with Tabs */}
        <div className="p-4 border-b border-[#F3F4F6] bg-white">
          <h1 className="text-[20px] font-bold text-[#1A1A2E] mb-4">Chats</h1>
          
          <div className="flex gap-4 border-b border-[#F3F4F6]">
            <button 
              onClick={() => setActiveTab("messages")}
              className={clsx(
                "pb-3 text-[14px] font-semibold relative transition-colors",
                activeTab === "messages" ? "text-[#0A7EA4]" : "text-[#9E9E9E] hover:text-[#1A1A2E]"
              )}
            >
              All Messages
              {activeTab === "messages" && (
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#0A7EA4]" />
              )}
            </button>
            <button 
              onClick={() => setActiveTab("requests")}
              className={clsx(
                "pb-3 text-[14px] font-semibold relative transition-colors flex items-center gap-1.5",
                activeTab === "requests" ? "text-[#0A7EA4]" : "text-[#9E9E9E] hover:text-[#1A1A2E]"
              )}
            >
              All Request
              {requestCount > 0 && (
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              )}
              {activeTab === "requests" && (
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#0A7EA4]" />
              )}
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="p-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9E9E9E]" />
            <input 
              type="text"
              placeholder="Search chat"
              value={searchQuery}
              onChange={(e) => sanitizeTextOnChange(e.target.value, setSearchQuery)}
              className="w-full h-10 bg-[#F5F7FB] border-none rounded-xl pl-10 pr-4 text-[14px] focus:ring-2 focus:ring-[#0A7EA4]/20 outline-none transition-all"
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto no-scrollbar">
          {useFirestore && fbChat.active ? (
            <>
              {!fbChat.listLoaded && (
                <div className="p-8 text-center text-[#9E9E9E] text-[14px]">Loading chats…</div>
              )}
              {filteredFirestoreRows.map((r) => {
                const displayTime = r.timestampMs
                  ? formatChatTime(new Date(r.timestampMs))
                  : "";
                const pendingOutgoing =
                  r.isRequested === "pending" && r.senderId === String(currentUserId);
                return (
                  <FirebaseChatSidebarRow
                    key={r.chatRoomId}
                    partnerId={r.partnerId}
                    lastMessage={r.lastMessage}
                    displayTime={displayTime}
                    unreadCount={r.unreadCount}
                    selected={String(selectedChatId) === r.partnerId}
                    pendingOutgoing={pendingOutgoing}
                    accountStatus={resolvePartnerStatus(r.partnerId)}
                    onSelect={() => openPartnerChat(r.partnerId)}
                  />
                );
              })}
            </>
          ) : (
            filteredChats.map((chat) => {
              const pendingOutgoing =
                chat.unreadCount === 0 &&
                Boolean(
                  notificationsData?.notifs?.some(
                    (n) =>
                      String(n.senderId) === String(currentUserId) &&
                      String(n.receiverId) === String(chat.id) &&
                      n.type === "chat_request" &&
                      !n.isRead
                  )
                );

              return (
                <RestChatSidebarRow
                  key={chat.id}
                  chat={chat}
                  selected={selectedChatId === chat.id}
                  accountStatus={resolvePartnerStatus(String(chat.id), chat)}
                  pendingOutgoing={pendingOutgoing}
                  onSelect={() => openPartnerChat(String(chat.id), chat)}
                />
              );
            })
          )}

          {((useFirestore && fbChat.active && fbChat.listLoaded && filteredFirestoreRows.length === 0) ||
            (!useFirestore && filteredChats.length === 0)) && (
            <div className="p-8 text-center text-[#9E9E9E] text-[14px]">
              No {activeTab} found
            </div>
          )}
        </div>
      </div>

      {/* Chat Panel - WhatsApp Style */}
      <div className={clsx(
        "flex-1 flex flex-col bg-[#F5F7FB] relative overflow-hidden",
        selectedChatId === null && "hidden md:flex"
      )}>
        {selectedChat ? (
          <>
            {/* Chat Header */}
            <div className="h-[72px] bg-white border-b border-[#F3F4F6] flex items-center justify-between px-4 z-10 shrink-0">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setSelectedChatId(null)}
                  className="md:hidden p-1 mr-1 text-[#757575]"
                >
                  <ArrowLeft className="w-6 h-6" />
                </button>
                <div 
                  className="relative cursor-pointer"
                  onClick={() => router.push(`/profile/${selectedChat.id}`)}
                >
                  <div className="w-10 h-10 rounded-full overflow-hidden border border-[#E0E0E0]">
                    <ImageWithFallback src={selectedChat.avatar} alt={selectedChat.name} className="w-full h-full object-cover" />
                  </div>
                  {selectedChat.online && (
                    <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[#4ADE80] border-2 border-white rounded-full" />
                  )}
                </div>
                <div 
                  className="flex flex-col cursor-pointer group/name"
                  onClick={() => router.push(`/profile/${selectedChat.id}`)}
                >
                  <span className="font-bold text-[15px] text-[#1A1A2E] group-hover/name:text-[#0A7EA4] transition-colors">{selectedChat.name}</span>
                  <span className="text-[12px] text-[#4ADE80] font-medium">
                    {selectedChat.online ? "Online" : "Away"}
                  </span>
                </div>
              </div>
              {/* <div className="flex items-center gap-2">
                <button className="p-2 text-[#757575] hover:bg-[#F5F7FB] rounded-full transition-colors">
                  <Phone className="w-5 h-5" />
                </button>
                <button className="p-2 text-[#757575] hover:bg-[#F5F7FB] rounded-full transition-colors">
                  <Video className="w-5 h-5" />
                </button>
                <button className="p-2 text-[#757575] hover:bg-[#F5F7FB] rounded-full transition-colors">
                  <MoreVertical className="w-5 h-5" />
                </button>
              </div> */}
            </div>

            {/* Acceptance Banner for Recipient */}
            {isRecipientPending && (
              <div className="bg-[#E0F2FE] border-b border-[#BAE6FD] p-4 animate-in fade-in slide-in-from-top duration-500">
                <div className="max-w-2xl mx-auto">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3 text-[#0369A1]">
                            <User className="w-5 h-5" />
                            <span className="text-sm font-semibold">{selectedChat?.name} wants to chat with you.</span>
                        </div>
                        <button 
                            onClick={async () => {
                              if (useFirestore && fbChat.active && fbChat.activeChatRoomId) {
                                try {
                                  await fbChat.acceptFirestoreInvite(fbChat.activeChatRoomId);
                                } catch (e) {
                                  console.error(e);
                                }
                                return;
                              }
                              void markAsRead({ userId: currentUserId!, partnerId: String(selectedChatId) });
                            }}
                            className="text-[#0A7EA4] text-xs font-bold hover:underline"
                        >
                            Just Accept
                        </button>
                    </div>
                    
                    {/* Quick Reply to Accept */}
                    <div className="flex items-center gap-2 bg-white p-1.5 rounded-xl border border-[#BAE6FD] shadow-sm">
                        <input 
                            type="text"
                            placeholder="Reply to accept..."
                            value={messageInput}
                            onChange={(e) => sanitizeTextOnChange(e.target.value, setMessageInput)}
                            onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                            className="flex-1 bg-transparent border-none focus:outline-none text-sm px-3"
                        />
                        <button 
                            onClick={handleSendMessage}
                            disabled={isFbSending || !messageInput.trim()}
                            className="px-4 py-1.5 bg-[#0A7EA4] text-white text-xs font-bold rounded-lg hover:bg-[#086a8a] disabled:opacity-50 transition-all"
                        >
                            Accept & Reply
                        </button>
                    </div>
                </div>
              </div>
            )}

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar bg-[#E5DDD5] relative" style={{ 
              backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")',
              backgroundRepeat: 'repeat',
              backgroundSize: '400px',
              backgroundColor: '#efe7dd'
            }}>
              <div className="absolute inset-0 bg-white/40 pointer-events-none" />
              
              {/* Date Separator */}
              <div className="relative flex justify-center my-6 z-10">
                <span className="px-3 py-1 bg-white/90 text-[#54656f] text-[12px] font-medium rounded-lg shadow-sm uppercase">Today</span>
              </div>

              <div className="relative z-10 space-y-3">
                {currentMessages.map((msg) => (
                  <div 
                    key={msg.id}
                    className={clsx(
                      "flex",
                      msg.sender === "me" ? "justify-end" : "justify-start"
                    )}
                  >
                    <div className={clsx(
                      "max-w-[85%] md:max-w-[70%] px-3 py-2 rounded-lg shadow-[0_1px_0.5px_rgba(0,0,0,0.13)] relative",
                      msg.sender === "me" 
                        ? "bg-[#D9FDD3] text-[#111b21] rounded-tr-none" 
                        : "bg-white text-[#111b21] rounded-tl-none"
                    )}>
                      {msg.messageType === "image" && msg.imageUrl ? (
                        <a
                          href={msg.imageUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block mb-2"
                        >
                          <ImageWithFallback
                            src={msg.imageUrl}
                            alt=""
                            className="max-w-full rounded-lg max-h-[240px] object-cover"
                          />
                        </a>
                      ) : null}
                      {msg.text ? (
                        <p className="text-[14px] leading-tight pb-2 whitespace-pre-wrap">{msg.text}</p>
                      ) : null}
                      <div className="flex items-center justify-end gap-1 -mt-1">
                        <span className="text-[11px] text-[#667781]">{msg.time}</span>
                        {msg.sender === "me" && (
                          <CheckCheck className="w-3.5 h-3.5 text-[#53bdeb]" />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Chat Input */}
            <div className="p-4 bg-white border-t border-[#F3F4F6] shrink-0">
              {isSenderPending ? (
                  <div className="p-4 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl text-center">
                    <p className="text-sm font-medium text-[#6B7280]">
                        Chat request pending. You can send more messages once {selectedChat?.name} accepts your request.
                    </p>
                  </div>
              ) : (
                <ChatComposer
                  value={messageInput}
                  onChange={setMessageInput}
                  onSend={handleSendMessage}
                  onAttachImage={handleAttachImage}
                  beforeAttach={validateChatSend}
                  isSending={isFbSending}
                  isUploading={isUploadingImage}
                  disabled={isSenderPending}
                />
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-[#F8F9FA]">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-sm mb-6">
              <User className="w-10 h-10 text-[#0A7EA4]" />
            </div>
            <h2 className="text-[20px] font-bold text-[#1A1A2E] mb-2">Select a chat to start messaging</h2>
            <p className="text-[#757575] max-w-xs mx-auto text-[14px]">
              Stay connected with your affiliate network and discuss new opportunities in real-time.
            </p>
          </div>
        )}
      </div>
    </div>
    <LinkedinChatGuardDialog
      open={linkedinGuardOpen}
      onOpenChange={setLinkedinGuardOpen}
      reason={linkedinGuardReason}
    />
    </>
  );
}


