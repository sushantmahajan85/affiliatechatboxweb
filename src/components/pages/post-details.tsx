"use client";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";
import { PostHashtags } from "@/components/post-hashtags";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { openAuthModal, openConnectionModal } from "@/store/uiSlice";
import { getPostTypeLabel, isGeneralPostType } from "@/lib/post-tags";
import { useParams, useRouter } from "next/navigation";
import { useGetConversationsQuery } from "@/store/endpoints/chats";
import { useFirebaseChatRoomsContext, useChatBackendIsFirebase } from "@/context/FirebaseChatRoomsProvider";
import { useState } from "react";
import {
  FaGoogle,
  FaLinkedin,
} from "react-icons/fa";
import {
  FiArrowLeft,
  FiFlag,
  FiMessageCircle,
  FiMoreVertical,
  FiShare2,
} from "react-icons/fi";
import { toast } from "sonner";



import { LinkedinChatGuardDialog } from "@/components/linkedin-chat-guard-dialog";
import { getLinkedinChatBlockReason, isSelfChatPartner } from "@/lib/linkedin-messaging";
import { resolveUserProfileImageUrl } from "@/lib/user-profile-image";
import { useGetPostByIdQuery, useBumpPostMutation, useDeletePostMutation } from "@/store/endpoints/posts";
import clsx from "clsx";
import { CountryFlag } from "@/components/country-flag";
import {
  ReportPostDialog,
  type ReportPostTarget,
} from "@/components/report-post-dialog";
import { SharePostDialog } from "@/components/share-post-dialog";
import { canBumpPost, formatPostAge } from "@/lib/post-bump";

