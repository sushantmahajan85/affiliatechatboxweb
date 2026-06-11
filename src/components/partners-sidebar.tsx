"use client";
import { clsx } from "clsx";
import { ChevronRight, Handshake, X } from "lucide-react";
import { GrLinkedin } from "react-icons/gr";
import { useRouter } from "next/navigation";
import { useGetPartnersQuery } from "@/store/endpoints/partners";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";

const LINKEDIN_COMMUNITY_URL =
  process.env.NEXT_PUBLIC_LINKEDIN_COMMUNITY_URL ||
  "https://www.linkedin.com/company/affiliatechatbox/posts/";


interface PartnersSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function PartnersSidebar({ isOpen, onClose }: PartnersSidebarProps) {
  const router = useRouter();
  const { data, isLoading } = useGetPartnersQuery();
  const partners = data?.allpartners?.slice(0, 5) || [];

  const handleJoinCommunity = () => {
    window.open(LINKEDIN_COMMUNITY_URL, "_blank", "noopener,noreferrer");
    if (window.innerWidth < 1280) onClose?.();
  };

  return (
    <aside className={clsx(
      "bg-white border-l border-[#E0E0E0] flex flex-col h-full shrink-0 transition-transform duration-300 z-50",
      "fixed xl:sticky top-0 right-0 w-[320px] xl:translate-x-0 overflow-hidden",
      isOpen ? "translate-x-0 shadow-2xl" : "translate-x-full"
    )}>
      {/* Mobile Header */}
      <div className="p-4 xl:hidden flex items-center justify-between border-b border-[#E0E0E0] shrink-0">
        <span className="font-bold text-[18px]">Partners & Chat</span>
        <button 
          onClick={onClose}
          className="p-1 text-[#757575] hover:bg-[#F5F5F5] rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main Content - Scrollable Partners List */}
      <div className="flex-1 overflow-y-auto no-scrollbar p-6">
                <div className="bg-white rounded-[14px] p-5 shadow-[0_2px_8px_rgba(0,0,0,0.06)] border border-[#E0E0E0]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-[18px] text-[#1A1A2E]">Partners</h2>
            <button 
              onClick={() => {
                router.push("/partners");
                if (window.innerWidth < 1280) onClose?.();
              }}
              className="text-[12px] font-bold text-[#7B61FF] hover:underline flex items-center gap-1 transition-all"
            >
              View All
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="space-y-6">
            {isLoading ? (
              // Loading Skeleton
              [1, 2, 3].map((i) => (
                <div key={i} className="flex flex-col gap-3 animate-pulse">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-200 shrink-0" />
                    <div className="flex flex-col gap-2 flex-1">
                      <div className="h-4 bg-gray-200 rounded w-3/4" />
                      <div className="h-3 bg-gray-200 rounded w-1/2" />
                    </div>
                  </div>
                  <div className="h-10 bg-gray-200 rounded w-full" />
                </div>
              ))
            ) : (
              partners.map((partner, index) => (
                <div key={partner._id || index} className="flex flex-col gap-3">
                  <div className="flex items-start gap-3">
                    <div className={clsx(
                      "w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shrink-0 overflow-hidden shadow-sm bg-[#F1F5F9]"
                    )}>
                      <ImageWithFallback src={partner.logo} alt={partner.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-[14px] font-extrabold text-[#1A1A2E] truncate">{partner.name}</span>
                      <span className="text-[11px] text-[#0A7EA4] font-bold uppercase tracking-wider">{partner.type}</span>
                    </div>
                  </div>
                  
                  <p className="text-[12px] text-[#64748B] leading-relaxed line-clamp-2 px-1">
                    {partner.description}
                  </p>

                  <button 
                    onClick={() => {
                      if (partner.link) {
                        window.open(partner.link, '_blank');
                      } else {
                        router.push("/partners");
                      }
                      if (window.innerWidth < 1280) onClose?.();
                    }}
                    className="w-full h-9 bg-[#F8FAFC] text-[#1A1A2E] rounded-lg text-[12px] font-bold hover:bg-[#0A7EA4] hover:text-white transition-all flex items-center justify-center gap-2 border border-[#E2E8F0] hover:border-transparent group/btn active:scale-[0.98]"
                  >
                    <Handshake className="w-4 h-4 group-hover/btn:animate-pulse" />
                    <span>{partner.btntext || "Connect"}</span>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Bottom Sticky Section */}
      <div className="shrink-0 flex flex-col gap-2 p-4 bg-[#F8FAFC] border-t border-[#E0E0E0]">
        {/* Join Community Section */}
        <button
          type="button"
          onClick={handleJoinCommunity}
          className="bg-[#0A7EA4] rounded-[14px] p-4 text-white shadow-[0_8px_16px_rgba(10,126,164,0.2)] flex items-center justify-between group cursor-pointer hover:bg-[#084e96] transition-all relative -top-10 active:scale-[0.98] mx-[0px] mt-[65px] mb-[8px] w-full text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
              <GrLinkedin className="w-5 h-5" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[13px] font-bold">Join Community</span>
              <span className="text-[11px] opacity-80">Follow us on LinkedIn</span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 shrink-0 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </aside>
  );
}




