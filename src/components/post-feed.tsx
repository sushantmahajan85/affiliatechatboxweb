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
  useGetAllPostsQuery,
  useGetPinnedPostsQuery,
  useGetUserPostsQuery,
  usePinPostMutation,
  useUnpinPostMutation
} from "@/store/endpoints/posts";
import { useAppSelector } from "@/store/hooks";
import { formatDistanceToNow } from "date-fns";
import { useEffect, useRef, useState } from "react";
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

export function PostFeed({ activeTab }: PostFeedProps) {
  const router = useRouter();
  const [limit, setLimit] = useState(10);
  const observerTarget = useRef(null);
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);

  // Queries
  const allPostsQuery = useGetAllPostsQuery(limit, { skip: activeTab !== "all" });
  const myPostsQuery = useGetUserPostsQuery(user?._id || "", { skip: activeTab !== "my" || !user?._id });
  const { data: pinnedData } = useGetPinnedPostsQuery();

  // Mutations
  const [pinPost] = usePinPostMutation();
  const [unpinPost] = useUnpinPostMutation();

  const currentQuery = activeTab === "all" ? allPostsQuery : myPostsQuery;
  const posts = currentQuery.data?.posts || [];
  const isLoading = currentQuery.isLoading;
  const error = currentQuery.error;

  // Infinite Scroll Observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && posts.length >= limit) {
          setLimit((prev) => prev + 10);
        }
      },
      { threshold: 1.0 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [posts.length, limit]);

  // Reset limit when switching tabs
  useEffect(() => {
    setLimit(10);
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

  if (isLoading && limit === 10) {
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

  return (
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
                  <div className="w-11 h-11 rounded-full overflow-hidden shrink-0 border border-[#E0E0E0]">
                    <ImageWithFallback 
                      src={post.profileImageUrl || `https://ui-avatars.com/api/?name=${post.userName}&background=0A7EA4&color=fff`} 
                      alt={post.userName} 
                      className="w-full h-full object-cover" 
                    />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-[14px] font-bold text-[#1A1A2E] truncate">{post.userName}</span>
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
                      <DropdownMenuItem className="cursor-pointer">
                        View Profile
                      </DropdownMenuItem>
                      <DropdownMenuItem className="cursor-pointer">
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

              <p className="text-[14px] text-[#374151] leading-[1.6] mb-3 flex-1 line-clamp-3">
                {post.postContent}
              </p>

              <div className="flex flex-wrap gap-1.5 mb-4">
                {post.tag !== "blank" && (
                  <span className="text-[#0A7EA4] text-[13px] hover:underline cursor-pointer font-medium">
                    #{post.tag}
                  </span>
                )}
                <span className="text-[#0A7EA4] text-[13px] hover:underline cursor-pointer">#affiliatemarketing</span>
              </div>

              <div className="pt-3 border-t border-[#F3F4F6] flex gap-2">
                <button 
                  onClick={(e) => { e.stopPropagation(); }}
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

      {/* Infinite Scroll target */}
      <div ref={observerTarget} className="h-10 flex items-center justify-center">
        {currentQuery.isFetching && posts.length > 0 && (
          <div className="w-6 h-6 border-2 border-[#0A7EA4] border-t-transparent rounded-full animate-spin" />
        )}
      </div>
    </div>
  );
}