export function PostDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isAuthenticated, user: currentUser } = useAppSelector((state) => state.auth);
  const { data, isLoading, error } = useGetPostByIdQuery(id as string);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportTarget, setReportTarget] = useState<ReportPostTarget | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [bumpOpen, setBumpOpen] = useState(false);
  const [deletePost, { isLoading: isDeletingPost }] = useDeletePostMutation();
  const [bumpPost, { isLoading: isBumpingPost }] = useBumpPostMutation();

  const chatBackendIsFirebase = useChatBackendIsFirebase();
  const { rooms: firebaseRooms } = useFirebaseChatRoomsContext();

  const { data: convData } = useGetConversationsQuery(currentUser?._id || "", {
    skip: !currentUser?._id || chatBackendIsFirebase,
  });

  const [linkedinGuardOpen, setLinkedinGuardOpen] = useState(false);
  const [linkedinGuardReason, setLinkedinGuardReason] = useState<
    "sender_not_verified" | "recipient_not_verified" | null
  >(null);

  const openReportDialog = () => {
    if (!isAuthenticated || !currentUser) {
      dispatch(openAuthModal());
      return;
    }
    if (!data?.post) return;
    setReportTarget({
      postAuthorUserId: String(data.post.userId),
      postContent: data.post.postContent || "",
      postUserName: data.post.userName || "Unknown",
    });
    setReportOpen(true);
  };

  const openDeleteDialog = () => {
    if (!isAuthenticated || !currentUser) {
      dispatch(openAuthModal());
      return;
    }
    setDeleteOpen(true);
  };

  const openBumpDialog = () => {
    if (!isAuthenticated || !currentUser) {
      dispatch(openAuthModal());
      return;
    }
    if (!data?.post || !canBumpPost(data.post)) {
      toast.error("You can't bump the post before 24 hours");
      return;
    }
    setBumpOpen(true);
  };

  const handleDeletePost = async () => {
    if (!data?.post) return;
    try {
      await deletePost(data.post._id).unwrap();
      toast.success("Post deleted successfully");
      setDeleteOpen(false);
      router.push("/");
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "data" in err
          ? String((err as { data?: { message?: string } }).data?.message || "Failed to delete post")
          : "Failed to delete post";
      toast.error(message);
    }
  };

  const handleBumpPost = async () => {
    if (!data?.post) return;
    try {
      await bumpPost(data.post._id).unwrap();
      toast.success("Post bumped successfully");
      setBumpOpen(false);
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "data" in err
          ? String((err as { data?: { message?: string } }).data?.message || "Failed to bump post")
          : "Failed to bump post";
      toast.error(message);
    }
  };

  const handleStartChat = () => {
    if (!isAuthenticated || !currentUser) {
      dispatch(openAuthModal());
      return;
    }
    if (!data?.post) return;

    if (isSelfChatPartner(currentUser._id, data.post.userId)) {
      toast.error("You cannot chat with yourself");
      return;
    }

    const blockReason = getLinkedinChatBlockReason(
      currentUser.isLinkedinVerified,
      data.post.isLinkedinVerified,
      currentUser.role === "admin",
      data.post.role === "admin"
    );
    if (blockReason) {
      setLinkedinGuardReason(blockReason);
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
        <p className="text-[#757575] mb-6">
          This post is unavailable. It may have been removed, rejected, or is still pending approval.
        </p>
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
  // Defense in depth: never render non-approved posts from a public detail link.
  if (post.underApproval || post.isApproved !== true) {
    return (
      <div className="bg-white rounded-[14px] shadow-[0_2px_8px_rgba(0,0,0,0.06)] p-12 text-center">
        <h2 className="text-[20px] font-bold text-red-600 mb-2">Post not found</h2>
        <p className="text-[#757575] mb-6">
          This post is unavailable. It may have been removed, rejected, or is still pending approval.
        </p>
        <button 
          onClick={() => router.push("/")}
          className="px-6 py-2 bg-[#0A7EA4] text-white rounded-lg font-medium hover:bg-[#086a8a] transition-colors"
        >
          Go back home
        </button>
      </div>
    );
  }
  const currentUserId = currentUser?._id;
  const isOwner =
    !!currentUserId && String(currentUserId) === String(post.userId);


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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="p-2 text-[#757575] hover:bg-[#F5F5F5] rounded-full transition-colors"
                aria-label="Post options"
              >
                <FiMoreVertical className="w-5 h-5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem
                onClick={() => router.push(`/profile/${post.userId}`)}
                className="cursor-pointer"
              >
                View Profile
              </DropdownMenuItem>
              {isOwner && (
                <>
                  <DropdownMenuItem
                    onClick={openBumpDialog}
                    className="cursor-pointer"
                  >
                    Bump up
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={openDeleteDialog}
                    className="cursor-pointer text-red-600 focus:text-red-600"
                  >
                    Delete Post
                  </DropdownMenuItem>
                </>
              )}
              {!isOwner && (
                <DropdownMenuItem
                  onClick={openReportDialog}
                  className="cursor-pointer"
                >
                  Report Post
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
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
                    <CountryFlag flag={post.flag} size={16} className="ml-0.5" />
                </div>
              </div>
              <span className="text-[14px] text-[#757575]">
                {formatPostAge(post)}
              </span>
            </div>
          </div>
          <span className={clsx(
            "px-4 py-1.5 rounded-full text-[14px] font-medium uppercase",
            post.tag === "buy" && "bg-[#D1FAE5] text-[#065F46]",
            post.tag === "sell" && "bg-[#FEF3C7] text-[#92400E]",
            isGeneralPostType(post.tag) && "bg-[#E0F2F7] text-[#0A7EA4]"
          )}>
            {getPostTypeLabel(post.tag)}
          </span>
        </div>

        <div className="space-y-4 mb-8">
          <p className="text-[16px] text-[#374151] leading-[1.7] whitespace-pre-wrap">
          {renderContent(post.postContent)}
          </p>

          
          <PostHashtags postDescription={post.postDescription} className="mb-2" />

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
          {!isOwner && (
            <button
              type="button"
              onClick={openReportDialog}
              className="sm:w-auto px-6 flex items-center justify-center gap-2 h-11 border border-[#E0E0E0] rounded-xl text-[#EF4444] text-[15px] font-medium hover:bg-[#FEF2F2] transition-colors"
            >
              <FiFlag className="w-5 h-5" />
              <span className="sm:hidden lg:inline">Report Post</span>
            </button>
          )}
        </div>
      </div>

      <SharePostDialog
        open={isShareModalOpen}
        onOpenChange={setIsShareModalOpen}
        postId={String(post._id)}
        postContent={post.postContent || ""}
      />
    </div>
    <ReportPostDialog
      open={reportOpen}
      onOpenChange={setReportOpen}
      target={reportTarget}
    />
    <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
      <AlertDialogContent className="bg-white border border-[#E0E0E0]">
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Post</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this post? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeletingPost}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDeletePost}
            disabled={isDeletingPost}
            className="bg-red-600 hover:bg-red-700"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    <AlertDialog open={bumpOpen} onOpenChange={setBumpOpen}>
      <AlertDialogContent className="bg-white border border-[#E0E0E0]">
        <AlertDialogHeader>
          <AlertDialogTitle>Bump Post</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to bump this post to the top of the feed?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isBumpingPost}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleBumpPost}
            disabled={isBumpingPost}
            className="bg-[#0A7EA4] hover:bg-[#086a8a]"
          >
            Bump
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    <LinkedinChatGuardDialog
      open={linkedinGuardOpen}
      onOpenChange={setLinkedinGuardOpen}
      reason={linkedinGuardReason}
    />
    </>
  );
}




