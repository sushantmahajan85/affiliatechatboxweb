import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useRouter } from "next/navigation";
import { clsx } from "clsx";
import { 
  X, CheckCheck, Search,
  ChevronDown, ChevronUp, Info, Maximize2
} from "lucide-react";
import { ChatComposer } from "@/components/chat-composer";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { closeChat, openChat, toggleMessagingBar, updateActiveChatProfile } from "@/store/chatSlice";
import { 
  useGetChatHistoryQuery, 
  useMarkChatAsReadMutation 
} from "@/store/endpoints/chats";
import { useGetProfileQuery } from "@/store/endpoints/auth";
import { useChatBackendIsFirebase } from "@/context/FirebaseChatRoomsProvider";
import { useInboxPreviewChats } from "@/hooks/use-inbox-preview-chats";
import { useFirebaseChatModule } from "@/hooks/useFirebaseChatModule";
import { getFirebaseStorage, getFirestoreDb, isFirebaseConfigured } from "@/lib/firebase-app";
import {
  buildChatRoomId,
  sendFirestoreChatMessage,
  sendFirestoreAdminMessage,
  isAdminSupportChatPartner,
  uploadFirestoreChatImage,
} from "@/lib/firebase-chat";
import {
  getLinkedinChatBlockReason,
  isSelfChatPartner,
  senderCanUseLinkedinChat,
} from "@/lib/linkedin-messaging";
import { resolveUserProfileImageUrl } from "@/lib/user-profile-image";
import {
  chatPartnerDisabledMessage,
  chatPartnerStatusBadge,
  resolveChatPartnerAccountStatus,
  type ChatPartnerAccountStatus,
} from "@/lib/chat-partner-account";
import { useGetChatPartnerStatusesQuery } from "@/store/endpoints/members";
import type { InboxPreviewChat } from "@/hooks/use-inbox-preview-chats";
import { useGetChatRequestNotificationsQuery } from "@/store/endpoints/notifications";
import { format, isToday } from "date-fns";
import { toast } from "sonner";
import { LinkedinChatGuardDialog } from "@/components/linkedin-chat-guard-dialog";
import { openAuthModal } from "@/store/uiSlice";

// --- Sub-component for individual Chat Windows ---
type OverlayChatPeer = {
  id: string;
  name: string;
  avatar: string;
  status?: string;
  isRequest?: boolean;
};

function formatChatListTime(time: string | null | undefined): string {
  if (!time) return "";
  const date = new Date(time);
  if (Number.isNaN(date.getTime())) return "";
  return isToday(date) ? format(date, "p") : format(date, "MMM d");
}

