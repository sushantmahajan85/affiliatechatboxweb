import { useState, useMemo, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import { 
  X, Phone, Video, Smile, Paperclip, Send, 
  CheckCheck, Search, MoreHorizontal, Edit3, 
  ChevronDown, ChevronUp, User, Info
} from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { closeChat, openChat, toggleMessagingBar } from "@/store/chatSlice";
import { 
  useGetChatHistoryQuery, 
  useGetConversationsQuery, 
  useSendChatMessageMutation,
  useMarkChatAsReadMutation 
} from "@/store/endpoints/chats";
import { useGetNotificationsQuery } from "@/store/endpoints/notifications";
import { format } from "date-fns";
import { toast } from "sonner";

// --- Sub-component for individual Chat Windows ---
function ChatWindow({ chat, onClose }: { chat: any; onClose: () => void }) {
  const dispatch = useAppDispatch();
  const { user: currentUser } = useAppSelector((state) => state.auth);
  const currentUserId = currentUser?._id;
  const [messageInput, setMessageInput] = useState("");
  const [isAcceptedManually, setIsAcceptedManually] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: notificationsData } = useGetNotificationsQuery(currentUserId || "", {
    skip: !currentUserId,
    pollingInterval: 3000
  });

  const { data: historyData } = useGetChatHistoryQuery(
    { userId1: currentUserId || "", userId2: chat.id },
    { skip: !currentUserId || !chat.id, pollingInterval: 3000 }
  );

  const [sendMessage, { isLoading: isSending }] = useSendChatMessageMutation();
  const [markAsRead] = useMarkChatAsReadMutation();

  // Handshake/Gate Logic (Synced with main Chats page)
  const { isSenderPending, isRecipientPending } = useMemo(() => {
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
  }, [chat.id, currentUserId, notificationsData, historyData, isAcceptedManually]);

  // Sync: Mark as Read when focused/viewed
  useEffect(() => {
    if (currentUserId && chat.id && !isRecipientPending) {
        markAsRead({ userId: currentUserId, partnerId: chat.id });
    }
  }, [chat.id, currentUserId, isRecipientPending, markAsRead]);

  const messages = useMemo(() => {
    if (!historyData?.history) return [];
    return historyData.history.map(m => ({
      id: m._id,
      text: m.message,
      isMe: String(m.senderId) === String(currentUserId),
      time: format(new Date(m.timestamp), "p")
    }));
  }, [historyData, currentUserId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!messageInput.trim() || !currentUserId || isSending || isSenderPending) return;
    const text = messageInput.trim();
    setMessageInput("");
    try {
      await sendMessage({
        message: text,
        receiverId: chat.id,
        senderId: currentUserId
      }).unwrap();
    } catch (err) {
      console.error("Failed to send message from popup:", err);
    }
  };

  return (
    <div className="w-[300px] bg-white rounded-t-[10px] shadow-[0_4px_12px_rgba(0,0,0,0.15)] border border-[#E0E0E0] overflow-hidden flex flex-col pointer-events-auto">
      {/* Window Header */}
      <div className="p-2 border-b border-[#E0E0E0] flex items-center justify-between bg-white hover:bg-[#F3F6F8] cursor-pointer">
        <div className="flex items-center gap-2">
          <div className="relative">
            <div className="w-8 h-8 rounded-full overflow-hidden">
              <ImageWithFallback src={chat.avatar} alt={chat.name} className="w-full h-full object-cover" />
            </div>
            {chat.status === "online" && (
              <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[#4ADE80] border-2 border-white rounded-full"></div>
            )}
          </div>
          <div className="flex flex-col">
            <span className="text-[13px] font-bold text-[#1A1A2E] leading-tight truncate w-32">{chat.name}</span>
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
                  onClick={() => setIsAcceptedManually(true)} 
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
        <div className="p-2 bg-[#F0F2F5] flex items-center gap-2 border-t border-[#E0E0E0]">
          <Smile className="w-5 h-5 text-[#54656f] cursor-pointer" />
          <Paperclip className="w-5 h-5 text-[#54656f] cursor-pointer" />
          <div className="flex-1 bg-white rounded-lg px-3 py-1.5 border border-[#E0E0E0]">
            <input 
              type="text" 
              placeholder={isRecipientPending ? "Click Accept to reply" : "Type a message"} 
              disabled={isRecipientPending}
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              className="w-full text-[13px] bg-transparent focus:outline-none placeholder:text-[#94a3b8] disabled:opacity-50"
            />
          </div>
          <Send 
            className={clsx("w-5 h-5 cursor-pointer transition-colors", (messageInput.trim() && !isRecipientPending) ? "text-[#0A66C2]" : "text-[#54656f]")} 
            onClick={handleSend}
          />
        </div>
      )}
    </div>
  );
}

