"use client";
import { clsx } from "clsx";
import { ChevronRight, Handshake, Sparkles, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useGetPartnersQuery } from "@/store/endpoints/partners";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";
import {
  getPartnerTitle,
  PartnerDetailDialog,
  shouldShowPartnerSeeMore,
} from "@/components/partner-detail-dialog";
import type { Partner } from "@/store/endpoints/partners";

interface PartnersSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

function SidebarPartnerCard({
  partner,
  onSeeMore,
  onConnect,
}: {
  partner: Partner;
  onSeeMore: () => void;
  onConnect: () => void;
}) {
  const title = getPartnerTitle(partner);
  const showSeeMore = shouldShowPartnerSeeMore(partner.description);

  return (
    <article className="rounded-xl border border-[#E8ECF1] bg-white p-2.5 hover:border-[#0A7EA4]/20 transition-colors">
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-lg shrink-0 overflow-hidden bg-[#F8FAFC] border border-[#E2E8F0]">
          <ImageWithFallback
            src={partner.logo}
            alt={title}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] text-[#64748B] leading-snug line-clamp-3">
            {partner.description || "No description available."}
          </p>
          {showSeeMore ? (
            <button
              type="button"
              onClick={onSeeMore}
              className="mt-0.5 text-[10px] font-semibold text-[#0A7EA4] hover:text-[#086a8a] transition-colors"
            >
              See more
            </button>
          ) : null}
        </div>
      </div>

      <button
        type="button"
        onClick={onConnect}
        className="mt-2 w-full h-8 bg-[#F8FAFC] text-[#1A1A2E] rounded-lg text-[10px] font-bold hover:bg-[#0A7EA4] hover:text-white transition-all flex items-center justify-center gap-1.5 border border-[#E2E8F0] hover:border-transparent active:scale-[0.98]"
      >
        <Handshake className="w-3 h-3 shrink-0" />
        <span className="truncate">{partner.btntext || "Connect"}</span>
      </button>
    </article>
  );
}

export function PartnersSidebar({ isOpen, onClose }: PartnersSidebarProps) {
  const router = useRouter();
  const { data, isLoading } = useGetPartnersQuery();
  const partners = data?.allpartners?.slice(0, 5) || [];
  const [detailPartner, setDetailPartner] = useState<Partner | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const openPartnerDetail = (partner: Partner) => {
    setDetailPartner(partner);
    setDetailOpen(true);
  };

  const handleConnect = (partner: Partner) => {
    if (partner.link) {
      window.open(partner.link, "_blank", "noopener,noreferrer");
    } else {
      router.push("/partners");
    }
    if (window.innerWidth < 1280) onClose?.();
  };

  return (
    <aside
      className={clsx(
        "bg-[#F8FAFC] border-l border-[#E0E0E0] flex flex-col h-full min-h-0 shrink-0 transition-transform duration-300 z-50",
        "fixed xl:sticky top-0 right-0 w-[320px] xl:translate-x-0 overflow-hidden",
        isOpen ? "translate-x-0 shadow-2xl" : "translate-x-full"
      )}
    >
      <div className="p-3 xl:hidden flex items-center justify-between border-b border-[#E0E0E0] bg-white shrink-0">
        <span className="font-bold text-[16px] text-[#1A1A2E]">Partners</span>
        <button
          onClick={onClose}
          className="p-1 text-[#757575] hover:bg-[#F5F5F5] rounded-full transition-colors"
          aria-label="Close partners panel"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-3 py-3 xl:px-4 pb-20 md:pb-24">
        <div className="flex items-center justify-between mb-2.5 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-[#E0F2F7] flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-[#0A7EA4]" />
            </div>
            <h2 className="font-bold text-[14px] text-[#1A1A2E]">Partners</h2>
          </div>
          <button
            onClick={() => {
              router.push("/partners");
              if (window.innerWidth < 1280) onClose?.();
            }}
            className="text-[10px] font-bold text-[#0A7EA4] hover:text-[#086a8a] flex items-center gap-0.5 transition-colors"
          >
            View All
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        <div className="space-y-2">
          {isLoading ? (
            [1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="rounded-xl border border-[#E8ECF1] bg-white p-2.5 animate-pulse"
              >
                <div className="flex gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-[#E2E8F0] shrink-0" />
                  <div className="flex-1 space-y-1.5 pt-0.5">
                    <div className="h-3 bg-[#E2E8F0] rounded w-3/4" />
                    <div className="h-2 bg-[#E2E8F0] rounded w-full" />
                    <div className="h-2 bg-[#E2E8F0] rounded w-2/3" />
                  </div>
                </div>
                <div className="h-8 bg-[#E2E8F0] rounded-lg mt-2" />
              </div>
            ))
          ) : partners.length > 0 ? (
            partners.map((partner, index) => (
              <SidebarPartnerCard
                key={partner._id || index}
                partner={partner}
                onSeeMore={() => openPartnerDetail(partner)}
                onConnect={() => handleConnect(partner)}
              />
            ))
          ) : (
            <div className="rounded-xl border border-dashed border-[#CBD5E1] bg-white p-4 text-center">
              <p className="text-[12px] font-semibold text-[#64748B]">No partners yet</p>
            </div>
          )}
        </div>
      </div>

      <PartnerDetailDialog
        partner={detailPartner}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
    </aside>
  );
}
