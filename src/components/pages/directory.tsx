"use client";
import { LinkedinRecipientNotVerifiedDialog } from "@/components/linkedin-chat-guard-dialog";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";
import { CountryFlag } from "@/components/country-flag";
import { useAppInfiniteScroll } from "@/hooks/use-app-infinite-scroll";
import { countryLabelFromFlag } from "@/lib/country-flag";
import { useGetMembersDirectoryFeedQuery } from "@/store/endpoints/members";
import { MessageCircle, Search } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FaGoogle } from "react-icons/fa";
import { GrLinkedin } from "react-icons/gr";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { openAuthModal, openConnectionModal } from "@/store/uiSlice";
import { useGetConversationsQuery } from "@/store/endpoints/chats";
import { useFirebaseChatRoomsContext, useChatBackendIsFirebase } from "@/context/FirebaseChatRoomsProvider";
import { isLinkedinOnlyChatBlocked } from "@/lib/linkedin-messaging";
import { resolveUserProfileImageUrl } from "@/lib/user-profile-image";

const PAGE_SIZE = 12;

type DirectoryUserRow = {
  _id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  flag?: string;
  isGoogleVerified?: boolean;
  isLinkedinVerified?: boolean;
  isverified?: boolean;
};

type DirectoryMember = {
  id: string;
  name: string;
  avatar: string;
  country: string;
  flag: string;
  isGoogleVerified: boolean;
  isLinkedinVerified: boolean;
  verified: boolean;
  email?: string;
};

