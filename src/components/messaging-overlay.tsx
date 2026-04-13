"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import { 
  X, Phone, Video, Smile, Paperclip, Send, 
  CheckCheck, Search, MoreHorizontal, Edit3, 
  ChevronDown, ChevronUp 
} from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";

const RECENT_CHATS = [
  { name: "John Doe", status: "online", lastMsg: "Hey, check the Q4 stats!", avatar: "https://images.unsplash.com/photo-1672685667592-0392f458f46f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBtYW4lMjBoZWFkc2hvdCUyMHBvcnRyYWl0fGVufDF8fHx8MTc3NDU4NzY5OXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral" },
  { name: "Sarah Miller", status: "offline", lastMsg: "The ROI looks great.", avatar: "https://images.unsplash.com/photo-1610387694365-19fafcc86d86?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxidXNpbmVzcyUyMG9mZmljZSUyMHByb2Zlc3Npb25hbCUyMHdvbWFuJTIwcG9ydHJhaXR8ZW58MXx8fHwxNzc0NjAxMzA3fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral" },
];

interface MessagingOverlayProps {
  activeChats: any[];
  setActiveChats: (chats: any[]) => void;
}

export function MessagingOverlay({ activeChats, setActiveChats }: MessagingOverlayProps) {
  const [isMessagingExpanded, setIsMessagingExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "requests">("all");
  const pathname = usePathname();
  const isHomePage = pathname === "/";

  // Only show messaging overlay on home page for now, or you can keep it globally
  if (!isHomePage) return null;

  return (
    <div className="fixed bottom-0 right-8 flex items-end gap-3 z-[100] pointer-events-none">
      {/* Active Chat Windows */}
      <div className="flex items-end gap-3 pointer-events-auto">
        {activeChats.map((chat, idx) => (
          <div 
            key={`chat-${idx}`}
            className="w-[300px] bg-white rounded-t-[10px] shadow-[0_4px_12px_rgba(0,0,0,0.15)] border border-[#E0E0E0] overflow-hidden flex flex-col"
          >
            {/* Window Header */}
            <div className="p-2 border-b border-[#E0E0E0] flex items-center justify-between bg-white hover:bg-[#F3F6F8] cursor-pointer">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <div className="w-8 h-8 rounded-full overflow-hidden">
                    <ImageWithFallback src={chat.avatar} alt={chat.name} className="w-full h-full object-cover" />
                  </div>
                  {chat.status === "online" && (
                    <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[#4ADE80] border-2 border-white rounded-full"></div>
                  )}
                </div>
                <div className="flex flex-col">
                  <span className="text-[13px] font-bold text-[#1A1A2E] leading-tight truncate w-32">{chat.name}</span>
                  <span className="text-[11px] text-[#4ADE80] font-medium leading-tight">Online</span>
                </div>
              </div>
              <div className="flex items-center gap-1 text-[#666666]">
                <span className="p-1.5 hover:bg-black/5 rounded-full"><Phone className="w-3.5 h-3.5" /></span>
                <span className="p-1.5 hover:bg-black/5 rounded-full"><Video className="w-3.5 h-3.5" /></span>
                <button 
                  onClick={() => setActiveChats(activeChats.filter((_, i) => i !== idx))}
                  className="p-1.5 hover:bg-black/5 rounded-full"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            {/* Message Area */}
            <div 
              className="h-72 p-3 overflow-y-auto space-y-3 no-scrollbar relative"
              style={{ 
                backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")',
                backgroundRepeat: 'repeat',
                backgroundSize: '300px',
                backgroundColor: '#efe7dd'
              }}
            >
              <div className="absolute inset-0 bg-white/40 pointer-events-none" />
              <div className="relative z-10 space-y-2">
                <div className="flex justify-start">
                  <div className="bg-white px-2.5 py-1.5 rounded-lg rounded-tl-none shadow-sm text-[12px] text-[#111b21] max-w-[85%]">
                    {chat.lastMsg}
                    <div className="text-right mt-1 text-[10px] text-[#667781]">10:45 AM</div>
                  </div>
                </div>
                <div className="flex justify-end">
                  <div className="bg-[#D9FDD3] px-2.5 py-1.5 rounded-lg rounded-tr-none shadow-sm text-[12px] text-[#111b21] max-w-[85%]">
                    Hey! Just checking in on those stats.
                    <div className="flex items-center justify-end gap-1 mt-1">
                      <span className="text-[10px] text-[#667781]">11:02 AM</span>
                      <CheckCheck className="w-3 h-3 text-[#53bdeb]" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Input Area */}
            <div className="p-2 bg-[#F0F2F5] flex items-center gap-2 border-t border-[#E0E0E0]">
              <Smile className="w-5 h-5 text-[#54656f] cursor-pointer" />
              <Paperclip className="w-5 h-5 text-[#54656f] cursor-pointer" />
              <div className="flex-1 bg-white rounded-lg px-3 py-1.5 border border-[#E0E0E0]">
                <input 
                  type="text" 
                  placeholder="Type a message" 
                  className="w-full text-[13px] bg-transparent focus:outline-none placeholder:text-[#94a3b8]"
                />
              </div>
              <Send className="w-5 h-5 text-[#54656f] cursor-pointer" />
            </div>
          </div>
        ))}
      </div>

      {/* Main Messaging Bar (Minimized) */}
      <div className="w-72 bg-white rounded-t-[10px] shadow-[0_4px_12px_rgba(0,0,0,0.15)] border border-[#E0E0E0] overflow-hidden pointer-events-auto">
        <button 
          onClick={() => setIsMessagingExpanded(!isMessagingExpanded)}
          className="p-2 flex items-center justify-between cursor-pointer w-full text-left bg-white hover:bg-[#F3F6F8] transition-colors border-b border-[#E0E0E0]"
        >
          <div className="flex items-center gap-2">
            <div className="relative">
              <div className="w-8 h-8 rounded-full bg-[#0A66C2] flex items-center justify-center overflow-hidden">
                <ImageWithFallback src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop" alt="User" />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-[#057642] border-2 border-white rounded-full"></div>
            </div>
            <span className="font-bold text-[14px] text-[#1A1A2E]">Messaging</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="p-1.5 hover:bg-black/5 rounded-full transition-colors"><MoreHorizontal className="w-4 h-4 text-[#666666]" /></span>
            <span className="p-1.5 hover:bg-black/5 rounded-full transition-colors"><Edit3 className="w-4 h-4 text-[#666666]" /></span>
            {isMessagingExpanded ? <ChevronDown className="w-4 h-4 text-[#666666]" /> : <ChevronUp className="w-4 h-4 text-[#666666]" />}
          </div>
        </button>

        <AnimatePresence>
          {isMessagingExpanded && (
            <motion.div 
              initial={{ height: 0 }}
              animate={{ height: 420 }}
              exit={{ height: 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="flex flex-col"
            >
              <div className="p-2 border-b border-[#F1F5F9] bg-white">
                <div className="relative mb-2">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#666666]" />
                  <input
                    type="text"
                    placeholder="Search messages"
                    className="w-full h-8 bg-[#EEF3F8] rounded-[4px] pl-9 pr-3 text-[14px] focus:outline-none focus:ring-1 focus:ring-[#0A66C2]"
                  />
                </div>
                <div className="flex gap-4 px-1">
                  <button 
                    onClick={() => setActiveTab("all")}
                    className={clsx(
                      "text-[12px] font-bold pb-1 transition-colors relative",
                      activeTab === "all" ? "text-[#0A66C2]" : "text-[#666666] hover:text-[#1A1A2E]"
                    )}
                  >
                    All Messages
                    {activeTab === "all" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0A66C2]" />}
                  </button>
                  <button 
                    onClick={() => setActiveTab("requests")}
                    className={clsx(
                      "text-[12px] font-bold pb-1 transition-colors relative",
                      activeTab === "requests" ? "text-[#0A66C2]" : "text-[#666666] hover:text-[#1A1A2E]"
                    )}
                  >
                    Message Requests
                    {activeTab === "requests" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0A66C2]" />}
                  </button>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto no-scrollbar bg-white">
                {RECENT_CHATS.filter(c => activeTab === "all" ? true : false).map((chat, idx) => (
                  <div 
                    key={idx} 
                    onClick={() => {
                      const existingIndex = activeChats.findIndex(c => c.name === chat.name);
                      if (existingIndex === -1) {
                        setActiveChats([chat, ...activeChats].slice(0, 3));
                      } else {
                        const updated = [...activeChats];
                        const [item] = updated.splice(existingIndex, 1);
                        setActiveChats([item, ...updated]);
                      }
                    }}
                    className={clsx(
                      "flex items-start gap-3 cursor-pointer hover:bg-[#F3F6F8] p-3 transition-colors border-l-[3px]",
                      activeChats.find(c => c.name === chat.name) ? "border-[#0A66C2] bg-[#F3F6F8]" : "border-transparent hover:border-[#0A66C2]"
                    )}
                  >
                    <div className="relative shrink-0 mt-0.5">
                      <div className="w-12 h-12 rounded-full overflow-hidden">
                        <ImageWithFallback src={chat.avatar} alt={chat.name} className="w-full h-full object-cover" />
                      </div>
                      {chat.status === "online" && (
                        <div className="absolute bottom-0 right-0.5 w-3.5 h-3.5 bg-[#057642] border-2 border-white rounded-full"></div>
                      )}
                    </div>
                    <div className="flex flex-col min-w-0 flex-1 border-b border-[#F1F5F9] pb-3 last:border-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-[14px] font-bold text-[#1A1A2E] truncate">{chat.name}</span>
                        <span className="text-[12px] text-[#666666]">Oct 25</span>
                      </div>
                      <span className="text-[12px] text-[#666666] line-clamp-2 leading-snug">{chat.lastMsg}</span>
                    </div>
                  </div>
                ))}
                {activeTab === "requests" && (
                  <div className="p-8 text-center">
                    <p className="text-[13px] text-[#666666]">No message requests at this time.</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

