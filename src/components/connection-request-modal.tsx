"use client";
import { LinkedinChatGuardDialog } from "@/components/linkedin-chat-guard-dialog";
import { sanitizeTextOnChange } from "@/lib/sanitize-plain-text";
import { getLinkedinChatBlockReason, isSelfChatPartner } from "@/lib/linkedin-messaging";
import { getFirestoreDb, isFirebaseConfigured } from "@/lib/firebase-app";
import { sendFirestoreChatMessage } from "@/lib/firebase-chat";
import { useGetProfileQuery } from "@/store/endpoints/auth";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { closeConnectionModal } from "@/store/uiSlice";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FiLoader, FiSend, FiX } from "react-icons/fi";
import { toast } from "sonner";

export function ConnectionRequestModal() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { isConnectionModalOpen, connectionTargetId } = useAppSelector((state) => state.ui);
  const { user, token } = useAppSelector((state) => state.auth);

  const [message, setMessage] = useState("Hi, I'd like to connect with you!");
  const [fbSending, setFbSending] = useState(false);
  const [linkedinGuardOpen, setLinkedinGuardOpen] = useState(false);
  const [linkedinGuardReason, setLinkedinGuardReason] = useState<
    "sender_not_verified" | "recipient_not_verified" | null
  >(null);

  const { data: targetProfile, isSuccess: targetReady } = useGetProfileQuery(connectionTargetId ?? "", {
    skip: !isConnectionModalOpen || !connectionTargetId,
  });

  const handleSend = async () => {
    if (!message.trim()) {
      toast.error("Please enter a message");
      return;
    }
    if (!user) {
      toast.error("You must be logged in to send a request");
      return;
    }

    if (isSelfChatPartner(user._id, connectionTargetId ?? undefined)) {
      toast.error("You cannot chat with yourself");
      return;
    }

    const blockReason = getLinkedinChatBlockReason(
      user.isLinkedinVerified,
      targetProfile?.user?.isLinkedinVerified,
      user.role === "admin",
      targetProfile?.user?.role === "admin"
    );
    if (blockReason) {
      if (blockReason === "recipient_not_verified" && !targetReady) {
        toast.error("Please wait a moment and try again.");
        return;
      }
      setLinkedinGuardReason(blockReason);
      setLinkedinGuardOpen(true);
      return;
    }
    if (!targetReady) {
      toast.error("Please wait a moment and try again.");
      return;
    }

    const senderId = user._id;

    if (isFirebaseConfigured()) {
      const db = getFirestoreDb();
      if (!db) {
        toast.error("Chat is not ready");
        return;
      }
      setFbSending(true);
      try {
        await sendFirestoreChatMessage(db, {
          currentUserId: senderId,
          receiverId: connectionTargetId!,
          message: message.trim(),
          messageType: "text",
          authToken: token ?? undefined,
        });
        toast.success("Connection request sent successfully!");
        dispatch(closeConnectionModal());
        setMessage("Hi, I'd like to connect with you!");
        router.push(`/chats?userId=${connectionTargetId}`);
      } catch {
        toast.error("Failed to send connection request. Please try again.");
      } finally {
        setFbSending(false);
      }
      return;
    }

    toast.error("Firebase chat is not configured");
  };

  return (
    <>
      {isConnectionModalOpen && connectionTargetId ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div
            className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-[#F1F5F9]">
              <h2 className="text-lg font-bold text-[#1A1A1A]">Send Connection Request</h2>
              <button
                onClick={() => dispatch(closeConnectionModal())}
                className="p-2 text-[#64748B] hover:bg-[#F8FAFC] rounded-full transition-colors"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-sm text-[#475569]">
                You need to send a connection request to this user to chat and see their complete profile. Include a
                personal message to introduce yourself!
              </p>

              <div className="space-y-2">
                <label className="text-xs font-bold text-[#64748B] uppercase">Message (Optional)</label>
                <textarea
                  value={message}
                  onChange={(e) => sanitizeTextOnChange(e.target.value, setMessage)}
                  placeholder="Ex: Hi, I'd like to join your professional network..."
                  className="w-full min-h-[100px] p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm text-[#1A1A1A] placeholder:text-[#94a3b8] focus:outline-none focus:border-[#0A7EA4] focus:ring-1 focus:ring-[#0A7EA4] resize-none transition-all"
                />
              </div>
            </div>

            <div className="p-4 border-t border-[#F1F5F9] bg-[#F8FAFC] flex justify-end gap-3">
              <button
                onClick={() => dispatch(closeConnectionModal())}
                className="px-5 py-2 text-sm font-bold text-[#64748B] hover:text-[#1A1A1A] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSend}
                disabled={fbSending || !message.trim()}
                className="flex items-center gap-2 px-6 py-2 bg-[#0A7EA4] text-white rounded-xl text-sm font-bold hover:bg-[#086a8a] transition-all shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {fbSending ? <FiLoader className="w-4 h-4 animate-spin" /> : <FiSend className="w-4 h-4" />}
                Send Request
              </button>
            </div>
          </div>
        </div>
      ) : null}
      <LinkedinChatGuardDialog
        open={linkedinGuardOpen}
        onOpenChange={setLinkedinGuardOpen}
        reason={linkedinGuardReason}
      />
    </>
  );
}
