"use client";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";
import { clsx } from "clsx";
import { ChevronLeft, ChevronRight, Handshake, Search } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";

import { useGetPartnersQuery } from "@/store/endpoints/partners";

export function PartnersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const { data, isLoading } = useGetPartnersQuery();
  const PARTNERS = data?.allpartners || [];

  const filteredPartners = PARTNERS?.filter(partner => 
    partner?.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    partner?.type?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filteredPartners?.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentPartners = filteredPartners?.slice(indexOfFirstItem, indexOfLastItem);


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

      {/* Loading State */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[20px] shadow-sm animate-pulse">
          <div className="w-12 h-12 border-4 border-[#0A7EA4] border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-[#64748B] font-medium">Fetching partners...</p>
        </div>
      )}

      {/* Grid of Partner Cards */}
      {!isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {currentPartners.map((partner) => (
              <motion.div 
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                key={partner._id} 
                className="bg-white rounded-[20px] p-2 shadow-[0_4px_12px_rgba(0,0,0,0.03)] flex flex-col hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] transition-all group border border-[#F1F5F9] relative overflow-hidden"
              >
                {/* Partner Header */}
                <div className="flex items-center justify-between mb-2 w-full">
                  <div className="flex items-center gap-4 w-100%">
                    <div className={clsx(
                      "w-10 h-10 rounded-2xl flex items-center justify-center text-white font-bold shrink-0 overflow-hidden shadow-sm bg-[#F1F5F9] "
                    )}>
                      <ImageWithFallback src={partner.logo} alt={partner.name} className="w-full h-full object-cover" />
                    </div>
                    
                  </div>
                </div>

                {/* Partner Details */}
                <div className="space-y-4 mb-8 text-center sm:text-left">
                  <p className="text-[12px] text-[#64748B]  h-[60px]">
                    {partner.description}
                  </p>
                  
                </div>

                {/* Action Button */}
                <div className="mt-auto">
                  <button 
                    onClick={() => window.open(partner.link, '_blank')}
                    className="w-full h-10 bg-[#F8FAFC] text-[#1A1A1A] rounded-xl text-[12px] font-bold hover:bg-[#0A7EA4] hover:text-white transition-all flex items-center justify-center gap-2 border border-[#E2E8F0] hover:border-transparent group/btn shadow-sm active:scale-[0.98]"
                  >
                    <Handshake className="w-4 h-4 group-hover/btn:animate-pulse" />
                    <span>{partner.btntext || "Connect Partner"}</span>
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

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


