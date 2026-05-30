import { useState, useMemo, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import { 
  X, Smile, Paperclip, Send, 
  CheckCheck, Search,
  ChevronDown, ChevronUp, Info
} from "lucide-react";
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
import { getFirestoreDb, isFirebaseConfigured } from "@/lib/firebase-app";
import { sendFirestoreChatMessage, isAdminSupportChatPartner } from "@/lib/firebase-chat";
import {
  getLinkedinChatBlockReason,
  isSelfChatPartner,
  senderCanUseLinkedinChat,
} from "@/lib/linkedin-messaging";
import { resolveUserProfileImageUrl } from "@/lib/user-profile-image";
import { useGetNotificationsQuery } from "@/store/endpoints/notifications";
import { format } from "date-fns";
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

function OverlayChatListItem({
  chat,
  isActive,
  onOpen,
}: {
  chat: OverlayChatPeer & { lastMsg: string; unreadCount: number };
  isActive: boolean;
  onOpen: (
    resolvedName: string,
    resolvedAvatar: string,
    partnerLinkedinVerified: boolean,
    partnerIsAdmin: boolean
  ) => void;
}) {
  const { data: profileData, isLoading } = useGetProfileQuery(chat.id, { skip: !chat.id });
  const user = profileData?.user;
  const resolvedName =
    user ? `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email : chat.name;
  const resolvedAvatar = resolveUserProfileImageUrl(user, resolvedName);

  return (
    <div
      onClick={() => {
        if (isLoading) return;
        onOpen(resolvedName, resolvedAvatar, Boolean(user?.isLinkedinVerified), user?.role === "admin");
      }}
      className={clsx(
        "flex items-start gap-3 cursor-pointer hover:bg-[#F3F6F8] p-3 transition-colors border-l-[3px]",
        isActive ? "border-[#0A66C2] bg-[#F3F6F8]" : "border-transparent hover:border-[#0A66C2]"
      )}
    >
      <div className="relative shrink-0 mt-0.5">
        <div className="w-12 h-12 rounded-full overflow-hidden">
          <ImageWithFallback src={resolvedAvatar} alt={resolvedName} className="w-full h-full object-cover" />
        </div>
        {chat.status === "online" && (
          <div className="absolute bottom-0 right-0.5 w-3.5 h-3.5 bg-[#057642] border-2 border-white rounded-full"></div>
        )}
        {chat.unreadCount > 0 && (
          <div className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-white">
            {chat.unreadCount}
          </div>
        )}
      </div>
      <div className="flex flex-col min-w-0 flex-1 border-b border-[#F1F5F9] pb-3 last:border-0">
        <div className="flex items-center justify-between mb-0.5">
          <span className="text-[14px] font-bold text-[#1A1A2E] truncate">{resolvedName}</span>
          <span className="text-[12px] text-[#666666]">Today</span>
        </div>
        <span className="text-[12px] text-[#666666] line-clamp-2 leading-snug">{chat.lastMsg}</span>
      </div>
    </div>
  );
}

function ChatWindow({ chat, onClose }: { chat: OverlayChatPeer; onClose: () => void }) {
  const dispatch = useAppDispatch();
  const { userId: authUserId, user: currentUser } = useAppSelector((state) => state.auth);
  const currentUserId = authUserId || currentUser?._id || undefined;
  const isAdminChatUser = currentUser?.role === "admin";
  const [messageInput, setMessageInput] = useState("");
  const [isAcceptedManually, setIsAcceptedManually] = useState(false);
  const [isFbSending, setIsFbSending] = useState(false);
  const [linkedinGuardOpen, setLinkedinGuardOpen] = useState(false);
  const [linkedinGuardReason, setLinkedinGuardReason] = useState<
    "sender_not_verified" | "recipient_not_verified" | null
  >(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: partnerProfile, isSuccess: partnerProfileReady } = useGetProfileQuery(chat.id, {
    skip: !chat.id,
  });

  const partnerUser = partnerProfile?.user;
  const displayName = useMemo(() => {
    if (partnerUser) {
      const full = `${partnerUser.firstName || ""} ${partnerUser.lastName || ""}`.trim();
      return full || partnerUser.email || chat.name;
    }
    if (chat.name && chat.name !== "User") return chat.name;
    return partnerProfileReady ? chat.name : "…";
  }, [partnerUser, partnerProfileReady, chat.name]);

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

  const { data: notificationsData } = useGetNotificationsQuery(currentUserId || "", {
    skip: !currentUserId || useFb,
    pollingInterval: 3000
  });

  const { data: historyData } = useGetChatHistoryQuery(
    { userId1: currentUserId || "", userId2: chat.id },
    { skip: !currentUserId || !chat.id || useFb, pollingInterval: 3000 }
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
      }));
    }
    if (!historyData?.history) return [];
    return historyData.history.map(m => ({
      id: m._id,
      text: m.message,
      isMe: String(m.senderId) === String(currentUserId),
      time: format(new Date(m.timestamp), "p")
    }));
  }, [useFb, fbChat.messages, historyData, currentUserId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!messageInput.trim() || !currentUserId || isSenderPending) return;
    if (isAdminSupportChatPartner(String(chat.id))) {
      toast.error("Use Contact Admin for support");
      return;
    }
    if (isSelfChatPartner(currentUserId, chat.id)) {
      toast.error("You cannot chat with yourself");
      return;
    }

    const blockReason = getLinkedinChatBlockReason(
      currentUser?.isLinkedinVerified,
      partnerUser?.isLinkedinVerified,
      isAdminChatUser,
      partnerUser?.role === "admin"
    );
    if (blockReason) {
      setLinkedinGuardReason(blockReason);
      setLinkedinGuardOpen(true);
      return;
    }
    if (!partnerProfileReady || !partnerUser) {
      toast.error("Please wait a moment.");
      return;
    }
    if (isFirebaseConfigured() && currentUserId) {
      const db = getFirestoreDb();
      if (!db) {
        toast.error("Firebase is not ready");
        return;
      }
      if (isFbSending) return;
      const text = messageInput.trim();
      setMessageInput("");
      setIsFbSending(true);
      try {
        if (fbChat.active && fbChat.isRecipientPending && fbChat.activeChatRoomId) {
          await fbChat.acceptFirestoreInvite(fbChat.activeChatRoomId);
        }
        await sendFirestoreChatMessage(db, {
          currentUserId,
          receiverId: chat.id,
          message: text,
          messageType: "text",
        });
      } catch (err) {
        console.error("Failed to send message from popup:", err);
        toast.error("Failed to send");
      } finally {
        setIsFbSending(false);
      }
      return;
    }
    toast.error("Firebase chat is not configured");
  };

  const sendBusy = isFbSending;

  const chatBlockedReason = getLinkedinChatBlockReason(
    currentUser?.isLinkedinVerified,
    partnerUser?.isLinkedinVerified,
    isAdminChatUser,
    partnerUser?.role === "admin"
  );
  const canSendInChat = !chatBlockedReason && !isSenderPending;

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
            {chat.status === "online" && (
              <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[#4ADE80] border-2 border-white rounded-full"></div>
            )}
          </div>
          <div className="flex flex-col">
            <span className="text-[13px] font-bold text-[#1A1A2E] leading-tight truncate w-32">{displayName}</span>
            <span className="text-[11px] text-[#4ADE80] font-medium leading-tight">
              {isRecipientPending ? "Sent you a request" : "Active now"}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1 text-[#666666]">
          <button onClick={onClose} className="p-1.5 hover:bg-black/5 rounded-full">
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
                {msg.text}
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
          {chatBlockedReason && partnerProfileReady && (
            <p className="text-[11px] text-[#64748B] px-1 leading-snug">
              {chatBlockedReason === "sender_not_verified"
                ? "Verify with LinkedIn on your profile to send messages."
                : "This member is not LinkedIn verified. Messaging is not available."}
            </p>
          )}
          <div className="flex items-center gap-2">
            <Smile className="w-5 h-5 text-[#54656f] cursor-pointer opacity-50" />
            <Paperclip className="w-5 h-5 text-[#54656f] cursor-pointer opacity-50" />
            <div className="flex-1 bg-white rounded-lg px-3 py-1.5 border border-[#E0E0E0]">
              <input
                type="text"
                placeholder={
                  !canSendInChat
                    ? "Messaging unavailable"
                    : isRecipientPending
                      ? "Click Accept to reply"
                      : "Type a message"
                }
                disabled={!canSendInChat || isRecipientPending}
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && canSendInChat && handleSend()}
                className="w-full text-[13px] bg-transparent focus:outline-none placeholder:text-[#94a3b8] disabled:opacity-50"
              />
            </div>
            <Send
              className={clsx(
                "w-5 h-5 transition-colors",
                messageInput.trim() && canSendInChat && !sendBusy
                  ? "text-[#0A66C2] cursor-pointer"
                  : "text-[#54656f] opacity-50"
              )}
              onClick={() => canSendInChat && handleSend()}
            />
          </div>
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

  const [activeTab, setActiveTab] = useState<"all" | "requests">("all");
  const pathname = usePathname();
  const isHomePage = pathname === "/";

  useEffect(() => {
    for (const c of activeChats) {
      if (isAdminSupportChatPartner(String(c.id))) {
        dispatch(closeChat(c.id));
      }
    }
  }, [activeChats, dispatch]);

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
        
        if (chat.unreadCount > prevCount && canUseMessaging) {
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

    if (hasNewMessage && isHomePage) {
        const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3");
        audio.play().catch(() => undefined);
    }
  }, [recentChats, activeChats, dispatch, isHomePage, inboxReady, canUseMessaging]);

  // Only show messaging overlay on home page per user request
  if (!isHomePage) return null;

  return (
    <>
    <div className="fixed bottom-0 right-8 flex items-end gap-3 z-[100] pointer-events-none">
      {/* Active Chat Windows */}
      <div className="flex items-end gap-3 pointer-events-auto">
        {activeChats.map((chat) => (
          <ChatWindow 
            key={chat.id} 
            chat={chat} 
            onClose={() => dispatch(closeChat(chat.id))} 
          />
        ))}
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

