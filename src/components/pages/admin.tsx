"use client";
import { useState, useRef, useEffect, useMemo } from "react";
import {
  MoreVertical,
  Send,
  Paperclip,
  Smile,
  CheckCheck,
  Phone,
  Video,
  ShieldCheck,
  Info,
  Loader2,
} from "lucide-react";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";
import { clsx } from "clsx";
import { motion } from "motion/react";
import { getFirestoreDb, getFirebaseStorage, isFirebaseConfigured } from "@/lib/firebase-app";
import {
  buildChatRoomId,
  FIRESTORE_ADMIN_SUPPORT_USER_ID,
  onChatOpenSideEffects,
  sendFirestoreAdminMessage,
  subscribeChatMessages,
  uploadFirestoreChatImage,
  type FirestoreMessageRow,
} from "@/lib/firebase-chat";
import { useGetProfileQuery } from "@/store/endpoints/auth";
import { useAppSelector } from "@/store/hooks";
import { format, isToday, isYesterday } from "date-fns";
import { toast } from "sonner";

function dateBannerLabel(ms: number): string {
  if (!ms) return "";
  const d = new Date(ms);
  if (isToday(d)) return "Today";
  if (isYesterday(d)) return "Yesterday";
  return format(d, "MMM d, yyyy");
}

