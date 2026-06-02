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
import { resolveUserProfileImageUrl } from "@/lib/user-profile-image";
import { PostHashtags } from "@/components/post-hashtags";
import { formatDistanceToNow } from "date-fns";
import { useEffect, useMemo, useRef, useState } from "react";
import { FaThumbtack } from "react-icons/fa";
import { GrLinkedin } from "react-icons/gr";
import { toast } from "sonner";

// Helper to convert country code (e.g., "IN") to flag emoji
const getFlagEmoji = (countryCode: string) => {
  if (!countryCode || countryCode.length !== 2) return countryCode;
  const codePoints = countryCode
    .toUpperCase()
    .split("")
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
};

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
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
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
  
  const chatBackendIsFirebase = useChatBackendIsFirebase();
  const { rooms: firebaseRooms } = useFirebaseChatRoomsContext();

  const { data: convData } = useGetConversationsQuery(user?._id || "", {
    skip: !user?._id || chatBackendIsFirebase,
  });

  const [linkedinGuardOpen, setLinkedinGuardOpen] = useState(false);
  const [linkedinGuardReason, setLinkedinGuardReason] = useState<
    "sender_not_verified" | "recipient_not_verified" | null
  >(null);

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

  const isLoading = currentQuery.isLoading && (activeTab === "all" ? page === 1 : true);
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

  useEffect(() => {
    setPage(1);
    setVisibleMyCount(PAGE_SIZE);
    setFeedPosts([]);
    setFeedHasMore(true);
    loadingMoreRef.current = false;
  }, [activeTab]);

  const handlePin = async (e: React.MouseEvent, postId: string) => {
    e.stopPropagation();
    try {
      await pinPost({ postId }).unwrap();
      toast.success("Post pinned successfully!");
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to pin post");
    }
  };

  const handleUnpin = async (e: React.MouseEvent, postId: string) => {
    e.stopPropagation();
    // Find the BumperPost ID for this postId
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
          const isOwner = user?._id === post.userId;
          const isAdmin = user?.role === "admin";
          const canManagePin = isAuthenticated && (isOwner || isAdmin);
          const isPinned = pinnedData?.posts?.some((p: any) => p.postId?._id === post._id || p.postId === post._id);

          return (
            <div 
              key={post._id} 
              onClick={() => router.push(`/post/${post._id}`)}
              className="bg-white rounded-[14px] p-4.5 shadow-[0_2px_8px_rgba(0,0,0,0.06)] flex flex-col h-full cursor-pointer hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)] transition-all border border-transparent hover:border-[#E0E0E0] relative"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
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
                  <div className="flex flex-col min-w-0">
                    <div 
                      className="flex items-center gap-1.5 min-w-0 cursor-pointer group/name"
                      onClick={(e) => { e.stopPropagation(); router.push(`/profile/${post.userId}`); }}
                    >
                      <span className="text-[14px] font-bold text-[#1A1A2E] truncate group-hover/name:text-[#0A7EA4] transition-colors">{post.userName}</span>
                      <div className="flex items-center gap-1.5 shrink-0">
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
                        <div className="text-[14px] ml-0.5" title={post.flag}>
                          {getFlagEmoji(post.flag)}
                        </div>
                        {post.role === "admin" && (
                          <span className="bg-[#1A1A2E] text-white text-[8px] font-bold px-1.5 py-0.5 rounded-[4px] uppercase tracking-wider border border-white/10 shadow-sm ml-0.5">
                            Admin
                          </span>
                        )}
                        {isPinned && (
                          <FaThumbtack className="w-3 h-3 text-[#0A7EA4] rotate-45" title="Pinned" />
                        )}
                        {post.underApproval && (
                          <span className="bg-[#FEF3C7] text-[#92400E] text-[10px] font-bold px-2 py-0.5 rounded-full border border-[#FDE68A] ml-1 shrink-0">
                            Pending
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-[12px] text-[#9E9E9E]">
                      {post.BumpTime ? formatDistanceToNow(new Date(post.BumpTime), { addSuffix: true }) : "recently"}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={clsx(
                    "px-3 py-1 rounded-full text-[11px] font-medium shrink-0 uppercase",
                    post.tag === "buy" && "bg-[#D1FAE5] text-[#065F46]",
                    post.tag === "sell" && "bg-[#FEF3C7] text-[#92400E]",
                    (post.tag === "blank" || !post.tag) && "bg-[#E0F2F7] text-[#0A7EA4]"
                  )}>
                    {post.tag === "blank" || !post.tag ? "General" : post.tag}
                  </span>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <button className="text-[#757575] p-1 hover:bg-[#F5F5F5] rounded-full transition-colors">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      <DropdownMenuItem 
                        onClick={(e) => { e.stopPropagation(); router.push(`/profile/${post.userId}`); }}
                        className="cursor-pointer"
                      >
                        View Profile
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={(e) => { e.stopPropagation(); !isAuthenticated && dispatch(openAuthModal()); }}
                        className="cursor-pointer"
                      >
                        Report Post
                      </DropdownMenuItem>
                      {canManagePin && (
                        <DropdownMenuItem 
                          onClick={(e) => isPinned ? handleUnpin(e as any, post._id) : handlePin(e as any, post._id)}
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
    <LinkedinChatGuardDialog
      open={linkedinGuardOpen}
      onOpenChange={setLinkedinGuardOpen}
      reason={linkedinGuardReason}
    />
    </>
  );
}



