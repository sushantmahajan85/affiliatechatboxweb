"use client";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";
import { clsx } from "clsx";
import { Building2, ChevronLeft, ChevronRight, Handshake, Mail, Search } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";

const PARTNERS = [
  { 
    id: 1, 
    name: "Business Company", 
    type: "Enterprise Solutions", 
    description: "Enterprise Solutions provider with a focus on scaling businesses globally through innovation.",
    email: "contact@businessco.com",
    avatar: "https://images.unsplash.com/photo-1560179707-f14e90ef3623?q=80&w=250",
    bgColor: "bg-[#374151]",
    verified: true
  },
  { 
    id: 2, 
    name: "Alpha Network", 
    type: "Affiliate Network", 
    description: "High-performance affiliate network connecting premium brands with top-tier traffic sources.",
    email: "partners@alphanet.io",
    avatar: "https://images.unsplash.com/photo-1549737221-bef65e2604a6?q=80&w=250",
    bgColor: "bg-[#0A7EA4]",
    verified: true
  },
  { 
    id: 3, 
    name: "Market Starcor", 
    type: "Agency", 
    description: "Full-service digital agency specialized in ROI-driven marketing and content strategy.",
    email: "info@starcor.de",
    avatar: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=250",
    bgColor: "bg-[#7C1A2E]",
    verified: false
  },
  { 
    id: 4, 
    name: "Global Reach", 
    type: "Media Buyer", 
    description: "Global media buying experts delivering scale across social and native advertising platforms.",
    email: "support@globalreach.io",
    avatar: "https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=250",
    bgColor: "bg-[#0A66C2]",
    verified: true
  },
  { 
    id: 5, 
    name: "TechFlow Systems", 
    type: "SaaS Provider", 
    description: "Next-gen SaaS platforms designed for automation and operational efficiency for modern teams.",
    email: "sales@techflow.sg",
    avatar: "https://images.unsplash.com/photo-1554469384-e58fac16e23a?q=80&w=250",
    bgColor: "bg-[#4B5563]",
    verified: true
  },
  { 
    id: 6, 
    name: "Vantage Ads", 
    type: "Ad Network", 
    description: "Transparent ad network providing high-quality traffic and advanced targeting for advertisers.",
    email: "ads@vantage.ae",
    avatar: "https://images.unsplash.com/photo-1577416416181-f48a86c5f707?q=80&w=250",
    bgColor: "bg-[#10B981]",
    verified: true
  }
];

export function PartnersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const filteredPartners = PARTNERS.filter(partner => 
    partner.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    partner.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filteredPartners.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentPartners = filteredPartners.slice(indexOfFirstItem, indexOfLastItem);

  return (
    <div className="flex flex-col gap-6">
      {/* Search Header */}
      <div className="bg-white p-6 rounded-[14px] shadow-[0_2px_8px_rgba(0,0,0,0.06)] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-[24px] font-bold text-[#1A1A2E]">Business Partners</h1>
          <p className="text-[#757575] text-[14px]">Explore and connect with our verified platform partners</p>
        </div>
        <div className="relative w-full md:w-[320px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9E9E9E]" />
          <input 
            type="text"
            placeholder="Search partners by name or type..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full h-11 bg-[#F5F7FB] border-none rounded-xl pl-10 pr-4 text-[14px] focus:ring-2 focus:ring-[#0A7EA4]/20 outline-none transition-all"
          />
        </div>
      </div>

      {/* Grid of Partner Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {currentPartners.map((partner) => (
            <motion.div 
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              key={partner.id} 
              className="bg-white rounded-[20px] p-6 shadow-[0_4px_12px_rgba(0,0,0,0.03)] flex flex-col hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] transition-all group border border-[#F1F5F9] relative overflow-hidden"
            >
              {/* Partner Header */}
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className={clsx(
                    "w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold shrink-0 overflow-hidden shadow-sm",
                    partner.bgColor
                  )}>
                    <ImageWithFallback src={partner.avatar} alt={partner.name} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-[17px] font-bold text-[#1A1A1A]">{partner.name}</h3>
                      {partner.verified && (
                        <div className="bg-[#0A7EA4] text-white p-0.5 rounded-full" title="Verified Partner">
                          <Building2 className="w-3 h-3" />
                        </div>
                      )}
                    </div>
                    <span className="text-[13px] text-[#0A7EA4] font-medium">{partner.type}</span>
                  </div>
                </div>
              </div>

              {/* Partner Details */}
              <div className="space-y-4 mb-8">
                <p className="text-[14px] text-[#64748B] leading-relaxed line-clamp-2">
                  {partner.description}
                </p>
                <div className="flex items-center gap-3 text-[14px] text-[#64748B] pt-1">
                  <Mail className="w-4 h-4 text-[#CBD5E1]" />
                  <span className="truncate">{partner.email}</span>
                </div>
              </div>

              {/* Action Button */}
              <div className="mt-auto">
                <button 
                  className="w-full h-12 bg-[#F8FAFC] text-[#1A1A1A] rounded-xl text-[14px] font-bold hover:bg-[#0A7EA4] hover:text-white transition-all flex items-center justify-center gap-2 border border-[#E2E8F0] hover:border-transparent group/btn shadow-sm active:scale-[0.98]"
                >
                  <Handshake className="w-5 h-5 group-hover/btn:animate-pulse" />
                  <span>Connect Partner</span>
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <button 
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            className="w-10 h-10 rounded-xl border border-[#E0E0E0] flex items-center justify-center text-[#757575] hover:bg-[#F5F5F5] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-1">
            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i + 1}
                onClick={() => setCurrentPage(i + 1)}
                className={clsx(
                  "w-10 h-10 rounded-xl text-[14px] font-bold transition-all",
                  currentPage === i + 1 
                    ? "bg-[#0A7EA4] text-white" 
                    : "text-[#757575] hover:bg-[#F5F5F5]"
                )}
              >
                {i + 1}
              </button>
            ))}
          </div>

          <button 
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            className="w-10 h-10 rounded-xl border border-[#E0E0E0] flex items-center justify-center text-[#757575] hover:bg-[#F5F5F5] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}

      {filteredPartners.length === 0 && (
        <div className="bg-white p-12 rounded-[14px] shadow-[0_2px_8px_rgba(0,0,0,0.06)] text-center flex flex-col items-center">
          <div className="w-16 h-16 bg-[#F5F7FB] rounded-full flex items-center justify-center mb-4">
            <Search className="w-8 h-8 text-[#9E9E9E]" />
          </div>
          <h3 className="text-[18px] font-bold text-[#1A1A2E]">No partners found</h3>
          <p className="text-[#757575]">Try adjusting your search criteria</p>
        </div>
      )}
    </div>
  );
}


