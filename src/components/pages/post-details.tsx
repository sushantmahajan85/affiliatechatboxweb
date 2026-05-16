"use client";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { openAuthModal, openConnectionModal } from "@/store/uiSlice";
import { useParams, useRouter } from "next/navigation";
import { useGetConversationsQuery } from "@/store/endpoints/chats";
import { useFirebaseChatRoomsContext, useChatBackendIsFirebase } from "@/context/FirebaseChatRoomsProvider";
import { useEffect, useState } from "react";
import {
  FaFacebookF,
  FaGoogle,
  FaLinkedin,
  FaLinkedinIn,
  FaTelegramPlane,
  FaTwitter,
  FaWhatsapp
} from "react-icons/fa";
import {
  FiArrowLeft,
  FiCheck,
  FiCopy,
  FiFlag,
  FiMessageCircle,
  FiMoreVertical,
  FiShare2,
  FiX
} from "react-icons/fi";
import { toast } from "sonner";



import { LinkedinRecipientNotVerifiedDialog } from "@/components/linkedin-chat-guard-dialog";
import { isLinkedinOnlyChatBlocked } from "@/lib/linkedin-messaging";
import { resolveUserProfileImageUrl } from "@/lib/user-profile-image";
import { useGetPostByIdQuery } from "@/store/endpoints/posts";
import clsx from "clsx";
import { formatDistanceToNow } from "date-fns";

// Helper to convert country code (e.g., "IN") to flag emoji
const getFlagEmoji = (countryCode: string) => {
  if (!countryCode || countryCode.length !== 2) return countryCode;
  const codePoints = countryCode
    .toUpperCase()
    .split("")
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
};

export function PostDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isAuthenticated, user: currentUser } = useAppSelector((state) => state.auth);
  const { data, isLoading, error } = useGetPostByIdQuery(id as string);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [shareUrl, setShareUrl] = useState("");

  const chatBackendIsFirebase = useChatBackendIsFirebase();
  const { rooms: firebaseRooms } = useFirebaseChatRoomsContext();

  const { data: convData } = useGetConversationsQuery(currentUser?._id || "", {
    skip: !currentUser?._id || chatBackendIsFirebase,
  });

  const [linkedinGuardOpen, setLinkedinGuardOpen] = useState(false);

  const handleStartChat = () => {
    if (!isAuthenticated || !currentUser) {
      dispatch(openAuthModal());
      return;
    }
    if (!data?.post) return;

    if (isLinkedinOnlyChatBlocked(currentUser.isLinkedinVerified, data.post.isLinkedinVerified, currentUser.role === "admin")) {
      setLinkedinGuardOpen(true);
      return;
    }
    
    const hasChat = chatBackendIsFirebase
      ? firebaseRooms.some((r) => r.partnerId === data.post.userId && r.isRequested === "accepted")
      : Boolean(convData?.conversations?.some((c) => c.id === data.post.userId));
    if (hasChat) {
      router.push(`/chats?userId=${data.post.userId}`);
    } else {
      dispatch(openConnectionModal(data.post.userId));
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      setShareUrl(window.location.href);
    }
  }, []);

  if (isLoading) {
    return (
      <div className="bg-white rounded-[14px] shadow-[0_2px_8px_rgba(0,0,0,0.06)] p-12 min-h-[400px] flex items-center justify-center animate-pulse">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#0A7EA4] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#757575]">Loading post details...</p>
        </div>
      </div>
    );
  }

  if (error || !data?.post) {
    return (
      <div className="bg-white rounded-[14px] shadow-[0_2px_8px_rgba(0,0,0,0.06)] p-12 text-center">
        <h2 className="text-[20px] font-bold text-red-600 mb-2">Post not found</h2>
        <p className="text-[#757575] mb-6">The post you are looking for might have been deleted or moved.</p>
        <button 
          onClick={() => router.push("/")}
          className="px-6 py-2 bg-[#0A7EA4] text-white rounded-lg font-medium hover:bg-[#086a8a] transition-colors"
        >
          Go back home
        </button>
      </div>
    );
  }

  const post = data.post;


