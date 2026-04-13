"use client";
import { MoreVertical } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef } from "react";
import { Autoplay, Navigation, Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import { ImageWithFallback } from "./figma/ImageWithFallback";

// Import Swiper styles
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { useGetPinnedPostsQuery, useUnpinPostMutation } from "@/store/endpoints/posts";
import { useAppSelector } from "@/store/hooks";
import { formatDistanceToNow } from "date-fns";
import { FaGoogle, FaThumbtack } from "react-icons/fa";
import { GrLinkedin } from "react-icons/gr";
import { toast } from "sonner";

export function FeaturedPosts() {
  const router = useRouter();
  const swiperRef = useRef<any>(null);
  const { data, isLoading } = useGetPinnedPostsQuery();
  
  const { user } = useAppSelector((state) => state.auth);
  const [unpin] = useUnpinPostMutation();
  
  const pinnedPosts = data?.posts || [];
  const isAdmin = user?.role === "admin";

  const handleUnpin = async (e: React.MouseEvent, pinnedPostId: string) => {
    e.stopPropagation();
    try {
      await unpin(pinnedPostId).unwrap();
      toast.success("Post unpinned successfully!");
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to unpin post");
    }
  };

  if (isLoading) {
    return (
      <div className="h-[180px] bg-white rounded-[14px] flex items-center justify-center animate-pulse">
        <div className="w-8 h-8 border-2 border-[#0A7EA4] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (pinnedPosts.length === 0) {
    return null; // Don't show the section if no pinned posts
  }

  return (
    <div className="relative featured-posts-slider">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[20px] font-bold text-[#1A1A2E]">Featured (Pinned) Posts</h2>
      </div>

      <Swiper
        modules={[Navigation, Pagination, Autoplay]}
        spaceBetween={16}
        slidesPerView={1}
        pagination={{ 
          clickable: true,
          el: '.custom-pagination',
        }}
        autoplay={{
          delay: 5000,
          disableOnInteraction: false,
        }}
        onBeforeInit={(swiper) => {
          swiperRef.current = swiper;
        }}
        breakpoints={{
          640: { slidesPerView: 1.5 },
          768: { slidesPerView: 2 },
          1024: { slidesPerView: 3 },
        }}
        className="pb-10"
      >
        {pinnedPosts.map((post: any) => {
          // The BumperPost object (post) contains the cached content
          // The postId object contains the original post reference
          const originalId = post.postId?._id || post.postId || post._id;
          const content = post.postContent;
          const userName = post.userName;
          const profilePic = post.profileImageUrl;
          const tag = post.postId?.tag || post.tag;

          return (
            <SwiperSlide key={post._id}>
              <div
                className="bg-white rounded-[14px] border border-[#E0E0E0] shadow-[0_2px_8px_rgba(0,0,0,0.06)] p-4 h-full flex flex-col transition-all hover:border-[#0A7EA4] hover:shadow-[0_4px_12px_rgba(10,126,164,0.1)] cursor-pointer"
                onClick={() => router.push(`/post/${originalId}`)}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden border border-[#E0E0E0]">
                      <ImageWithFallback 
                        src={profilePic || `https://ui-avatars.com/api/?name=${userName}&background=0A7EA4&color=fff`} 
                        alt={userName} 
                        className="w-full h-full object-cover" 
                      />
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#1A1A2E] leading-none text-[13px]">{userName}</span>
                        <div className="flex items-center gap-1.5 min-w-0">
                          {post.postId?.isGoogleVerified && (
                            <div className="w-3.5 h-3.5 rounded-full flex items-center justify-center" title="Google Verified">
                              <FaGoogle className="w-2.5 h-2.5 text-[#4285F4]" />
                            </div>
                          )}
                          {post.postId?.isLinkedinVerified && (
                            <div className="w-3.5 h-3.5 bg-[#0A66C2] rounded-[1px] flex items-center justify-center p-0.5" title="LinkedIn Verified">
                              <GrLinkedin className="w-full h-full text-white" />
                            </div>
                          )}
                        </div>
                        {post.underApproval && (
                          <span className="bg-[#FEF3C7] text-[#92400E] text-[9px] font-bold px-1.5 py-0.5 rounded-full border border-[#FDE68A] ml-1 shrink-0">
                            Pending
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-[#757575]">
                        Pinned • {post.PostCreated ? formatDistanceToNow(new Date(post.PostCreated), { addSuffix: true }) : "recently"}
                      </span>
                    </div>
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <button className="p-1 text-[#757575] hover:bg-[#F5F5F5] rounded-full transition-colors">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      <DropdownMenuItem className="cursor-pointer">
                        View Profile
                      </DropdownMenuItem>
                      {(isAdmin || post.userId === user?._id) && (
                        <DropdownMenuItem 
                          onClick={(e) => handleUnpin(e as any, post._id)}
                          className="cursor-pointer text-red-600"
                        >
                          <FaThumbtack className="w-3 h-3 mr-2" />
                          Unpin Post
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                
                <h3 className="text-[#1A1A2E]  mb-3 flex-1 min-h-[40px] text-[12px] ">
                  {content}
                </h3>

                <div className="flex flex-wrap gap-2">
                   {tag !== "blank" && tag && (
                    <span className="text-[#0A7EA4] text-[12px] font-medium uppercase">
                      #{tag}
                    </span>
                  )}
                  <span className="text-[#0A7EA4] text-[12px] hover:underline cursor-pointer">
                    #affiliatemarketing
                  </span>
                </div>
              </div>
            </SwiperSlide>
          );
        })}
      </Swiper>

      <div className="custom-pagination flex justify-center gap-2 mt-2" />

      <style dangerouslySetInnerHTML={{ __html: `
        .featured-posts-slider .swiper-pagination-bullet {
          width: 8px;
          height: 8px;
          background: #D0D0D0;
          opacity: 1;
          margin: 0 4px !important;
        }
        .featured-posts-slider .swiper-pagination-bullet-active {
          background: #0A7EA4;
        }
        .featured-posts-slider .swiper-slide {
          height: auto;
        }
      `}} />
    </div>
  );
}