function mapUserToMember(u: DirectoryUserRow): DirectoryMember {
  return {
    id: u._id,
    name: `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.email || "Unnamed User",
    avatar: resolveUserProfileImageUrl(u, `${u.firstName || "U"} ${u.lastName || "U"}`),
    country: countryLabelFromFlag(u.flag),
    flag: u.flag || "",
    isGoogleVerified: u.isGoogleVerified || false,
    isLinkedinVerified: u.isLinkedinVerified || false,
    verified: u.isverified || false,
    email: u.email,
  };
}

export function DirectoryPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user: currentUser } = useAppSelector((state) => state.auth);
  const chatBackendIsFirebase = useChatBackendIsFirebase();
  const { rooms: firebaseRooms } = useFirebaseChatRoomsContext();

  const { data: convData } = useGetConversationsQuery(currentUser?._id || "", {
    skip: !currentUser?._id || chatBackendIsFirebase,
  });

  const [linkedinGuardOpen, setLinkedinGuardOpen] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [rawUsers, setRawUsers] = useState<DirectoryUserRow[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setSearchQuery(searchInput.trim()), 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
    setRawUsers([]);
    setHasMore(true);
    setTotal(0);
  }, [searchQuery]);

  const { data, isLoading, isFetching, isError } = useGetMembersDirectoryFeedQuery({
    page,
    limit: PAGE_SIZE,
    search: searchQuery,
  });

  useEffect(() => {
    if (!data) return;
    const batch = (data.users || []) as DirectoryUserRow[];
    setRawUsers((prev) => {
      if (page === 1) return batch;
      const seen = new Set(prev.map((u) => u._id));
      return [...prev, ...batch.filter((u) => !seen.has(u._id))];
    });
    setHasMore(data.pagination?.hasMore ?? batch.length >= PAGE_SIZE);
    setTotal(data.pagination?.total ?? 0);
  }, [data, page]);

  const members = useMemo(() => rawUsers.map(mapUserToMember), [rawUsers]);

  const loadMore = useCallback(() => {
    setPage((prev) => prev + 1);
  }, []);

  const { observerTarget } = useAppInfiniteScroll({
    hasMore,
    isFetching,
    onLoadMore: loadMore,
    enabled: members.length > 0,
  });

  const handleStartChat = (memberId: string, memberLinkedinVerified: boolean) => {
    if (!currentUser) {
      dispatch(openAuthModal());
      return;
    }
    if (
      isLinkedinOnlyChatBlocked(
        currentUser.isLinkedinVerified,
        memberLinkedinVerified,
        currentUser.role === "admin"
      )
    ) {
      setLinkedinGuardOpen(true);
      return;
    }
    const hasChat = chatBackendIsFirebase
      ? firebaseRooms.some((r) => r.partnerId === memberId && r.isRequested === "accepted")
      : Boolean(convData?.conversations?.some((c) => c.id === memberId));
    if (hasChat) {
      router.push(`/chats?userId=${memberId}`);
    } else {
      dispatch(openConnectionModal(memberId));
    }
  };

  const showInitialLoading = members.length === 0 && (isLoading || isFetching) && page === 1;

  if (showInitialLoading) {
    return (
      <div className="flex flex-col gap-6 animate-pulse">
        <div className="bg-white p-6 rounded-[14px] h-[100px]" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-[14px] h-[240px]" />
          ))}
        </div>
      </div>
    );
  }

  if (isError && members.length === 0) {
    return (
      <div className="bg-white p-12 rounded-[14px] text-center">
        <h3 className="text-[18px] font-bold text-red-600">Failed to load members</h3>
        <p className="text-[#757575]">Please try again later or check your connection.</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-6">
        <div className="bg-white p-6 rounded-[14px] shadow-[0_2px_8px_rgba(0,0,0,0.06)] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-[24px] font-bold text-[#1A1A2E]">Members Directory</h1>
            <p className="text-[#757575] text-[14px]">
              Connect with {total > 0 ? total : members.length} professionals globally
            </p>
          </div>
          <div className="relative w-full md:w-[320px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9E9E9E]" />
            <input
              type="text"
              placeholder="Search by name, email, or country code..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full h-11 bg-[#F5F7FB] border-none rounded-xl pl-10 pr-4 text-[14px] focus:ring-2 focus:ring-[#0A7EA4]/20 outline-none transition-all"
            />
          </div>
        </div>

        {members.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <AnimatePresence mode="popLayout">
              {members.map((member) => (
                <motion.div
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  key={member.id}
                  className="bg-white rounded-[14px] p-5 shadow-[0_2px_8px_rgba(0,0,0,0.06)] flex flex-col items-center text-center hover:shadow-[0_4px_16px_rgba(0,0,0,0.1)] transition-all group border border-transparent hover:border-[#F0F7F9]"
                >
                  <div
                    className="mb-4 cursor-pointer"
                    onClick={() => router.push(`/profile/${member.id}`)}
                  >
                    <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-white ring-2 ring-[#F3F4F6] group-hover:ring-[#0A7EA4]/20 transition-all mx-auto">
                      <ImageWithFallback
                        src={member.avatar}
                        alt={member.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>

                  <div
                    className="flex items-center gap-1.5 mb-1 cursor-pointer"
                    onClick={() => router.push(`/profile/${member.id}`)}
                  >
                    <h3 className="text-[16px] font-bold text-[#1A1A2E] line-clamp-1 hover:text-[#0A7EA4] transition-colors">
                      {member.name}
                    </h3>
                    <div className="flex items-center gap-1">
                      {member.isGoogleVerified && (
                        <div
                          className="w-4 h-4 rounded-full flex items-center justify-center shadow-sm"
                          title="Google Verified"
                        >
                          <FaGoogle className="w-2.5 h-2.5 text-[#4285F4]" />
                        </div>
                      )}
                      {member.isLinkedinVerified && (
                        <div
                          className="w-4 h-4 bg-[#0A66C2] rounded-[2px] flex items-center justify-center shadow-sm"
                          title="LinkedIn Verified"
                        >
                          <GrLinkedin className="w-2.5 h-2.5 text-white" />
                        </div>
                      )}
                    </div>
                  </div>
                  <p className="text-[13px] text-[#757575] mb-4 flex items-center gap-1.5 justify-center min-h-5">
                    <CountryFlag flag={member.flag} size={14} title={member.country} />
                    <span className="truncate max-w-[140px]">{member.country}</span>
                  </p>

                  <div className="w-full pt-4 border-t border-[#F3F4F6]">
                    <button
                      onClick={() => handleStartChat(member.id, member.isLinkedinVerified)}
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
        )}

        {members.length === 0 && !isError && (
          <div className="bg-white p-12 rounded-[14px] shadow-[0_2px_8px_rgba(0,0,0,0.06)] text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-[#F5F7FB] rounded-full flex items-center justify-center mb-4">
              <Search className="w-8 h-8 text-[#9E9E9E]" />
            </div>
            <h3 className="text-[18px] font-bold text-[#1A1A2E]">No members found</h3>
            <p className="text-[#757575]">Try adjusting your search criteria</p>
          </div>
        )}

        <div ref={observerTarget} className="h-12 flex items-center justify-center pb-6">
          {isFetching && members.length > 0 && hasMore && (
            <div className="w-6 h-6 border-2 border-[#0A7EA4] border-t-transparent rounded-full animate-spin" />
          )}
        </div>
      </div>

      <LinkedinRecipientNotVerifiedDialog
        open={linkedinGuardOpen}
        onOpenChange={setLinkedinGuardOpen}
      />
    </>
  );
}