export function MessagingOverlay() {
  const dispatch = useAppDispatch();
  const { activeChats, isMessagingBarExpanded } = useAppSelector((state) => state.chat);
  const { user: currentUser } = useAppSelector((state) => state.auth);
  
  const [activeTab, setActiveTab] = useState<"all" | "requests">("all");
  const pathname = usePathname();
  const isHomePage = pathname === "/";

  const { data: convData } = useGetConversationsQuery(currentUser?._id || "", {
    skip: !currentUser?._id,
    pollingInterval: 5000
  });

  const recentChats = useMemo(() => {
    if (!convData?.conversations) return [];
    return convData.conversations.map(c => ({
      id: c.id,
      name: c.name,
      avatar: c.avatar,
      lastMsg: c.lastMessage,
      status: c.online ? 'online' : 'offline',
      unreadCount: c.unreadCount
    }));
  }, [convData]);

  // Auto-Pop & Sound Logic
  const lastUnreadCountRef = useRef<Record<string, number>>({});
  const isInitialLoadRef = useRef(true);

  useEffect(() => {
    // Wait until conversations data is fully loaded for the first time
    if (!convData || !recentChats.length) return;

    if (isInitialLoadRef.current) {
        // Record current state on load, don't pop up existing unreads
        recentChats.forEach(c => {
            lastUnreadCountRef.current[c.id] = c.unreadCount;
        });
        isInitialLoadRef.current = false;
        return;
    }

    let hasNewMessage = false;

    recentChats.forEach(chat => {
        const prevCount = lastUnreadCountRef.current[chat.id] || 0;
        
        if (chat.unreadCount > prevCount) {
            // NEW MESSAGE RECEIVED!
            // Automatically open if not already open (limited to 3 by slice logic)
            if (!activeChats.find(ac => ac.id === chat.id)) {
                dispatch(openChat({ 
                    id: chat.id, 
                    name: chat.name, 
                    avatar: chat.avatar 
                }));
            }
            hasNewMessage = true;
        }
        // Update tracked count
        lastUnreadCountRef.current[chat.id] = chat.unreadCount;
    });

    if (hasNewMessage && isHomePage) {
        // Sound already handled by the slice or here
        const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3");
        audio.play().catch(e => console.log("Audio play blocked by browser:", e));
    }
  }, [recentChats, activeChats, dispatch, isHomePage, convData]);

  // Only show messaging overlay on home page per user request
  if (!isHomePage) return null;

  return (
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
          onClick={() => dispatch(toggleMessagingBar())}
          className="p-2 flex items-center justify-between cursor-pointer w-full text-left bg-white hover:bg-[#F3F6F8] transition-colors border-b border-[#E0E0E0]"
        >
          <div className="flex items-center gap-2">
            <div className="relative">
              <div className="w-8 h-8 rounded-full bg-[#0A66C2] flex items-center justify-center overflow-hidden">
                <ImageWithFallback src={currentUser?.profileImageUrl || `https://ui-avatars.com/api/?name=${currentUser?.firstName}&background=0A66C2&color=fff`} alt="User" />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-[#057642] border-2 border-white rounded-full"></div>
            </div>
            <span className="font-bold text-[14px] text-[#1A1A2E]">Messaging</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="p-1.5 hover:bg-black/5 rounded-full transition-colors"><MoreHorizontal className="w-4 h-4 text-[#666666]" /></span>
            <span className="p-1.5 hover:bg-black/5 rounded-full transition-colors"><Edit3 className="w-4 h-4 text-[#666666]" /></span>
            {isMessagingBarExpanded ? <ChevronDown className="w-4 h-4 text-[#666666]" /> : <ChevronUp className="w-4 h-4 text-[#666666]" />}
          </div>
        </button>

        <AnimatePresence>
          {isMessagingBarExpanded && (
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
                {recentChats.map((chat, idx) => (
                  <div 
                    key={chat.id} 
                    onClick={() => dispatch(openChat({ id: chat.id, name: chat.name, avatar: chat.avatar }))}
                    className={clsx(
                      "flex items-start gap-3 cursor-pointer hover:bg-[#F3F6F8] p-3 transition-colors border-l-[3px]",
                      activeChats.find(c => c.id === chat.id) ? "border-[#0A66C2] bg-[#F3F6F8]" : "border-transparent hover:border-[#0A66C2]"
                    )}
                  >
                    <div className="relative shrink-0 mt-0.5">
                      <div className="w-12 h-12 rounded-full overflow-hidden">
                        <ImageWithFallback src={chat.avatar} alt={chat.name} className="w-full h-full object-cover" />
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
                        <span className="text-[14px] font-bold text-[#1A1A2E] truncate">{chat.name}</span>
                        <span className="text-[12px] text-[#666666]">Today</span>
                      </div>
                      <span className="text-[12px] text-[#666666] line-clamp-2 leading-snug">{chat.lastMsg}</span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

