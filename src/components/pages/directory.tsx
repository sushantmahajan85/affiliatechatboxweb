"use client";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";
import { useGetAllUsersQuery } from "@/store/endpoints/members";
import { clsx } from "clsx";
import { ChevronLeft, ChevronRight, MapPin, MessageCircle, Search } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FaGoogle } from "react-icons/fa";
import { GrLinkedin } from "react-icons/gr";
import { useAppDispatch } from "@/store/hooks";
import { openConnectionModal } from "@/store/uiSlice";

// Helper to convert country code (e.g., "IN") to flag emoji
const getFlagEmoji = (countryCode: string) => {
  if (!countryCode || countryCode.length !== 2) return countryCode;
  const codePoints = countryCode
    .toUpperCase()
    .split("")
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
};

import { useAppSelector } from "@/store/hooks";
import { useGetConversationsQuery } from "@/store/endpoints/chats";

export function DirectoryPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user: currentUser } = useAppSelector((state) => state.auth);
  
  const { data: convData } = useGetConversationsQuery(currentUser?._id || "", {
    skip: !currentUser?._id,
  });

  const handleStartChat = (memberId: string) => {
    if (!currentUser) {
      // Not logged in, can't chat
      return;
    }
    const hasChat = convData?.conversations?.some(c => c.id === memberId);
    if (hasChat) {
      router.push(`/chats?userId=${memberId}`);
    } else {
      dispatch(openConnectionModal(memberId));
    }
  };

  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const itemsPerPage = 8;

  const { data, isLoading: isApiLoading, error } = useGetAllUsersQuery();
  
  // Map backend users to local format
  const rawUsers = data?.users || [];
  const members = rawUsers.map((u: any) => ({
    id: u._id,
    name: `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.email || "Unnamed User",
    avatar: u.profileImageUrl || `https://ui-avatars.com/api/?name=${u.firstName || "U"}+${u.lastName || "U"}&background=0A7EA4&color=fff`,
    country: u.country || "Global",
    // Use helper if it looks like a country code, otherwise use as is
    flag: u.flag?.length === 2 ? getFlagEmoji(u.flag) : (u.flag || "🌐"),
    isGoogleVerified: u.isGoogleVerified || false,
    isLinkedinVerified: u.isLinkedinVerified || false,
    verified: u.isverified || false,
    email: u.email
  }));

  const filteredMembers = members.filter((member: any) => 
    member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.country.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filteredMembers.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentMembers = filteredMembers.slice(indexOfFirstItem, indexOfLastItem);

  if (isApiLoading) {
    return (
      <div className="flex flex-col gap-6 animate-pulse">
        <div className="bg-white p-6 rounded-[14px] h-[100px]" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="bg-white rounded-[14px] h-[240px]" />)}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-12 rounded-[14px] text-center">
        <h3 className="text-[18px] font-bold text-red-600">Failed to load members</h3>
        <p className="text-[#757575]">Please try again later or check your connection.</p>
      </div>
    );
  }

  // Pagination logic helper
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) pageNumbers.push(i);
    } else {
      pageNumbers.push(1);
      if (currentPage > 3) pageNumbers.push("...");
      
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      
      for (let i = start; i <= end; i++) pageNumbers.push(i);
      
      if (currentPage < totalPages - 2) pageNumbers.push("...");
      pageNumbers.push(totalPages);
    }
    return pageNumbers;
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Search Header */}
      <div className="bg-white p-6 rounded-[14px] shadow-[0_2px_8px_rgba(0,0,0,0.06)] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-[24px] font-bold text-[#1A1A2E]">Members Directory</h1>
          <p className="text-[#757575] text-[14px]">Connect with {members?.length} professionals globally</p>
        </div>
        <div className="relative w-full md:w-[320px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9E9E9E]" />
          <input 
            type="text"
            placeholder="Search by name or country..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full h-11 bg-[#F5F7FB] border-none rounded-xl pl-10 pr-4 text-[14px] focus:ring-2 focus:ring-[#0A7EA4]/20 outline-none transition-all"
          />
        </div>
      </div>

      {/* Grid of Member Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <AnimatePresence mode="popLayout">
          {currentMembers.map((member: any) => (
            <motion.div 
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              key={member.id} 
              className="bg-white rounded-[14px] p-5 shadow-[0_2px_8px_rgba(0,0,0,0.06)] flex flex-col items-center text-center hover:shadow-[0_4px_16px_rgba(0,0,0,0.1)] transition-all group border border-transparent hover:border-[#F0F7F9]"
            >
              <div 
                className="relative mb-4 cursor-pointer"
                onClick={() => router.push(`/profile/${member.id}`)}
              >
                <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-white ring-2 ring-[#F3F4F6] group-hover:ring-[#0A7EA4]/20 transition-all">
                  <ImageWithFallback src={member.avatar} alt={member.name} className="w-full h-full object-cover" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm border border-[#F3F4F6] text-[18px]" title={member.country}>
                  {member.flag}
                </div>
              </div>

              <div className="flex items-center gap-1.5 mb-1 cursor-pointer" onClick={() => router.push(`/profile/${member.id}`)}>
                <h3 className="text-[16px] font-bold text-[#1A1A2E] line-clamp-1 hover:text-[#0A7EA4] transition-colors">{member.name}</h3>
                <div className="flex items-center gap-1">
                  {member.isGoogleVerified && (
                    <div className="w-4 h-4 rounded-full flex items-center justify-center shadow-sm" title="Google Verified">
                      <FaGoogle className="w-2.5 h-2.5 text-[#4285F4]" />
                    </div>
                  )}
                  {member.isLinkedinVerified && (
                    <div className="w-4 h-4 bg-[#0A66C2] rounded-[2px] flex items-center justify-center shadow-sm" title="LinkedIn Verified">
                      <GrLinkedin className="w-2.5 h-2.5 text-white" />
                    </div>
                  )}
                </div>
              </div>
              <p className="text-[13px] text-[#757575] mb-4 h-5 flex items-center gap-1 justify-center">
                <MapPin className="w-3 h-3" />
                {member.country}
              </p>

              <div className="w-full pt-4 border-t border-[#F3F4F6]">
                <button 
                  onClick={() => handleStartChat(member.id)}
                  className="w-full flex items-center justify-center gap-2 h-10 bg-[#0A7EA4] text-white rounded-xl text-[13px] font-bold hover:bg-[#086a8a] transition-all shadow-sm active:scale-95"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Start Chat</span>
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4 pb-10">
          <button 
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            className="w-10 h-10 rounded-xl border border-[#E0E0E0] flex items-center justify-center text-[#757575] hover:bg-[#F5F5F5] disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-90"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-1">
            {getPageNumbers().map((page, i) => (
              page === "..." ? (
                <span key={`ellipsis-${i}`} className="w-10 h-10 flex items-center justify-center text-[#BDBDBD]">
                  ...
                </span>
              ) : (
                <button
                  key={`page-${page}`}
                  onClick={() => setCurrentPage(Number(page))}
                  className={clsx(
                    "w-10 h-10 rounded-xl text-[14px] font-bold transition-all active:scale-90",
                    currentPage === page 
                      ? "bg-[#0A7EA4] text-white shadow-md shadow-[#0A7EA4]/20" 
                      : "text-[#757575] hover:bg-[#F5F5F5] border border-transparent hover:border-[#E0E0E0]"
                  )}
                >
                  {page}
                </button>
              )
            ))}
          </div>

          <button 
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            className="w-10 h-10 rounded-xl border border-[#E0E0E0] flex items-center justify-center text-[#757575] hover:bg-[#F5F5F5] disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-90"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}

      {filteredMembers.length === 0 && (
        <div className="bg-white p-12 rounded-[14px] shadow-[0_2px_8px_rgba(0,0,0,0.06)] text-center flex flex-col items-center">
          <div className="w-16 h-16 bg-[#F5F7FB] rounded-full flex items-center justify-center mb-4">
            <Search className="w-8 h-8 text-[#9E9E9E]" />
          </div>
          <h3 className="text-[18px] font-bold text-[#1A1A2E]">No members found</h3>
          <p className="text-[#757575]">Try adjusting your search criteria</p>
        </div>
      )}
    </div>
  );
}



