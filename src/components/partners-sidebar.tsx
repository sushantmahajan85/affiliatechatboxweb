"use client";
import { clsx } from "clsx";
import { ChevronRight, Handshake, X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

const PARTNERS = [
  {
    name: "Business Company",
    type: "Enterprise Solutions",
    description: "Enterprise Solutions provider focused on scaling businesses globally.",
    icon: "building",
    bgColor: "bg-[#374151]",
  },
  {
    name: "Alpha Network",
    type: "Affiliate Network",
    description: "High-performance affiliate network connecting premium brands.",
    initials: "AN",
    bgColor: "bg-[#0A7EA4]",
  },
  {
    name: "Market Starcor",
    type: "Agency",
    description: "Full-service digital agency specialized in ROI-driven marketing.",
    initials: "MS",
    bgColor: "bg-[#7C1A2E]",
  },
  
];

const RECENT_CHATS = [
  { name: "John Doe", status: "online", lastMsg: "Hey, check the Q4 stats!", avatar: "https://images.unsplash.com/photo-1672685667592-0392f458f46f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBtYW4lMjBoZWFkc2hvdCUyMHBvcnRyYWl0fGVufDF8fHx8MTc3NDU4NzY5OXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral" },
  { name: "Sarah Miller", status: "offline", lastMsg: "The ROI looks great.", avatar: "https://images.unsplash.com/photo-1610387694365-19fafcc86d86?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxidXNpbmVzcyUyMG9mZmljZSUyMHByb2Zlc3Npb25hbCUyMHdvbWFuJTIwcG9ydHJhaXR8ZW58MXx8fHwxNzc0NjAxMzA3fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral" },
];

interface PartnersSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  activeChats: any[];
  setActiveChats: (chats: any[]) => void;
}

export function PartnersSidebar({ isOpen, onClose, activeChats, setActiveChats }: PartnersSidebarProps) {
  const [activeTab, setActiveTab] = useState<"all" | "requests">("all");
  const router = useRouter();
  const pathname = usePathname();

  const isHomePage = pathname === "/";

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
            {PARTNERS.map((partner, index) => (
              <div key={index} className="flex flex-col gap-3">
                <div className="flex items-start gap-3">
                  <div className={clsx(
                    "w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shrink-0 overflow-hidden shadow-sm",
                    partner.bgColor
                  )}>
                    {partner.icon === "building" && (
                      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                        <path d="M19 21V5c0-1.1-.9-2-2-2H7c-1.1 0-2 .9-2 2v16h14zM9 19H7v-2h2v2zm0-4H7v-2h2v2zm0-4H7V9h2v2zm4 8h-2v-2h2v2zm0-4h-2v-2h2v2zm0-4h-2V9h2v2zm4 8h-2v-2h2v2zm0-4h-2v-2h2v2zm0-4h-2V9h2v2z" />
                      </svg>
                    )}
                    {/* {partner.icon === "linkedin" && <Linkedin className="w-5 h-5 fill-current" />} */}
                    {partner.initials}
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
                    router.push("/partners");
                    if (window.innerWidth < 1280) onClose?.();
                  }}
                  className="w-full h-9 bg-[#F8FAFC] text-[#1A1A2E] rounded-lg text-[12px] font-bold hover:bg-[#0A7EA4] hover:text-white transition-all flex items-center justify-center gap-2 border border-[#E2E8F0] hover:border-transparent group/btn active:scale-[0.98]"
                >
                  <Handshake className="w-4 h-4 group-hover/btn:animate-pulse" />
                  <span>Connect</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Sticky Section */}
      <div className="shrink-0 flex flex-col gap-2 p-4 bg-[#F8FAFC] border-t border-[#E0E0E0]">
        {/* Join Community Section */}
        <div className="bg-[#0A7EA4] rounded-[14px] p-4 text-white shadow-[0_8px_16px_rgba(10,126,164,0.2)] flex items-center justify-between group cursor-pointer hover:bg-[#084e96] transition-all relative -top-10 active:scale-[0.98] mx-[0px] mt-[65px] mb-[8px]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              {/* <Linkedin className="w-5 h-5" /> */}
            </div>
            <div className="flex flex-col">
              <span className="text-[13px] font-bold">Join Community</span>
              <span className="text-[11px] opacity-80">Follow us on LinkedIn</span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </aside>
  );
}




