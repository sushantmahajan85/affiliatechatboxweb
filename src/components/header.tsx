"use client";
import { Bell, ChevronDown, Menu, MessageCircle, MessageSquare, MoreHorizontal, Search } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { ImageWithFallback } from "./figma/ImageWithFallback";

import { useRouter } from "next/navigation";

interface HeaderProps {
  onMenuClick?: () => void;
  onPartnersClick?: () => void;
}

const NOTIFICATIONS = [
  { id: 1, title: "New Partner Connection", description: "Tech Solutions sent you a connect request", time: "2m ago", read: false },
  { id: 2, title: "System Update", description: "Version 2.4.0 is now live with new features", time: "1h ago", read: true },
  { id: 3, title: "Security Alert", description: "New login detected from a new device", time: "5h ago", read: true },
];

const RECENT_MESSAGES = [
  { id: 1, name: "Sarah Miller", message: "Hey Alex, are we still on for the meeting?", time: "5m ago", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop" },
  { id: 2, name: "David Chen", message: "The proposal looks good, let's proceed.", time: "25m ago", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop" },
  { id: 3, name: "Jessica Alba", message: "Can you review the latest designs?", time: "2h ago", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop" },
];

import { useGetProfileQuery } from "@/store/endpoints/auth";
import { useAppSelector } from "@/store/hooks";

export function Header({ onMenuClick, onPartnersClick }: HeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMessages, setShowMessages] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  const messageRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (messageRef.current && !messageRef.current.contains(event.target as Node)) {
        setShowMessages(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="h-[60px] bg-white border-b border-[#E0E0E0] px-4 md:px-6 flex items-center justify-between sticky top-0 z-[100] shrink-0">
      <div className="flex items-center gap-4">
        <button 
          onClick={onMenuClick}
          className="md:hidden p-2 text-[#757575] hover:bg-[#F5F5F5] rounded-full transition-colors"
        >
          <Menu className="w-6 h-6" />
        </button>
        
        <div className="flex-1 max-w-[500px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#757575]" />
            <input
              type="text"
              placeholder="Search..."
              className="w-full h-9 md:h-10 bg-[#F5F5F5] rounded-full pl-10 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-[#0A7EA4]"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 md:gap-6 ml-4">
        <div className="hidden sm:flex items-center gap-4 border-r border-[#E0E0E0] pr-4 md:pr-6">
          {/* Notifications Dropdown */}
          <div className="relative" ref={notificationRef}>
            <button 
              onClick={() => { setShowNotifications(!showNotifications); setShowMessages(false); }}
              className={`relative p-1.5 rounded-full transition-all duration-200 ${showNotifications ? 'bg-[#F0ECF9] text-[#7B61FF]' : 'text-[#757575] hover:bg-[#F5F5F5]'}`}
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
            </button>
            <AnimatePresence>
              {showNotifications && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-[#E0E0E0] overflow-hidden z-[1000]"
                >
                  <div className="p-4 border-b border-[#F0F0F0] flex items-center justify-between">
                    <h3 className="font-bold text-[#1A1A2E]">Notifications</h3>
                    <button className="text-xs text-[#7B61FF] font-medium hover:underline">Mark all read</button>
                  </div>
                  <div className="max-h-80 overflow-y-auto scrollbar-hide">
                    {NOTIFICATIONS.map(notif => (
                      <div 
                        key={notif.id} 
                        onClick={() => { router.push('/notifications'); setShowNotifications(false); }}
                        className={`p-4 hover:bg-[#F9F9F9] transition-colors cursor-pointer border-b border-[#F0F0F0] last:border-0 ${!notif.read ? 'bg-[#F0ECF9]/30' : ''}`}
                      >
                        <div className="flex justify-between items-start mb-1">
                          <p className="text-sm font-bold text-[#1A1A2E]">{notif.title}</p>
                          <span className="text-[10px] text-[#9E9E9E]">{notif.time}</span>
                        </div>
                        <p className="text-xs text-[#757575] line-clamp-2">{notif.description}</p>
                      </div>
                    ))}
                  </div>
                  <div className="p-3 bg-[#F9F9F9] text-center border-t border-[#F0F0F0]">
                    <button 
                      onClick={() => { router.push('/notifications'); setShowNotifications(false); }}
                      className="text-xs font-bold text-[#1A1A2E] hover:text-[#7B61FF] transition-colors"
                    >
                      View All Notifications
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Messages Dropdown */}
          <div className="relative" ref={messageRef}>
            <button 
              onClick={() => { setShowMessages(!showMessages); setShowNotifications(false); }}
              className={`relative p-1.5 rounded-full transition-all duration-200 ${showMessages ? 'bg-[#F0ECF9] text-[#7B61FF]' : 'text-[#757575] hover:bg-[#F5F5F5]'}`}
            >
              <MessageSquare className="w-5 h-5" />
              <span className="absolute top-0 right-0 w-4 h-4 bg-[#0A7EA4] text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white">
                1
              </span>
            </button>
            <AnimatePresence>
              {showMessages && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-[#E0E0E0] overflow-hidden z-[1000]"
                >
                  <div className="p-4 border-b border-[#F0F0F0] flex items-center justify-between">
                    <h3 className="font-bold text-[#1A1A2E]">Messages</h3>
                    <button className="p-1 hover:bg-[#F5F5F5] rounded-full transition-colors"><MoreHorizontal className="w-4 h-4 text-[#757575]" /></button>
                  </div>
                  <div className="max-h-80 overflow-y-auto scrollbar-hide">
                    {RECENT_MESSAGES.map(msg => (
                      <div 
                        key={msg.id} 
                        onClick={() => { router.push('/chats'); setShowMessages(false); }}
                        className="p-4 hover:bg-[#F9F9F9] transition-colors cursor-pointer flex gap-3 border-b border-[#F0F0F0] last:border-0"
                      >
                        <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 border border-[#E0E0E0]">
                          <ImageWithFallback src={msg.avatar} alt={msg.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start mb-0.5">
                            <p className="text-sm font-bold text-[#1A1A2E] truncate">{msg.name}</p>
                            <span className="text-[10px] text-[#9E9E9E] shrink-0">{msg.time}</span>
                          </div>
                          <p className="text-xs text-[#757575] truncate">{msg.message}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="p-3 bg-[#F9F9F9] text-center border-t border-[#F0F0F0]">
                    <button 
                      onClick={() => { router.push('/chats'); setShowMessages(false); }}
                      className="text-sm font-bold text-[#0A7EA4] hover:underline"
                    >
                      Open in Chat Inbox
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Messaging Toggle for mobile/tablet */}
        <button 
          onClick={onPartnersClick}
          className="xl:hidden p-2 text-[#757575] hover:bg-[#F5F5F5] rounded-full transition-colors relative"
        >
          <MessageCircle className="w-6 h-6" />
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-[#16A34A] rounded-full border-2 border-white"></span>
        </button>

        {isAuthenticated && user ? (
          <div 
            onClick={() => router.push('/profile')}
            className="flex items-center gap-2 md:gap-3 cursor-pointer group"
          >
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full overflow-hidden border border-[#E0E0E0] shrink-0 group-hover:border-[#0A7EA4] transition-colors">
              <ImageWithFallback
                src={user.profileImageUrl || `https://ui-avatars.com/api/?name=${user.firstName}+${user.lastName}&background=0A7EA4&color=fff`}
                alt={`${user.firstName} ${user.lastName}`}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="hidden sm:flex flex-col">
              <div className="flex items-center gap-1">
                <span className="font-bold text-[14px] text-[#1A1A2E] group-hover:text-[#0A7EA4] transition-colors">
                  {user.firstName} {user.lastName}
                </span>
                <ChevronDown className="w-4 h-4 text-[#757575]" />
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                {user.isGoogleVerified && (
                  <div className="flex items-center gap-0.5 text-[10px] font-medium text-[#16A34A]">
                    <span className="w-3 h-3 bg-[#16A34A] rounded-xs flex items-center justify-center text-[7px] text-white font-bold">G</span>
                    <span>Verified</span>
                  </div>
                )}
                {user.isLinkedinVerified && (
                  <div className="bg-[#0A66C2] text-white text-[8px] px-0.5 rounded-[1px] flex items-center justify-center font-bold h-3">
                    in
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <button 
            onClick={() => router.push('/login')}
            className="px-4 h-9 bg-[#1A1A2E] text-white rounded-full text-sm font-bold hover:bg-[#2A2A3E] transition-all active:scale-95 shadow-md"
          >
            Sign In
          </button>
        )}
      </div>
    </header>
  );
}



