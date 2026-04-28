"use client";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { openAuthModal } from "@/store/uiSlice";
import { clsx } from "clsx";
import { ArrowLeft, Flag, MessageCircle, MoreVertical, Share2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";

// Mock data (in a real app, this would be fetched based on id)
const POSTS = [
  {
    id: 1,
    author: "Alex Johnson",
    time: "Posted now",
    avatar: "https://images.unsplash.com/photo-1672685667592-0392f458f46f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBtYW4lMjBoZWFkc2hvdCUyMHBvcnRyYWl0fGVufDF8fHx8MTc3NDU4NzY5OXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    type: "Buy",
    content: "Wresure your ROI is trenthen affiliate strategies for both and we wan consend you sure convernang the company's it idea toint.",
    tags: ["#affiliatemarketing", "#ROI"],
    isGoogleVerified: true,
    isLinkedinVerified: true
  },
  {
    id: 2,
    author: "Alex Johnson",
    time: "Posted 3d ago",
    avatar: "https://images.unsplash.com/photo-1672685667592-0392f458f46f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBtYW4lMjBoZWFkc2hvdCUyMHBvcnRyYWl0fGVufDF8fHx8MTc3NDU4NzY5OXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    type: "Sell",
    content: "Maximize your Hilllitmure affiliate products of proven affiliate strategies for just and more minnts in oune community.",
    tags: ["#affiliatemarketing", "#strategies"],
    isGoogleVerified: true,
    isLinkedinVerified: true
  },
  {
    id: 3,
    author: "Sarah Miller",
    time: "Posted 1d ago",
    avatar: "https://images.unsplash.com/photo-1610387694365-19fafcc86d86?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxidXNpbmVzcyUyMG9mZmljZSUyMHByb2Zlc3Npb25hbCUyMHdvbWFuJTIwcG9ydHJhaXR8ZW58MXx8fHwxNzc0NjAxMzA3fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    type: "General",
    content: "Looking for recommendations on the best affiliate networks for high-ticket SaaS products. Any insights?",
    tags: ["#SaaS", "#AffiliateNetworks"],
    isGoogleVerified: true,
    isLinkedinVerified: false
  },
  {
    id: 4,
    author: "James Wilson",
    time: "Posted 5h ago",
    avatar: "https://images.unsplash.com/photo-1742119971773-57e0131095b0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdWNjZXNzZnVsJTIwZW50cmVwcmVuZXVyJTIwbWFuJTIwcG9ydHJhaXR8ZW58MXx8fHwxNzc0NjAxMzA3fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    type: "Buy",
    content: "I'm interested in buying traffic for finance-related offers in the UK and Canada. DM if you have quality sources.",
    tags: ["#Traffic", "#FinanceOffers"],
    isGoogleVerified: false,
    isLinkedinVerified: true
  }
];

import { useGetPostByIdQuery } from "@/store/endpoints/posts";
import { formatDistanceToNow } from "date-fns";
import { FaGoogle } from "react-icons/fa";
import { GrLinkedin } from "react-icons/gr";

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
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const { data, isLoading, error } = useGetPostByIdQuery(id as string);

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
    <div className="bg-white rounded-[14px] shadow-[0_2px_8px_rgba(0,0,0,0.06)] overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-[#E0E0E0] flex items-center justify-between">
        <button 
          onClick={() => router.back()}
          className="flex items-center gap-2 text-[#757575] hover:text-[#1A1A2E] transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium text-[15px]">Back to feed</span>
        </button>
        <div className="flex items-center gap-2">
           <button className="p-2 text-[#757575] hover:bg-[#F5F5F5] rounded-full transition-colors" title="Report">
            <Flag className="w-5 h-5" />
          </button>
          <button className="p-2 text-[#757575] hover:bg-[#F5F5F5] rounded-full transition-colors">
            <MoreVertical className="w-5 h-5" />
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
                src={post.profileImageUrl || `https://ui-avatars.com/api/?name=${post.userName}&background=0A7EA4&color=fff`} 
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
                        <GrLinkedin className="w-full h-full text-white" />
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
            onClick={() => {
              if (!isAuthenticated) {
                dispatch(openAuthModal());
                return;
              }
              router.push(`/chats?userId=${post.userId}`);
            }}
            className="flex-1 flex items-center justify-center gap-2 h-11 bg-[#0A7EA4] text-white rounded-xl text-[15px] font-bold hover:bg-[#086a8a] transition-colors shadow-sm"
          >
            <MessageCircle className="w-5 h-5" />
            <span>Start Chat</span>
          </button>
          <button className="flex-1 flex items-center justify-center gap-2 h-11 border border-[#E0E0E0] rounded-xl text-[#3C3C3C] text-[15px] font-medium hover:bg-[#F5F5F5] transition-colors">
            <Share2 className="w-5 h-5 text-[#6B7280]" />
            <span>Share Post</span>
          </button>
          <button className="sm:w-auto px-6 flex items-center justify-center gap-2 h-11 border border-[#E0E0E0] rounded-xl text-[#EF4444] text-[15px] font-medium hover:bg-[#FEF2F2] transition-colors">
            <Flag className="w-5 h-5" />
            <span className="sm:hidden lg:inline">Report Post</span>
          </button>
        </div>
      </div>
    </div>
  );
}