function OverlayChatListItem({
  chat,
  isActive,
  accountStatus,
  onOpen,
}: {
  chat: OverlayChatPeer & { lastMsg: string; unreadCount: number; time?: string | null };
  isActive: boolean;
  accountStatus: ChatPartnerAccountStatus;
  onOpen: (
    resolvedName: string,
    resolvedAvatar: string,
    partnerLinkedinVerified: boolean,
    partnerIsAdmin: boolean
  ) => void;
}) {
  const skipProfile = !chat.id || accountStatus.accountDisabled;
  const { data: profileData, isLoading } = useGetProfileQuery(chat.id, { skip: skipProfile });
  const user = profileData?.user;
  const resolvedName =
    accountStatus.displayName ||
    (user
      ? `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email
      : chat.name);
  const resolvedAvatar = resolveUserProfileImageUrl(user, resolvedName);
  const statusBadge = chatPartnerStatusBadge(accountStatus.statusLabel);

  return (
    <div
      onClick={() => {
        if (accountStatus.accountDisabled) {
          toast.error(chatPartnerDisabledMessage(accountStatus.statusLabel));
          return;
        }
        if (isLoading) return;
        onOpen(resolvedName, resolvedAvatar, Boolean(user?.isLinkedinVerified), user?.role === "admin");
      }}
      className={clsx(
        "flex items-start gap-3 p-3 transition-colors border-l-[3px]",
        accountStatus.accountDisabled
          ? "cursor-not-allowed bg-[#F3F4F6] opacity-60 grayscale border-transparent"
          : "cursor-pointer hover:bg-[#F3F6F8]",
        !accountStatus.accountDisabled &&
          (isActive ? "border-[#0A66C2] bg-[#F3F6F8]" : "border-transparent hover:border-[#0A66C2]")
      )}
      aria-disabled={accountStatus.accountDisabled}
    >
      <div className="relative shrink-0 mt-0.5">
        <div className="w-12 h-12 rounded-full overflow-hidden">
          <ImageWithFallback src={resolvedAvatar} alt={resolvedName} className="w-full h-full object-cover" />
        </div>
        {chat.status === "online" && !accountStatus.accountDisabled && (
          <div className="absolute bottom-0 right-0.5 w-3.5 h-3.5 bg-[#057642] border-2 border-white rounded-full"></div>
        )}
        {chat.unreadCount > 0 && !accountStatus.accountDisabled && (
          <div className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-white">
            {chat.unreadCount}
          </div>
        )}
      </div>
      <div className="flex flex-col min-w-0 flex-1 border-b border-[#F1F5F9] pb-3 last:border-0">
        <div className="flex items-center justify-between mb-0.5 gap-2">
          <div className="min-w-0 flex items-center gap-1.5">
            <span
              className={clsx(
                "text-[14px] font-bold truncate",
                accountStatus.accountDisabled ? "text-[#9CA3AF]" : "text-[#1A1A2E]"
              )}
            >
              {resolvedName}
            </span>
            {statusBadge ? (
              <span className="shrink-0 rounded-full bg-[#E5E7EB] px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-[#6B7280]">
                {statusBadge}
              </span>
            ) : null}
          </div>
          <span className="text-[12px] text-[#666666] shrink-0">{formatChatListTime(chat.time) || "Today"}</span>
        </div>
        <span
          className={clsx(
            "text-[12px] line-clamp-2 leading-snug",
            accountStatus.accountDisabled ? "text-[#9CA3AF]" : "text-[#666666]"
          )}
        >
          {chat.lastMsg}
        </span>
      </div>
    </div>
  );
}

function ChatWindow({
  chat,
  accountStatus,
  onClose,
}: {
  chat: OverlayChatPeer;
  accountStatus: ChatPartnerAccountStatus;
  onClose: () => void;
}) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { userId: authUserId, user: currentUser, token } = useAppSelector((state) => state.auth);
  const currentUserId = authUserId || currentUser?._id || undefined;
  const isAdminChatUser = currentUser?.role === "admin";
  const [messageInput, setMessageInput] = useState("");
  const [isAcceptedManually, setIsAcceptedManually] = useState(false);
  const [isFbSending, setIsFbSending] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [linkedinGuardOpen, setLinkedinGuardOpen] = useState(false);
  const [linkedinGuardReason, setLinkedinGuardReason] = useState<
    "sender_not_verified" | "recipient_not_verified" | null
  >(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: partnerProfile, isSuccess: partnerProfileReady } = useGetProfileQuery(chat.id, {
    skip: !chat.id || accountStatus.accountDisabled,
  });

  const partnerUser = partnerProfile?.user;
  const displayName = useMemo(() => {
    if (accountStatus.displayName) return accountStatus.displayName;
    if (partnerUser) {
      const full = `${partnerUser.firstName || ""} ${partnerUser.lastName || ""}`.trim();
      return full || partnerUser.email || chat.name;
    }
    if (chat.name && chat.name !== "User") return chat.name;
    return partnerProfileReady ? chat.name : "…";
  }, [accountStatus.displayName, partnerUser, partnerProfileReady, chat.name]);

  const displayAvatar = useMemo(
    () => resolveUserProfileImageUrl(partnerUser, displayName) || chat.avatar,
    [partnerUser, displayName, chat.avatar]
  );

  useEffect(() => {
    if (!partnerUser || !chat.id) return;
    const full = `${partnerUser.firstName || ""} ${partnerUser.lastName || ""}`.trim();
    const name = full || partnerUser.email;
    if (!name || name === "User") return;
    dispatch(
      updateActiveChatProfile({
        id: chat.id,
        name,
        avatar: resolveUserProfileImageUrl(partnerUser, name),
      })
    );
  }, [partnerUser, chat.id, dispatch]);

  const useFb = useChatBackendIsFirebase();
  const fbChat = useFirebaseChatModule(currentUserId || undefined, chat.id);

  const { data: notificationsData } = useGetChatRequestNotificationsQuery(currentUserId || "", {
    skip: !currentUserId || useFb,
    pollingInterval: 15000,
  });

  const { data: historyData } = useGetChatHistoryQuery(
    { userId1: currentUserId || "", userId2: chat.id },
    { skip: !currentUserId || !chat.id || useFb, pollingInterval: 15000 }
  );

  const [markAsRead] = useMarkChatAsReadMutation();

  const { isSenderPending, isRecipientPending } = useMemo(() => {
    if (useFb && fbChat.active) {
      return {
        isSenderPending: fbChat.isSenderPending,
        isRecipientPending: fbChat.isRecipientPending,
      };
    }
    if (!chat.id || !currentUserId || !notificationsData?.notifs) {
        return { isSenderPending: false, isRecipientPending: false };
    }

    const sentRequest = notificationsData.notifs.find(n => 
        String(n.senderId) === String(currentUserId) && 
        String(n.receiverId) === String(chat.id) && 
        n.type === "chat_request" && !n.isRead
    );

    const receivedRequest = notificationsData.notifs.find(n => 
        String(n.senderId) === String(chat.id) && 
        String(n.receiverId) === String(currentUserId) && 
        n.type === "chat_request" && !n.isRead
    );

    const hasMeReplied = historyData?.history?.some(m => String(m.senderId) === String(currentUserId));
    const hasPartnerReplied = historyData?.history?.some(m => String(m.senderId) === String(chat.id));

    return {
        isSenderPending: !!sentRequest && !hasPartnerReplied,
        isRecipientPending: !!receivedRequest && !hasMeReplied && !isAcceptedManually
    };
  }, [useFb, fbChat.active, fbChat.isSenderPending, fbChat.isRecipientPending, chat.id, currentUserId, notificationsData, historyData, isAcceptedManually]);

  useEffect(() => {
    if (useFb && fbChat.active) return;
    if (currentUserId && chat.id && !isRecipientPending) {
        markAsRead({ userId: currentUserId, partnerId: chat.id });
    }
  }, [useFb, fbChat.active, chat.id, currentUserId, isRecipientPending, markAsRead]);

  const messages = useMemo(() => {
    if (useFb && currentUserId) {
      return fbChat.messages.map((m) => ({
        id: m.id,
        text: m.text,
        isMe: m.sender === "me",
        time: m.timeLabel,
        messageType: m.messageType,
        imageUrl: m.imageUrl,
      }));
    }
    if (!historyData?.history) return [];
    return historyData.history.map((m) => ({
      id: m._id,
      text: m.message,
      isMe: String(m.senderId) === String(currentUserId),
      time: format(new Date(m.timestamp), "p"),
      messageType: "text" as const,
      imageUrl: null as string | null,
    }));
  }, [useFb, fbChat.messages, historyData, currentUserId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const chatBlockedReason = getLinkedinChatBlockReason(
    currentUser?.isLinkedinVerified,
    partnerUser?.isLinkedinVerified,
    isAdminChatUser,
    partnerUser?.role === "admin"
  );
  const canSendInChat =
    !accountStatus.accountDisabled && !chatBlockedReason && !isSenderPending;

  const validateChatSend = (): boolean => {
    if (accountStatus.accountDisabled) {
      toast.error(chatPartnerDisabledMessage(accountStatus.statusLabel));
      return false;
    }
    if (!currentUserId || isSenderPending) return false;
    if (isSelfChatPartner(currentUserId, chat.id)) {
      toast.error("You cannot chat with yourself");
      return false;
    }
    if (chatBlockedReason) {
      setLinkedinGuardReason(chatBlockedReason);
      setLinkedinGuardOpen(true);
      return false;
    }
    if (!partnerProfileReady || !partnerUser) {
      toast.error("Please wait a moment.");
      return false;
    }
    return true;
  };

  const sendChatPayload = async (payload: {
    message: string;
    messageType: "text" | "image";
    imageUrl?: string | null;
  }): Promise<boolean> => {
    if (!currentUserId) return false;
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
      if (isAdminSupportChatPartner(String(chat.id))) {
        await sendFirestoreAdminMessage(db, {
          currentUserId,
          adminReceiverId: chat.id,
          message: payload.message,
          messageType: payload.messageType,
          imageUrl: payload.imageUrl,
          authToken: token ?? undefined,
        });
      } else {
        await sendFirestoreChatMessage(db, {
          currentUserId,
          receiverId: chat.id,
          message: payload.message,
          messageType: payload.messageType,
          imageUrl: payload.imageUrl,
          authToken: token ?? undefined,
        });
      }
      return true;
    } catch (err) {
      console.error("Failed to send message from popup:", err);
      const message = err instanceof Error && err.message ? err.message : null;
      toast.error(
        message || (payload.messageType === "image" ? "Failed to send image" : "Failed to send")
      );
      return false;
    }
  };

  const handleSend = async () => {
    if (!messageInput.trim() || !validateChatSend()) return;
    if (isFbSending) return;

    const text = messageInput.trim();
    setMessageInput("");
    setIsFbSending(true);
    const ok = await sendChatPayload({ message: text, messageType: "text" });
    if (!ok) setMessageInput(text);
    setIsFbSending(false);
  };

  const handleAttachImage = async (file: File, caption: string): Promise<boolean> => {
    if (!validateChatSend() || !currentUserId) return false;

    const storage = getFirebaseStorage();
    const chatRoomId = buildChatRoomId(currentUserId, chat.id);
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

  const composerPlaceholder = accountStatus.accountDisabled
    ? chatPartnerStatusBadge(accountStatus.statusLabel) ?? "Unavailable"
    : !canSendInChat
      ? "Messaging unavailable"
      : isRecipientPending
        ? "Click Accept to reply"
        : "Type a message";

  const handleOpenInInbox = () => {
    router.push(`/chats?userId=${encodeURIComponent(chat.id)}`);
    onClose();
  };

  return (
    <>
    <div className="w-[300px] bg-white rounded-t-[10px] shadow-[0_4px_12px_rgba(0,0,0,0.15)] border border-[#E0E0E0] overflow-hidden flex flex-col pointer-events-auto">
      {/* Window Header */}
      <div className="p-2 border-b border-[#E0E0E0] flex items-center justify-between bg-white hover:bg-[#F3F6F8] cursor-pointer">
        <div className="flex items-center gap-2">
          <div className="relative">
            <div className="w-8 h-8 rounded-full overflow-hidden">
              <ImageWithFallback src={displayAvatar} alt={displayName} className="w-full h-full object-cover" />
            </div>
            {chat.status === "online" && !accountStatus.accountDisabled && (
              <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[#4ADE80] border-2 border-white rounded-full"></div>
            )}
          </div>
          <div className="flex flex-col">
            <span className="text-[13px] font-bold text-[#1A1A2E] leading-tight truncate w-32">{displayName}</span>
            <span className="text-[11px] font-medium leading-tight text-[#64748B]">
              {accountStatus.accountDisabled
                ? chatPartnerStatusBadge(accountStatus.statusLabel) ?? "Unavailable"
                : isRecipientPending
                  ? "Sent you a request"
                  : "Active now"}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1 text-[#666666]">
          <button
            type="button"
            onClick={handleOpenInInbox}
            className="p-1.5 hover:bg-black/5 rounded-full"
            aria-label="Open in inbox"
            title="Open in inbox"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
          <button type="button" onClick={onClose} className="p-1.5 hover:bg-black/5 rounded-full" aria-label="Close">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      {/* Message Area */}
      <div 
        className="h-72 p-3 overflow-y-auto space-y-3 no-scrollbar relative"
        style={{ 
          backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")',
          backgroundRepeat: 'repeat',
          backgroundSize: '300px',
          backgroundColor: '#efe7dd'
        }}
      >
        <div className="absolute inset-0 bg-white/40 pointer-events-none" />
        <div className="relative z-10 space-y-2">
          {messages.map((msg) => (
            <div key={msg.id} className={clsx("flex", msg.isMe ? "justify-end" : "justify-start")}>
              <div className={clsx(
                "px-2.5 py-1.5 rounded-lg shadow-sm text-[12px] text-[#111b21] max-w-[85%]",
                msg.isMe ? "bg-[#D9FDD3] rounded-tr-none" : "bg-white rounded-tl-none"
              )}>
                {msg.messageType === "image" && msg.imageUrl ? (
                  <a
                    href={msg.imageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block mb-1"
                  >
                    <ImageWithFallback
                      src={msg.imageUrl}
                      alt=""
                      className="max-w-full rounded-md max-h-[140px] object-cover"
                    />
                  </a>
                ) : null}
                {msg.text ? (
                  <span className="whitespace-pre-wrap">{msg.text}</span>
                ) : null}
                <div className="flex items-center justify-end gap-1 mt-1">
                  <span className="text-[10px] text-[#667781]">{msg.time}</span>
                  {msg.isMe && <CheckCheck className="w-3 h-3 text-[#53bdeb]" />}
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Sync'ed Banner: Accept & Reply */}
        {isRecipientPending && (
          <div className="sticky bottom-0 left-0 right-0 bg-[#0A7EA4]/95 p-3 rounded-lg mt-4 shadow-lg border border-white/20 backdrop-blur-sm z-20">
              <div className="flex items-center gap-2 mb-2 text-white">
                  <div className="bg-white/20 p-1 rounded-full"><Info className="w-3 h-3" /></div>
                  <p className="text-[11px] font-medium leading-tight">Accept request to start chatting</p>
              </div>
              <button 
                  onClick={async () => {
                    if (useFb && fbChat.active && fbChat.activeChatRoomId) {
                      try {
                        await fbChat.acceptFirestoreInvite(fbChat.activeChatRoomId);
                      } catch (e) {
                        console.error(e);
                      }
                      return;
                    }
                    setIsAcceptedManually(true);
                  }} 
                  className="w-full h-8 bg-white text-[#0A7EA4] rounded-md text-[12px] font-bold hover:bg-[#F3F4F6] transition-colors shadow-sm"
              >
                  Accept & Reply
              </button>
          </div>
        )}

        {isSenderPending && (
          <div className="sticky bottom-0 left-0 right-0 bg-gray-500/90 p-3 rounded-lg mt-4 shadow-lg border border-white/20 backdrop-blur-sm z-20 text-center">
             <p className="text-[11px] text-white font-medium">Waiting for response...</p>
          </div>
        )}
      </div>

      {/* Input Area */}
      {!isSenderPending && (
        <div className="p-2 bg-[#F0F2F5] flex flex-col gap-2 border-t border-[#E0E0E0]">
          {accountStatus.accountDisabled ? (
            <p className="text-[11px] text-[#64748B] px-1 leading-snug text-center py-2">
              {chatPartnerDisabledMessage(accountStatus.statusLabel)}
            </p>
          ) : (
            <>
          {chatBlockedReason && partnerProfileReady && (
            <p className="text-[11px] text-[#64748B] px-1 leading-snug">
              {chatBlockedReason === "sender_not_verified"
                ? "Verify with LinkedIn on your profile to send messages."
                : "This member is not LinkedIn verified. Messaging is not available."}
            </p>
          )}
          <ChatComposer
            variant="compact"
            value={messageInput}
            onChange={setMessageInput}
            onSend={handleSend}
            onAttachImage={handleAttachImage}
            beforeAttach={validateChatSend}
            placeholder={composerPlaceholder}
            disabled={!canSendInChat || isRecipientPending}
            isSending={isFbSending}
            isUploading={isUploadingImage}
          />
            </>
          )}
        </div>
      )}
    </div>
    <LinkedinChatGuardDialog
      open={linkedinGuardOpen}
      onOpenChange={setLinkedinGuardOpen}
      reason={linkedinGuardReason}
    />
    </>
  );
}

function chatHasAccountStatus(chat: InboxPreviewChat): boolean {
  return (
    chat.accountDisabled !== undefined ||
    chat.isSuspended !== undefined ||
    chat.isDeleted !== undefined ||
    chat.accountStatus !== undefined
  );
}

export function MessagingOverlay() {
  const dispatch = useAppDispatch();
  const { activeChats, isMessagingBarExpanded } = useAppSelector((state) => state.chat);
  const { user: currentUser, isAuthenticated } = useAppSelector((state) => state.auth);
  const [linkedinListGuardOpen, setLinkedinListGuardOpen] = useState(false);
  const [linkedinListGuardReason, setLinkedinListGuardReason] = useState<
    "sender_not_verified" | "recipient_not_verified" | null
  >(null);

  const canUseMessaging = senderCanUseLinkedinChat(
    currentUser?.isLinkedinVerified,
    currentUser?.role === "admin"
  );

  const handleMessagingBarClick = () => {
    if (!isAuthenticated) {
      dispatch(openAuthModal());
      return;
    }
    if (!canUseMessaging) {
      setLinkedinListGuardReason("sender_not_verified");
      setLinkedinListGuardOpen(true);
      return;
    }
    dispatch(toggleMessagingBar());
  };
  const { recentChats, inboxReady } = useInboxPreviewChats();

  const overlayPartnerIds = useMemo(() => {
    const ids = new Set<string>();
    recentChats.forEach((c) => ids.add(c.id));
    activeChats.forEach((c) => ids.add(c.id));
    return [...ids];
  }, [recentChats, activeChats]);

  const { data: partnerStatusData } = useGetChatPartnerStatusesQuery(overlayPartnerIds, {
    skip: overlayPartnerIds.length === 0,
  });

  const resolvePartnerStatus = useCallback(
    (partnerId: string, chat?: InboxPreviewChat): ChatPartnerAccountStatus => {
      if (chat && chatHasAccountStatus(chat)) {
        return resolveChatPartnerAccountStatus({
          isSuspended: chat.isSuspended,
          isDeleted: chat.isDeleted,
          accountDisabled: chat.accountDisabled,
          statusLabel: chat.accountStatus,
          displayName: chat.name,
        });
      }
      const fromBatch = partnerStatusData?.statuses?.[partnerId];
      if (fromBatch) {
        return resolveChatPartnerAccountStatus(fromBatch);
      }
      return resolveChatPartnerAccountStatus(chat ? { displayName: chat.name } : null);
    },
    [partnerStatusData]
  );

  const [activeTab, setActiveTab] = useState<"all" | "requests">("all");

  const visibleChats = useMemo(() => {
    if (activeTab === "requests") return recentChats.filter((c) => c.isRequest);
    return recentChats.filter((c) => !c.isRequest);
  }, [activeTab, recentChats]);

  // Auto-Pop & Sound Logic
  const lastUnreadCountRef = useRef<Record<string, number>>({});
  const isInitialLoadRef = useRef(true);

  useEffect(() => {
    if (!inboxReady || !recentChats.length) return;

    if (isInitialLoadRef.current) {
        recentChats.forEach(c => {
            lastUnreadCountRef.current[c.id] = c.unreadCount;
        });
        isInitialLoadRef.current = false;
        return;
    }

    let hasNewMessage = false;

    recentChats.forEach(chat => {
        const prevCount = lastUnreadCountRef.current[chat.id] || 0;
        const status = resolvePartnerStatus(chat.id, chat);
        
        if (chat.unreadCount > prevCount && canUseMessaging && !status.accountDisabled) {
            if (!activeChats.find(ac => ac.id === chat.id)) {
                dispatch(openChat({
                    id: chat.id,
                    name: chat.name,
                    avatar: chat.avatar,
                }));
            }
            hasNewMessage = true;
        }
        lastUnreadCountRef.current[chat.id] = chat.unreadCount;
    });

    if (hasNewMessage) {
        const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3");
        audio.play().catch(() => undefined);
    }
  }, [recentChats, activeChats, dispatch, inboxReady, canUseMessaging, resolvePartnerStatus]);

  useEffect(() => {
    activeChats.forEach((ac) => {
      const preview = recentChats.find((c) => c.id === ac.id);
      const status = resolvePartnerStatus(ac.id, preview);
      if (status.accountDisabled) {
        dispatch(closeChat(ac.id));
      }
    });
  }, [activeChats, recentChats, resolvePartnerStatus, dispatch]);

  return (
    <>
    <div className="fixed bottom-0 right-8 hidden md:flex items-end gap-3 z-[100] pointer-events-none">
      {/* Active Chat Windows */}
      <div className="flex items-end gap-3 pointer-events-auto">
        {activeChats.map((chat) => {
          const preview = recentChats.find((c) => c.id === chat.id);
          return (
          <ChatWindow 
            key={chat.id} 
            chat={chat}
            accountStatus={resolvePartnerStatus(chat.id, preview)}
            onClose={() => dispatch(closeChat(chat.id))} 
          />
          );
        })}
      </div>

      <div className="w-72 bg-white rounded-t-[10px] shadow-[0_4px_12px_rgba(0,0,0,0.15)] border border-[#E0E0E0] overflow-hidden pointer-events-auto">
        <button 
          onClick={handleMessagingBarClick}
          className="p-2 flex items-center justify-between cursor-pointer w-full text-left bg-white hover:bg-[#F3F6F8] transition-colors border-b border-[#E0E0E0]"
        >
          <div className="flex items-center gap-2">
            <div className="relative">
              <div className="w-8 h-8 rounded-full bg-[#0A66C2] flex items-center justify-center overflow-hidden">
                <ImageWithFallback src={resolveUserProfileImageUrl(currentUser, currentUser?.firstName || "User")} alt="User" />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-[#057642] border-2 border-white rounded-full"></div>
            </div>
            <span className="font-bold text-[14px] text-[#1A1A2E]">Messaging</span>
          </div>
          <div className="flex items-center gap-1">
            {isMessagingBarExpanded ? <ChevronDown className="w-4 h-4 text-[#666666]" /> : <ChevronUp className="w-4 h-4 text-[#666666]" />}
          </div>
        </button>

        <AnimatePresence>
          {isMessagingBarExpanded && canUseMessaging && (
            <motion.div 
              initial={{ height: 0 }}
              animate={{ height: 420 }}
              exit={{ height: 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="flex flex-col"
            >
              <div className="p-2 border-b border-[#F1F5F9] bg-white">
                <div className="relative mb-2">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#666666]" />
                  <input
                    type="text"
                    placeholder="Search messages"
                    className="w-full h-8 bg-[#EEF3F8] rounded-[4px] pl-9 pr-3 text-[14px] focus:outline-none focus:ring-1 focus:ring-[#0A66C2]"
                  />
                </div>
                <div className="flex gap-4 px-1">
                  <button 
                    onClick={() => setActiveTab("all")}
                    className={clsx(
                      "text-[12px] font-bold pb-1 transition-colors relative",
                      activeTab === "all" ? "text-[#0A66C2]" : "text-[#666666] hover:text-[#1A1A2E]"
                    )}
                  >
                    All Messages
                    {activeTab === "all" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0A66C2]" />}
                  </button>
                  <button 
                    onClick={() => setActiveTab("requests")}
                    className={clsx(
                      "text-[12px] font-bold pb-1 transition-colors relative",
                      activeTab === "requests" ? "text-[#0A66C2]" : "text-[#666666] hover:text-[#1A1A2E]"
                    )}
                  >
                    Message Requests
                    {activeTab === "requests" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0A66C2]" />}
                  </button>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto no-scrollbar bg-white">
                {visibleChats.map((chat) => (
                  <OverlayChatListItem
                    key={chat.id}
                    chat={chat}
                    isActive={Boolean(activeChats.find((c) => c.id === chat.id))}
                    accountStatus={resolvePartnerStatus(chat.id, chat)}
                    onOpen={(resolvedName, resolvedAvatar, partnerLinkedinVerified, partnerIsAdmin) => {
                      if (isSelfChatPartner(currentUser?._id, chat.id)) {
                        toast.error("You cannot chat with yourself");
                        return;
                      }
                      const reason = getLinkedinChatBlockReason(
                        currentUser?.isLinkedinVerified,
                        partnerLinkedinVerified,
                        currentUser?.role === "admin",
                        partnerIsAdmin
                      );
                      if (reason) {
                        setLinkedinListGuardReason(reason);
                        setLinkedinListGuardOpen(true);
                        return;
                      }
                      dispatch(openChat({ id: chat.id, name: resolvedName, avatar: resolvedAvatar }));
                    }}
                  />
                ))}
                {visibleChats.length === 0 && (
                  <div className="p-4 text-center text-[12px] text-[#666666]">No chats found</div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
    <LinkedinChatGuardDialog
      open={linkedinListGuardOpen}
      onOpenChange={setLinkedinListGuardOpen}
      reason={linkedinListGuardReason}
    />
    </>
  );
}

