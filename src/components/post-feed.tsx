"use client";
import { clsx } from "clsx";
import { MessageCircle, MoreVertical, Share2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { FcGoogle } from "react-icons/fc";
import { ImageWithFallback } from "./figma/ImageWithFallback";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
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
import {
  useBumpPostMutation,
  useDeletePostMutation,
  useGetAllPostsFeedQuery,
  useGetPinnedPostsQuery,
  useGetUserPostsQuery,
  usePinPostMutation,
  useUnpinPostMutation
} from "@/store/endpoints/posts";
import { LinkedinChatGuardDialog } from "@/components/linkedin-chat-guard-dialog";
import { getLinkedinChatBlockReason, isSelfChatPartner } from "@/lib/linkedin-messaging";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { openAuthModal, openConnectionModal } from "@/store/uiSlice";
import { useGetConversationsQuery } from "@/store/endpoints/chats";
import { useFirebaseChatRoomsContext, useChatBackendIsFirebase } from "@/context/FirebaseChatRoomsProvider";
import { getPostTypeLabel, isGeneralPostType } from "@/lib/post-tags";
import { resolveUserProfileImageUrl } from "@/lib/user-profile-image";
import { PostHashtags } from "@/components/post-hashtags";
import { useEffect, useMemo, useRef, useState } from "react";
import { FaThumbtack } from "react-icons/fa";
import { GrLinkedin } from "react-icons/gr";
import { toast } from "sonner";
import { CountryFlag } from "@/components/country-flag";
import {
  ReportPostDialog,
  type ReportPostTarget,
} from "@/components/report-post-dialog";
import { canBumpPost, formatPostAge } from "@/lib/post-bump";
import { getPostApprovalBadge } from "@/lib/post-approval-status";

interface PostFeedProps {
  activeTab: string;
}

const PAGE_SIZE = 10;
const SCROLL_ROOT_ID = "app-main-scroll";

function getScrollRoot(): HTMLElement | null {
  if (typeof document === "undefined") return null;
  return document.getElementById(SCROLL_ROOT_ID);
}

export function PostFeed({ activeTab }: PostFeedProps) {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [visibleMyCount, setVisibleMyCount] = useState(PAGE_SIZE);
  const [feedPosts, setFeedPosts] = useState<any[]>([]);
  const [feedHasMore, setFeedHasMore] = useState(true);
  const observerTarget = useRef<HTMLDivElement | null>(null);
  const loadingMoreRef = useRef(false);
  const blockCardNavigationRef = useRef(false);
  const { user, userId: authUserId, isAuthenticated } = useAppSelector((state) => state.auth);
  const currentUserId = user?._id || authUserId;
  const dispatch = useAppDispatch();

  // Queries
  const allPostsQuery = useGetAllPostsFeedQuery(
    { page, pageSize: PAGE_SIZE },
    { skip: activeTab !== "all" }
  );
  const myPostsQuery = useGetUserPostsQuery(user?._id || "", { skip: activeTab !== "my" || !user?._id });
  const { data: pinnedData } = useGetPinnedPostsQuery();

  // Mutations
  const [pinPost] = usePinPostMutation();
  const [unpinPost] = useUnpinPostMutation();
  const [deletePost, { isLoading: isDeletingPost }] = useDeletePostMutation();
  const [bumpPost, { isLoading: isBumpingPost }] = useBumpPostMutation();
  
  const chatBackendIsFirebase = useChatBackendIsFirebase();
  const { rooms: firebaseRooms } = useFirebaseChatRoomsContext();

  const { data: convData } = useGetConversationsQuery(user?._id || "", {
    skip: !user?._id || chatBackendIsFirebase,
  });

  const [linkedinGuardOpen, setLinkedinGuardOpen] = useState(false);
  const [linkedinGuardReason, setLinkedinGuardReason] = useState<
    "sender_not_verified" | "recipient_not_verified" | null
  >(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportTarget, setReportTarget] = useState<ReportPostTarget | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ _id: string } | null>(null);
  const [bumpOpen, setBumpOpen] = useState(false);
  const [bumpTarget, setBumpTarget] = useState<{
    _id: string;
    PostCreated?: string;
    BumpTime?: string | Date;
    isbumped?: boolean;
  } | null>(null);

  const openReportDialogForPost = (
    post: { userId: string; postContent?: string; userName?: string }
  ) => {
    blockCardNavigationRef.current = true;
    if (!isAuthenticated) {
      dispatch(openAuthModal());
      return;
    }
    setReportTarget({
      postAuthorUserId: String(post.userId),
      postContent: post.postContent || "",
      postUserName: post.userName || "Unknown",
    });
    setReportOpen(true);
  };

  const openDeleteDialogForPost = (post: { _id: string }) => {
    blockCardNavigationRef.current = true;
    if (!isAuthenticated) {
      dispatch(openAuthModal());
      return;
    }
    setDeleteTarget(post);
    setDeleteOpen(true);
  };

  const openBumpDialogForPost = (post: {
    _id: string;
    PostCreated?: string;
    BumpTime?: string | Date;
    isbumped?: boolean;
  }) => {
    blockCardNavigationRef.current = true;
    if (!isAuthenticated) {
      dispatch(openAuthModal());
      return;
    }
    if (!canBumpPost(post)) {
      toast.error("You can't bump the post before 24 hours");
      return;
    }
    setBumpTarget(post);
    setBumpOpen(true);
  };

  const handleDeletePost = async () => {
    if (!deleteTarget) return;
    try {
      await deletePost(deleteTarget._id).unwrap();
      toast.success("Post deleted successfully");
      setDeleteOpen(false);
      setDeleteTarget(null);
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "data" in err
          ? String((err as { data?: { message?: string } }).data?.message || "Failed to delete post")
          : "Failed to delete post";
      toast.error(message);
    }
  };

  const handleBumpPost = async () => {
    if (!bumpTarget) return;
    try {
      await bumpPost(bumpTarget._id).unwrap();
      toast.success("Post bumped successfully");
      setBumpOpen(false);
      setBumpTarget(null);
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "data" in err
          ? String((err as { data?: { message?: string } }).data?.message || "Failed to bump post")
          : "Failed to bump post";
      toast.error(message);
    }
  };

  const handleCardClick = (postId: string) => {
    if (blockCardNavigationRef.current) {
      blockCardNavigationRef.current = false;
      return;
    }
    router.push(`/post/${postId}`);
  };

  const handleStartChat = (
    e: React.MouseEvent,
    postUserId: string,
    authorLinkedinVerified?: boolean,
    authorIsAdmin?: boolean
  ) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      dispatch(openAuthModal());
      return;
    }
    if (isSelfChatPartner(user?._id, postUserId)) {
      toast.error("You cannot chat with yourself");
      return;
    }
    const blockReason = getLinkedinChatBlockReason(
      user?.isLinkedinVerified,
      authorLinkedinVerified,
      user?.role === "admin",
      authorIsAdmin
    );
    if (blockReason) {
      setLinkedinGuardReason(blockReason);
      setLinkedinGuardOpen(true);
      return;
    }
    const hasChat = chatBackendIsFirebase
      ? firebaseRooms.some((r) => r.partnerId === postUserId && r.isRequested === "accepted")
      : Boolean(convData?.conversations?.some((c) => c.id === postUserId));
    if (hasChat) {
      router.push(`/chats?userId=${postUserId}`);
    } else {
      dispatch(openConnectionModal(postUserId));
    }
  };

  const currentQuery = activeTab === "all" ? allPostsQuery : myPostsQuery;
  const rawMyPosts = myPostsQuery.data?.posts || [];

  useEffect(() => {
    setPage(1);
    setVisibleMyCount(PAGE_SIZE);
    setFeedPosts([]);
    setFeedHasMore(true);
    loadingMoreRef.current = false;
  }, [activeTab]);

  useEffect(() => {
    if (activeTab !== "all" || !allPostsQuery.data) return;
    const batch = allPostsQuery.data.posts || [];
    setFeedPosts((prev) => {
      if (page === 1) return batch;
      const seen = new Set(prev.map((p) => p._id));
      return [...prev, ...batch.filter((p) => !seen.has(p._id))];
    });
    setFeedHasMore(allPostsQuery.data.hasMore ?? batch.length >= PAGE_SIZE);
  }, [activeTab, allPostsQuery.data, page]);

  const posts = useMemo(() => {
    if (activeTab === "my") {
      return rawMyPosts.slice(0, visibleMyCount);
    }
    return feedPosts;
  }, [activeTab, feedPosts, rawMyPosts, visibleMyCount]);

  const hasMore = activeTab === "all" ? feedHasMore : rawMyPosts.length > visibleMyCount;

  const isLoading =
    posts.length === 0 &&
    (currentQuery.isLoading || currentQuery.isFetching) &&
    (activeTab === "all" ? page === 1 : true);
  const isFetching = currentQuery.isFetching;
  const error = currentQuery.error;

  useEffect(() => {
    if (!isFetching) {
      loadingMoreRef.current = false;
    }
  }, [isFetching]);

  useEffect(() => {
    const target = observerTarget.current;
    const scrollRoot = getScrollRoot();
    if (!target || !hasMore) return;

    const loadNextPage = () => {
      if (loadingMoreRef.current || isFetching || !hasMore) return;
      loadingMoreRef.current = true;
      if (activeTab === "all") {
        setPage((prev) => prev + 1);
      } else {
        setVisibleMyCount((prev) => prev + PAGE_SIZE);
        loadingMoreRef.current = false;
      }
    };

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          loadNextPage();
        }
      },
      { root: scrollRoot, threshold: 0, rootMargin: "200px" }
    );

    observer.observe(target);

    const onScroll = () => {
      const root = scrollRoot;
      if (!root) return;
      const targetRect = target.getBoundingClientRect();
      const rootRect = root.getBoundingClientRect();
      if (targetRect.top <= rootRect.bottom + 200) {
        loadNextPage();
      }
    };

    scrollRoot?.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      observer.disconnect();
      scrollRoot?.removeEventListener("scroll", onScroll);
    };
  }, [hasMore, isFetching, activeTab, posts.length]);

  const handlePin = async (postId: string) => {
    blockCardNavigationRef.current = true;
    try {
      await pinPost({ postId }).unwrap();
      toast.success("Post pinned successfully!");
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to pin post");
    }
  };

  const handleUnpin = async (postId: string) => {
    blockCardNavigationRef.current = true;
    const pinnedEntry = pinnedData?.posts?.find((p: any) => p.postId?._id === postId || p.postId === postId);
    if (!pinnedEntry) return;

    try {
      await unpinPost(pinnedEntry._id).unwrap();
      toast.success("Post unpinned successfully!");
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to unpin post");
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-[14px] h-[240px]" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-12 rounded-[14px] text-center col-span-full">
        <h3 className="text-[18px] font-bold text-red-600">Failed to load posts</h3>
        <p className="text-[#757575]">Please try again later.</p>
      </div>
    );
  }

  if (!isLoading && posts.length === 0) {
    return (
      <div className="bg-white p-12 rounded-[14px] text-center col-span-full">
        <h3 className="text-[18px] font-bold text-[#1A1A2E]">No posts yet</h3>
        <p className="text-[#757575]">
          {activeTab === "my" ? "You have not created any posts." : "Check back later for new posts."}
        </p>
      </div>
    );
  }

  return (
    <>
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {posts.map((post: any) => {
          const isOwner =
            !!currentUserId && String(currentUserId) === String(post.userId);
          const isAdmin = user?.role === "admin";
          const canPin = isAuthenticated && isAdmin;
          const isPinned = pinnedData?.posts?.some((p: any) => p.postId?._id === post._id || p.postId === post._id);
          const approvalBadge =
            activeTab === "my" ? getPostApprovalBadge(post) : null;

          return (
            <div 
              key={post._id} 
              onClick={() => handleCardClick(post._id)}
              className="bg-white rounded-[14px] p-4.5 shadow-[0_2px_8px_rgba(0,0,0,0.06)] flex flex-col h-full cursor-pointer hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)] transition-all border border-transparent hover:border-[#E0E0E0] relative"
            >
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <div 
                    className="w-11 h-11 rounded-full overflow-hidden shrink-0 border border-[#E0E0E0] cursor-pointer"
                    onClick={(e) => { e.stopPropagation(); router.push(`/profile/${post.userId}`); }}
                  >
                    <ImageWithFallback 
                      src={resolveUserProfileImageUrl({ profileImageUrl: post.profileImageUrl }, post.userName)} 
                      alt={post.userName} 
                      className="w-full h-full object-cover" 
                    />
                  </div>
                  <div className="flex flex-col min-w-0 flex-1">
                    <div 
                      className="flex items-center gap-1.5 min-w-0 cursor-pointer group/name"
                      onClick={(e) => { e.stopPropagation(); router.push(`/profile/${post.userId}`); }}
                    >
                      <span className="text-[14px] font-bold text-[#1A1A2E] truncate group-hover/name:text-[#0A7EA4] transition-colors">
                        {post.userName}
                      </span>
                      <div className="flex items-center gap-1 shrink-0">
                        {post.isGoogleVerified && (
                          <div className="w-3.5 h-3.5 rounded-full flex items-center justify-center" title="Google Verified">
                            <FcGoogle className="w-3 h-3" />
                          </div>
                        )}
                        {post.isLinkedinVerified && (
                          <div className="w-3.5 h-3.5 bg-[#0A66C2] rounded-[1px] flex items-center justify-center p-0.5" title="LinkedIn Verified">
                            <GrLinkedin className="w-full h-full text-white" />
                          </div>
                        )}
                        <CountryFlag flag={post.flag} size={14} />
                        {post.role === "admin" && (
                          <span className="bg-[#1A1A2E] text-white text-[8px] font-bold px-1.5 py-0.5 rounded-[4px] uppercase tracking-wider border border-white/10 shadow-sm">
                            Admin
                          </span>
                        )}
                        {isPinned && (
                          <FaThumbtack className="w-3 h-3 text-[#0A7EA4] rotate-45" title="Pinned" />
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-[12px] text-[#9E9E9E] leading-none">
                        {formatPostAge(post)}
                      </span>
                      {approvalBadge && (
                        <span
                          className={clsx(
                            "text-[10px] font-bold px-2 py-0.5 rounded-full border leading-none",
                            approvalBadge.className
                          )}
                        >
                          {approvalBadge.label}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div
                  className="flex items-center gap-1.5 shrink-0"
                  onClick={(e) => e.stopPropagation()}
                  onPointerDown={(e) => e.stopPropagation()}
                >
                  <span className={clsx(
                    "px-2.5 py-1 rounded-full text-[10px] font-medium shrink-0 uppercase whitespace-nowrap",
                    post.tag === "buy" && "bg-[#D1FAE5] text-[#065F46]",
                    post.tag === "sell" && "bg-[#FEF3C7] text-[#92400E]",
                    isGeneralPostType(post.tag) && "bg-[#E0F2F7] text-[#0A7EA4]"
                  )}>
                    {getPostTypeLabel(post.tag)}
                  </span>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          className="text-[#757575] p-1 hover:bg-[#F5F5F5] rounded-full transition-colors"
                          onClick={(e) => e.stopPropagation()}
                          onPointerDown={(e) => e.stopPropagation()}
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44">
                        <DropdownMenuItem 
                          onSelect={() => {
                            blockCardNavigationRef.current = true;
                            router.push(`/profile/${post.userId}`);
                          }}
                          className="cursor-pointer"
                        >
                          View Profile
                        </DropdownMenuItem>
                        {isOwner && (
                          <>
                            <DropdownMenuItem
                              onSelect={() => openBumpDialogForPost(post)}
                              className="cursor-pointer"
                            >
                              Bump up
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onSelect={() => openDeleteDialogForPost(post)}
                              className="cursor-pointer text-red-600 focus:text-red-600"
                            >
                              Delete Post
                            </DropdownMenuItem>
                          </>
                        )}
                        {!isOwner && (
                          <DropdownMenuItem
                            onSelect={() => openReportDialogForPost(post)}
                            className="cursor-pointer"
                          >
                            Report Post
                          </DropdownMenuItem>
                        )}
                        {canPin && (
                          <DropdownMenuItem 
                            onSelect={() => {
                              if (isPinned) {
                                handleUnpin(post._id);
                              } else {
                                handlePin(post._id);
                              }
                            }}
                            className="cursor-pointer"
                          >
                            <FaThumbtack className={clsx("w-3 h-3 mr-2", isPinned && "text-[#0A7EA4]")} />
                            {isPinned ? "Unpin Post" : "Pin Post"}
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                </div>
              </div>

              <p className="text-[14px] text-[#374151] leading-[1.6] mb-2 flex-1 line-clamp-3">
                {post.postContent}
              </p>
              <PostHashtags
                postDescription={post.postDescription}
                className="mb-3"
                maxTags={4}
                onTagClick={(e) => e.stopPropagation()}
              />
              <div className="pt-3 border-t border-[#F3F4F6] flex gap-2 mt-auto">
                <button 
                  onClick={(e) => handleStartChat(e, post.userId, post.isLinkedinVerified, post.role === "admin")}
                  className="flex-1 flex items-center justify-center gap-2 h-9 bg-[#0A7EA4] border border-[#0A7EA4] rounded-lg text-white text-[12px] font-medium hover:bg-[#086a8a] transition-colors shadow-sm"
                >
                  <MessageCircle className="w-4 h-4 text-white" />
                  <span>Start Chat</span>
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); }}
                  className="flex-1 flex items-center justify-center gap-2 h-9 border border-[#E0E0E0] rounded-lg text-[#3C3C3C] text-[12px] font-medium hover:bg-[#F5F5F5] transition-colors"
                >
                  <Share2 className="w-4 h-4 text-[#6B7280]" />
                  <span>Share Post</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div ref={observerTarget} className="h-12 flex items-center justify-center">
        {isFetching && posts.length > 0 && hasMore && (
          <div className="w-6 h-6 border-2 border-[#0A7EA4] border-t-transparent rounded-full animate-spin" />
        )}
      </div>
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