const renderContent = (text: string) => {
  const parts = text.split(/(#\w+)/g);

  return parts.map((part: string, index: number) => {
    if (part.startsWith("#")) {
      return (
        <span key={index} style={{ display: "block" }}>
          <span style={{ color: "#0a66c2", cursor: "pointer" }}>
            {part}
          </span>
        </span>
      );
    }
    return <span key={index}>{part}</span>;
  });
};

  return (
    <>
    <div className="bg-white rounded-[14px] shadow-[0_2px_8px_rgba(0,0,0,0.06)] overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-[#E0E0E0] flex items-center justify-between">
        <button 
          onClick={() => router.back()}
          className="flex items-center gap-2 text-[#757575] hover:text-[#1A1A2E] transition-colors"
        >
          <FiArrowLeft className="w-5 h-5" />
          <span className="font-medium text-[15px]">Back to feed</span>
        </button>
        <div className="flex items-center gap-2">
           <button className="p-2 text-[#757575] hover:bg-[#F5F5F5] rounded-full transition-colors" title="Report">
            <FiFlag className="w-5 h-5" />
          </button>
          <button className="p-2 text-[#757575] hover:bg-[#F5F5F5] rounded-full transition-colors">
            <FiMoreVertical className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div 
              className="w-14 h-14 rounded-full overflow-hidden border border-[#E0E0E0] cursor-pointer"
              onClick={() => router.push(`/profile/${post.userId}`)}
            >
              <ImageWithFallback 
                src={resolveUserProfileImageUrl({ profileImageUrl: post.profileImageUrl }, post.userName)} 
                alt={post.userName} 
                className="w-full h-full object-cover" 
              />
            </div>
            <div className="flex flex-col">
              <div 
                className="flex items-center gap-2 cursor-pointer group/name"
                onClick={() => router.push(`/profile/${post.userId}`)}
              >
                <span className="text-[18px] font-bold text-[#1A1A2E] group-hover/name:text-[#0A7EA4] transition-colors">{post.userName}</span>
                <div className="flex items-center gap-1.5 min-w-0">
                    {post.isGoogleVerified && (
                      <div className="w-4 h-4 rounded-full flex items-center justify-center" title="Google Verified">
                        <FaGoogle className="w-3 h-3 text-[#4285F4]" />
                      </div>
                    )}
                    {post.isLinkedinVerified && (
                      <div className="w-4 h-4 bg-[#0A66C2] rounded-[1px] flex items-center justify-center p-0.5" title="LinkedIn Verified">
                        <FaLinkedin className="w-full h-full text-white" />
                      </div>
                    )}
                    <div className="text-[16px] ml-0.5" title={post.flag}>
                      {getFlagEmoji(post.flag)}
                    </div>
                </div>
              </div>
              <span className="text-[14px] text-[#757575]">
                {post.BumpTime ? formatDistanceToNow(new Date(post.BumpTime), { addSuffix: true }) : "recently"}
              </span>
            </div>
          </div>
          <span className={clsx(
            "px-4 py-1.5 rounded-full text-[14px] font-medium uppercase",
            post.tag === "buy" && "bg-[#D1FAE5] text-[#065F46]",
            post.tag === "sell" && "bg-[#FEF3C7] text-[#92400E]",
            (post.tag === "blank" || !post.tag) && "bg-[#E0F2F7] text-[#0A7EA4]"
          )}>
            {post.tag === "blank" || !post.tag ? "General" : post.tag}
          </span>
        </div>

        <div className="space-y-4 mb-8">
          <p className="text-[16px] text-[#374151] leading-[1.7] whitespace-pre-wrap">
          {renderContent(post.postContent)}
          </p>

          
          {post.postDescription && (
             <p className="text-[15px] text-[#4B5563] leading-[1.6] bg-[#F9FAFB] p-4 rounded-xl border border-[#F3F4F6]">
              {post.postDescription}
            </p>
          )}

          {post.postMediaUrl && (
            <div className="rounded-2xl overflow-hidden border border-[#E5E7EB] bg-black max-h-[600px] flex items-center justify-center">
              {post.postMediaType?.startsWith("video/") ? (
                <video src={post.postMediaUrl} controls className="max-w-full max-h-[600px]" />
              ) : (
                <ImageWithFallback 
                  src={post.postMediaUrl} 
                  alt="Post media" 
                  className="max-w-full max-h-[600px] object-contain" 
                
                />
              )}
            </div>
          )}
        </div>


        {/* Footer Actions */}
        <div className="pt-6 border-t border-[#F3F4F6] flex flex-col sm:flex-row gap-3">
          <button 
            onClick={handleStartChat}
            className="flex-1 flex items-center justify-center gap-2 h-11 bg-[#0A7EA4] text-white rounded-xl text-[15px] font-bold hover:bg-[#086a8a] transition-colors shadow-sm"
          >
            <FiMessageCircle className="w-5 h-5" />
            <span>Start Chat</span>
          </button>
          <button 
            onClick={() => setIsShareModalOpen(true)}
            className="flex-1 flex items-center justify-center gap-2 h-11 border border-[#E0E0E0] rounded-xl text-[#3C3C3C] text-[15px] font-medium hover:bg-[#F5F5F5] transition-colors"
          >
            <FiShare2 className="w-5 h-5 text-[#6B7280]" />
            <span>Share Post</span>
          </button>
          <button className="sm:w-auto px-6 flex items-center justify-center gap-2 h-11 border border-[#E0E0E0] rounded-xl text-[#EF4444] text-[15px] font-medium hover:bg-[#FEF2F2] transition-colors">
            <FiFlag className="w-5 h-5" />
            <span className="sm:hidden lg:inline">Report Post</span>
          </button>
        </div>
      </div>

      {/* Share Modal */}
      <Dialog open={isShareModalOpen} onOpenChange={setIsShareModalOpen}>
        <DialogContent className="sm:max-w-md bg-white border-none rounded-[24px] p-0 overflow-hidden shadow-2xl">
          <div className="p-6">
            <DialogHeader className="mb-6">
              <div className="flex items-center justify-between">
                <DialogTitle className="text-[20px] font-bold text-[#1A1A2E]">Share Post</DialogTitle>
                <button 
                  onClick={() => setIsShareModalOpen(false)}
                  className="p-2 hover:bg-[#F5F5F5] rounded-full transition-colors"
                >
                  <FiX className="w-5 h-5 text-[#757575]" />
                </button>
              </div>
            </DialogHeader>

            <div className="grid grid-cols-4 gap-4 mb-8">
              {[
                { 
                  name: "WhatsApp", 
                  icon: FaWhatsapp, 
                  color: "#25D366", 
                  bg: "#E8FAEF",
                  href: `https://wa.me/?text=${encodeURIComponent(`${post.postContent}\n\nRead more at: ${shareUrl}`)}`
                },
                { 
                  name: "Facebook", 
                  icon: FaFacebookF, 
                  color: "#1877F2", 
                  bg: "#E8F1FF",
                  href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`
                },
                { 
                  name: "X", 
                  icon: FaTwitter, 
                  color: "#000000", 
                  bg: "#F5F5F5",
                  href: `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(post.postContent.substring(0, 100) + "...")}`
                },
                { 
                  name: "LinkedIn", 
                  icon: FaLinkedinIn, 
                  color: "#0A66C2", 
                  bg: "#E6F0F9",
                  href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`
                },
                { 
                  name: "Telegram", 
                  icon: FaTelegramPlane, 
                  color: "#0088CC", 
                  bg: "#E5F3F9",
                  href: `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(post.postContent.substring(0, 100) + "...")}`
                },
              ].map((platform) => (
                <a
                  key={platform.name}
                  href={platform.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center gap-2 group cursor-pointer"
                >
                  <div 
                    className="w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-active:scale-95"
                    style={{ backgroundColor: platform.bg }}
                  >
                    <platform.icon className="w-6 h-6" style={{ color: platform.color }} />
                  </div>
                  <span className="text-[12px] font-medium text-[#4B5563]">{platform.name}</span>
                </a>
              ))}
            </div>

            <div className="space-y-2">
              <label className="text-[13px] font-bold text-[#757575] uppercase tracking-wider">Page Link</label>
              <div className="flex items-center gap-2 p-1.5 bg-[#F8F9FA] border border-[#E5E7EB] rounded-xl focus-within:border-[#0A7EA4] transition-colors group">
                <input 
                  type="text" 
                  readOnly 
                  value={shareUrl}
                  className="flex-1 bg-transparent px-3 py-2 text-[14px] text-[#1A1A2E] outline-none"
                />
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(shareUrl);
                    setCopied(true);
                    toast.success("Link copied to clipboard!");
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className={clsx(
                    "px-4 py-2 rounded-lg text-[13px] font-bold transition-all flex items-center gap-2",
                    copied ? "bg-[#10B981] text-white" : "bg-[#0A7EA4] text-white hover:bg-[#086a8a]"
                  )}
                >
                  {copied ? <FiCheck className="w-4 h-4" /> : <FiCopy className="w-4 h-4" />}
                  <span>{copied ? "Copied" : "Copy"}</span>
                </button>
              </div>
            </div>
          </div>
          
          <div className="bg-[#F8F9FA] px-6 py-4 border-t border-[#E5E7EB] flex items-center justify-between">
            <span className="text-[13px] text-[#6B7280]">Anyone with this link can view this post.</span>
          </div>
        </DialogContent>
      </Dialog>
    </div>
    <LinkedinRecipientNotVerifiedDialog open={linkedinGuardOpen} onOpenChange={setLinkedinGuardOpen} />
    </>
  );
}




