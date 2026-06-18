"use client";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";
import {
  getPartnerTitle,
  PartnerDetailDialog,
  shouldShowPartnerSeeMore,
} from "@/components/partner-detail-dialog";
import { useAppInfiniteScroll } from "@/hooks/use-app-infinite-scroll";
import { Partner, useGetPartnersFeedQuery } from "@/store/endpoints/partners";
import { AnimatePresence, motion } from "motion/react";
import { Handshake, Search } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

const PAGE_SIZE = 9;

export function PartnersPage() {
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);
  const [detailPartner, setDetailPartner] = useState<Partner | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const openPartnerDetail = (partner: Partner) => {
    setDetailPartner(partner);
    setDetailOpen(true);
  };

  useEffect(() => {
    const timer = setTimeout(() => setSearchQuery(searchInput.trim()), 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
    setPartners([]);
    setHasMore(true);
    setTotal(0);
  }, [searchQuery]);

  const { data, isLoading, isFetching, isError } = useGetPartnersFeedQuery({
    page,
    pageSize: PAGE_SIZE,
    search: searchQuery,
  });

  useEffect(() => {
    if (!data) return;
    const batch = data.allpartners || [];
    setPartners((prev) => {
      if (page === 1) return batch;
      const seen = new Set(prev.map((p) => p._id));
      return [...prev, ...batch.filter((p) => !seen.has(p._id))];
    });
    setHasMore(data.hasMore ?? batch.length >= PAGE_SIZE);
    setTotal(data.total ?? 0);
  }, [data, page]);

  const loadMore = useCallback(() => {
    setPage((prev) => prev + 1);
  }, []);

  const { observerTarget } = useAppInfiniteScroll({
    hasMore,
    isFetching,
    onLoadMore: loadMore,
    enabled: partners.length > 0,
  });

  const showInitialLoading = partners.length === 0 && (isLoading || isFetching) && page === 1;

  return (
    <div className="flex flex-col gap-6">
      <div className="bg-white p-6 rounded-[14px] shadow-[0_2px_8px_rgba(0,0,0,0.06)] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-[24px] font-bold text-[#1A1A2E]">Business Partners</h1>
          <p className="text-[#757575] text-[14px]">
            {total > 0
              ? `${total} verified platform partner${total === 1 ? "" : "s"}`
              : "Explore and connect with our verified platform partners"}
          </p>
        </div>
        <div className="relative w-full md:w-[320px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9E9E9E]" />
          <input
            type="text"
            placeholder="Search partners..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full h-11 bg-[#F5F7FB] border-none rounded-xl pl-10 pr-4 text-[14px] focus:ring-2 focus:ring-[#0A7EA4]/20 outline-none transition-all"
          />
        </div>
      </div>

      {showInitialLoading && (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[20px] shadow-sm">
          <div className="w-12 h-12 border-4 border-[#0A7EA4] border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-[#64748B] font-medium">Fetching partners...</p>
        </div>
      )}

      {isError && partners.length === 0 && (
        <div className="bg-white p-12 rounded-[14px] text-center">
          <h3 className="text-[18px] font-bold text-red-600">Failed to load partners</h3>
          <p className="text-[#757575]">Please try again later.</p>
        </div>
      )}

      {!showInitialLoading && partners.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {partners.map((partner) => {
              const title = getPartnerTitle(partner);
              const showSeeMore = shouldShowPartnerSeeMore(partner.description);

              return (
                <motion.div
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  key={partner._id}
                  className="bg-white rounded-[20px] p-4 shadow-[0_4px_12px_rgba(0,0,0,0.03)] flex flex-col min-h-[220px] hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] transition-all group border border-[#F1F5F9]"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 overflow-hidden shadow-sm bg-[#F1F5F9] border border-[#E2E8F0]">
                      <ImageWithFallback
                        src={partner.logo}
                        alt={title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    {partner.type ? (
                      <p className="text-[10px] text-[#0A7EA4] font-bold uppercase tracking-wider">
                        {partner.type}
                      </p>
                    ) : null}
                  </div>

                  <div className="flex-1 mb-4">
                    <p className="text-[13px] text-[#64748B] leading-relaxed line-clamp-4">
                      {partner.description || "No description available."}
                    </p>
                    {showSeeMore ? (
                      <button
                        type="button"
                        onClick={() => openPartnerDetail(partner)}
                        className="mt-2 text-[12px] font-semibold text-[#0A7EA4] hover:text-[#086a8a] transition-colors"
                      >
                        See more
                      </button>
                    ) : null}
                  </div>

                  <div className="mt-auto flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => window.open(partner.link, "_blank", "noopener,noreferrer")}
                      className="w-full h-10 bg-[#F8FAFC] text-[#1A1A1A] rounded-xl text-[12px] font-bold hover:bg-[#0A7EA4] hover:text-white transition-all flex items-center justify-center gap-2 border border-[#E2E8F0] hover:border-transparent group/btn shadow-sm active:scale-[0.98]"
                    >
                      <Handshake className="w-4 h-4 group-hover/btn:animate-pulse" />
                      <span>{partner.btntext || "Connect Partner"}</span>
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {!showInitialLoading && partners.length === 0 && !isError && (
        <div className="bg-white p-12 rounded-[14px] shadow-[0_2px_8px_rgba(0,0,0,0.06)] text-center flex flex-col items-center">
          <div className="w-16 h-16 bg-[#F5F7FB] rounded-full flex items-center justify-center mb-4">
            <Search className="w-8 h-8 text-[#9E9E9E]" />
          </div>
          <h3 className="text-[18px] font-bold text-[#1A1A2E]">No partners found</h3>
          <p className="text-[#757575]">Try adjusting your search criteria</p>
        </div>
      )}

      <div ref={observerTarget} className="h-12 flex items-center justify-center pb-6">
        {isFetching && partners.length > 0 && hasMore && (
          <div className="w-6 h-6 border-2 border-[#0A7EA4] border-t-transparent rounded-full animate-spin" />
        )}
      </div>

      <PartnerDetailDialog
        partner={detailPartner}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
    </div>
  );
}