export function AdminPage() {
  const { userId: authUserId, user: authUser } = useAppSelector((s) => s.auth);
  const currentUserId = authUserId || authUser?._id || null;

  const adminId = FIRESTORE_ADMIN_SUPPORT_USER_ID;
  const { data: adminProfile, isLoading: adminProfileLoading } = useGetProfileQuery(adminId, {
    skip: !currentUserId,
  });

  const adminUser = adminProfile?.user;
  const adminDisplayName = useMemo(() => {
    if (!adminUser) return "Official Support";
    const n = `${adminUser.firstName || ""} ${adminUser.lastName || ""}`.trim();
    if (n) return n;
    if (adminUser.email) return adminUser.email;
    return adminUser.mobileNumber ? String(adminUser.mobileNumber) : "Official Support";
  }, [adminUser]);

  const adminAvatar =
    adminUser?.profileImageUrl ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(adminDisplayName)}&background=0A7EA4&color=fff`;

  const [messages, setMessages] = useState<FirestoreMessageRow[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [listError, setListError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const chatRoomId =
    currentUserId != null ? buildChatRoomId(currentUserId, adminId) : null;
  const firebaseReady = isFirebaseConfigured() && Boolean(currentUserId) && Boolean(chatRoomId);

  useEffect(() => {
    if (!firebaseReady || !chatRoomId || !currentUserId) {
      setMessages([]);
      setListError(null);
      return;
    }
    const db = getFirestoreDb();
    if (!db) {
      setListError("Firebase is not ready");
      return;
    }
    setListError(null);
    const unsub = subscribeChatMessages(
      db,
      chatRoomId,
      currentUserId,
      setMessages,
      (e) => setListError(e.message)
    );
    void onChatOpenSideEffects(db, chatRoomId, currentUserId);
    return () => unsub();
  }, [firebaseReady, chatRoomId, currentUserId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const bannerDate = useMemo(() => {
    const first = messages[0]?.timestampMs;
    return first ? dateBannerLabel(first) : "";
  }, [messages]);

  const handleSendMessage = async () => {
    const text = messageInput.trim();
    if (!text || !currentUserId) return;
    if (!isFirebaseConfigured()) {
      toast.error("Firebase chat is not configured");
      return;
    }
    const db = getFirestoreDb();
    if (!db) {
      toast.error("Firebase is not ready");
      return;
    }
    setMessageInput("");
    setIsSending(true);
    try {
      await sendFirestoreAdminMessage(db, {
        currentUserId,
        adminReceiverId: adminId,
        message: text,
        messageType: "text",
      });
    } catch (err) {
      console.error(err);
      toast.error("Failed to send message");
      setMessageInput(text);
    } finally {
      setIsSending(false);
    }
  };

  const handlePickImage = () => fileInputRef.current?.click();

  const onFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !currentUserId) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }
    if (!isFirebaseConfigured()) {
      toast.error("Firebase chat is not configured");
      return;
    }
    const db = getFirestoreDb();
    const storage = getFirebaseStorage();
    if (!db || !storage || !chatRoomId) {
      toast.error("Firebase is not ready");
      return;
    }
    const caption = messageInput.trim();
    setMessageInput("");
    setIsUploading(true);
    try {
      const buf = new Uint8Array(await file.arrayBuffer());
      const imageUrl = await uploadFirestoreChatImage(storage, {
        userId: currentUserId,
        chatRoomId,
        data: buf,
        contentType: file.type || "image/jpeg",
      });
      await sendFirestoreAdminMessage(db, {
        currentUserId,
        adminReceiverId: adminId,
        message: caption,
        messageType: "image",
        imageUrl,
      });
    } catch (err) {
      console.error(err);
      toast.error("Failed to send image");
      if (caption) setMessageInput(caption);
    } finally {
      setIsUploading(false);
    }
  };

  if (!currentUserId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] bg-white rounded-[14px] border border-[#F3F4F6] p-8 text-center">
        <p className="text-[#1A1A2E] font-semibold mb-2">Sign in required</p>
        <p className="text-[#757575] text-[14px]">Sign in to contact support through the same chat as the mobile app.</p>
      </div>
    );
  }

  if (!isFirebaseConfigured()) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] bg-white rounded-[14px] border border-[#F3F4F6] p-8 text-center">
        <p className="text-[#1A1A2E] font-semibold mb-2">Firebase not configured</p>
        <p className="text-[#757575] text-[14px]">
          Set the same <code className="text-[13px] bg-[#F5F7FB] px-1 rounded">NEXT_PUBLIC_FIREBASE_*</code> keys as the app to enable support chat.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-180px)] min-h-[500px] bg-white rounded-[14px] shadow-[0_2px_8px_rgba(0,0,0,0.06)] overflow-hidden border border-[#F3F4F6]">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onFileSelected}
      />

      <div className="h-[72px] bg-white border-b border-[#F3F4F6] flex items-center justify-between px-6 z-10 shrink-0">
        <div className="flex items-center gap-4 min-w-0">
          <div className="relative shrink-0">
            <div className="w-11 h-11 rounded-full overflow-hidden border-2 border-[#0A7EA4]/10">
              {adminProfileLoading ? (
                <div className="w-full h-full bg-[#F0F2F5] flex items-center justify-center">
                  <Loader2 className="w-5 h-5 animate-spin text-[#0A7EA4]" />
                </div>
              ) : (
                <ImageWithFallback src={adminAvatar} alt={adminDisplayName} className="w-full h-full object-cover" />
              )}
            </div>
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-[#4ADE80] border-2 border-white rounded-full" />
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-bold text-[16px] text-[#1A1A2E] truncate">{adminDisplayName}</span>
              <ShieldCheck className="w-4 h-4 text-[#0A7EA4] shrink-0" />
            </div>
            <span className="text-[12px] text-[#757575] font-medium flex items-center gap-1 truncate">
              <span className="w-1.5 h-1.5 bg-[#4ADE80] rounded-full shrink-0" />
              Official support •
            </span>
          </div>
        </div>
        {/* <div className="flex items-center gap-2 shrink-0">
          <button type="button" className="hidden sm:flex p-2.5 text-[#757575] hover:bg-[#F5F7FB] rounded-full transition-colors" aria-label="Phone">
            <Phone className="w-5 h-5" />
          </button>
          <button type="button" className="hidden sm:flex p-2.5 text-[#757575] hover:bg-[#F5F7FB] rounded-full transition-colors" aria-label="Video">
            <Video className="w-5 h-5" />
          </button>
          <button type="button" className="p-2.5 text-[#757575] hover:bg-[#F5F7FB] rounded-full transition-colors" aria-label="Info">
            <Info className="w-5 h-5" />
          </button>
          <button type="button" className="p-2.5 text-[#757575] hover:bg-[#F5F7FB] rounded-full transition-colors" aria-label="More">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div> */}
      </div>

      <div
        className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 no-scrollbar bg-[#E5DDD5] relative"
        style={{
          backgroundImage:
            'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")',
          backgroundRepeat: "repeat",
          backgroundSize: "400px",
          backgroundColor: "#efe7dd",
        }}
      >
        <div className="absolute inset-0 bg-white/40 pointer-events-none" />

        <div className="relative flex flex-col items-center justify-center my-6 z-10 space-y-2">
          <span className="px-4 py-1.5 bg-[#FFF9C4] text-[#856404] text-[12px] font-medium rounded-lg shadow-sm border border-[#FFEE58] max-w-[90%] text-center">
          Contact us for any questions or support.
          </span>
          {bannerDate ? (
            <span className="px-3 py-1 bg-white/90 text-[#54656f] text-[12px] font-medium rounded-lg shadow-sm uppercase">
              {bannerDate}
            </span>
          ) : null}
        </div>

        {listError ? (
          <div className="relative z-10 text-center text-red-600 text-[14px] px-4">{listError}</div>
        ) : null}

        <div className="relative z-10 space-y-4">
          {messages.length === 0 && !listError ? (
            <div className="flex justify-center py-12">
              <p className="text-[#111b21] font-bold text-[18px]">Start the Chat…</p>
            </div>
          ) : null}

          {messages.map((msg) => (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              key={msg.id}
              className={clsx("flex", msg.sender === "me" ? "justify-end" : "justify-start")}
            >
              <div
                className={clsx(
                  "max-w-[85%] md:max-w-[70%] px-4 py-2.5 rounded-[12px] shadow-[0_1px_0.5px_rgba(0,0,0,0.13)] relative",
                  msg.sender === "me"
                    ? "bg-[#D9FDD3] text-[#111b21] rounded-tr-none"
                    : "bg-white text-[#111b21] rounded-tl-none"
                )}
              >
                {msg.messageType === "image" && msg.imageUrl ? (
                  <a href={msg.imageUrl} target="_blank" rel="noopener noreferrer" className="block mb-2">
                    <ImageWithFallback
                      src={msg.imageUrl}
                      alt=""
                      className="max-w-full rounded-lg max-h-[240px] object-cover"
                    />
                  </a>
                ) : null}
                {msg.text ? (
                  <p className="text-[14px] sm:text-[15px] leading-relaxed pb-2 whitespace-pre-wrap">{msg.text}</p>
                ) : null}
                <div className="flex items-center justify-end gap-1.5 -mt-1">
                  <span className="text-[10px] text-[#667781] font-medium">{msg.timeLabel}</span>
                  {msg.sender === "me" && <CheckCheck className="w-3.5 h-3.5 text-[#53bdeb]" />}
                </div>
              </div>
            </motion.div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="bg-[#F0F2F5] px-4 py-3 flex items-center gap-3 shrink-0">
        <button type="button" className="text-[#54656f] hover:text-[#111b21] transition-colors p-1.5" aria-label="Emoji">
          <Smile className="w-6 h-6" />
        </button>
        <button
          type="button"
          onClick={handlePickImage}
          disabled={isUploading || isSending}
          className="text-[#54656f] hover:text-[#111b21] transition-colors p-1.5 disabled:opacity-40"
          aria-label="Attach image"
        >
          {isUploading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Paperclip className="w-6 h-6" />}
        </button>
        <div className="flex-1">
          <input
            type="text"
            placeholder="Write a message…"
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void handleSendMessage();
              }
            }}
            disabled={isSending || isUploading}
            className="w-full h-11 bg-white border-none rounded-xl px-5 text-[15px] focus:outline-none placeholder:text-[#94a3b8] shadow-sm disabled:opacity-60"
          />
        </div>
        <button
          type="button"
          onClick={() => void handleSendMessage()}
          disabled={!messageInput.trim() || isSending || isUploading}
          className={clsx(
            "w-11 h-11 flex items-center justify-center rounded-full transition-all shadow-sm active:scale-95",
            messageInput.trim() && !isSending && !isUploading
              ? "bg-[#0A7EA4] text-white"
              : "bg-[#E0E0E0] text-[#9E9E9E] cursor-not-allowed"
          )}
          aria-label="Send"
        >
          {isSending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 ml-0.5" />}
        </button>
      </div>
    </div>
  );
}
