"use client";
import { Bell, ChevronDown, LogOut, Menu, MessageCircle, MessageSquare, Settings, User } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { resolveUserProfileImageUrl } from "@/lib/user-profile-image";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { openAuthModal } from "@/store/uiSlice";
import { logout } from "@/store/authSlice";

interface HeaderProps {
  onMenuClick?: () => void;
  onPartnersClick?: () => void;
}

import {
  useGetNotificationsQuery,
  useGetUnreadStatusQuery,
  useMarkAllReadMutation
} from "@/store/endpoints/notifications";

function formatRelativeTime(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return "just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  return `${Math.floor(diffInSeconds / 86400)}d ago`;
}



export function Header({ onMenuClick, onPartnersClick }: HeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMessages, setShowMessages] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  const messageRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();

  const { data: notificationsData } = useGetNotificationsQuery(user?._id || "", {
    skip: !isAuthenticated || !user?._id,
    pollingInterval: 3000,
  });
  const { data: unreadData } = useGetUnreadStatusQuery(user?._id || "", {
    skip: !isAuthenticated || !user?._id,
    pollingInterval: 30000, 
  });
  const [markAllRead, { isLoading: isMarkingAllRead }] = useMarkAllReadMutation();

  const handleMarkAllRead = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user?._id || isMarkingAllRead) return;
    try {
      await markAllRead(user._id).unwrap();
    } catch {
      // Refetch will restore state on failure via RTK undo
    }
  };

  const notifications = notificationsData?.notifs || [];
  
  const systemNotifications = notifications.filter(n => n.type !== "chat_request");
  const messageNotifications = notifications.filter(n => n.type === "chat_request");

  const hasSystemUnread = systemNotifications.some(n => !n.isRead);
  const unreadMessageCount = messageNotifications.filter(n => !n.isRead).length;

  const handleLogout = () => {
    dispatch(logout());
    setShowUserMenu(false);
    router.push("/login");
  };

  const toggleUserMenu = () => {
    setShowUserMenu((open) => !open);
    setShowNotifications(false);
    setShowMessages(false);
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (messageRef.current && !messageRef.current.contains(event.target as Node)) {
        setShowMessages(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
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
      </div>

      <div className="flex items-center gap-3 md:gap-6 ml-4">
        <div className="hidden sm:flex items-center gap-4 border-r border-[#E0E0E0] pr-4 md:pr-6">
          <div className="relative" ref={notificationRef}>
            <button 
              onClick={() => { setShowNotifications(!showNotifications); setShowMessages(false); setShowUserMenu(false); }}
              className={`relative p-1.5 rounded-full transition-all duration-200 ${showNotifications ? 'bg-[#F0ECF9] text-[#7B61FF]' : 'text-[#757575] hover:bg-[#F5F5F5]'}`}
            >
              <Bell className="w-5 h-5" />
              {hasSystemUnread && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
              )}
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
                    {hasSystemUnread && (
                      <button
                        type="button"
                        onClick={handleMarkAllRead}
                        disabled={isMarkingAllRead}
                        className="text-xs text-[#7B61FF] font-medium hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isMarkingAllRead ? "Marking..." : "Mark all read"}
                      </button>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto scrollbar-hide">
                    {systemNotifications.length > 0 ? (
                      systemNotifications.slice(0, 10).map(notif => (
                        <div 
                          key={notif._id} 
                          onClick={() => { router.push('/notifications'); setShowNotifications(false); }}
                          className={`p-4 hover:bg-[#F9F9F9] transition-colors cursor-pointer border-b border-[#F0F0F0] last:border-0 ${!notif.isRead ? 'bg-[#F0ECF9]/30' : ''}`}
                        >
                          <div className="flex justify-between items-start mb-1">
                            <p className="text-sm font-bold text-[#1A1A2E]">{notif.title}</p>
                            <span className="text-[10px] text-[#9E9E9E]">{formatRelativeTime(notif.timestamp)}</span>
                          </div>
                          <p className="text-xs text-[#757575] line-clamp-2">{notif.message}</p>
                        </div>
                      ))
                    ) : (
                      <div className="p-8 text-center bg-white">
                        <Bell className="w-8 h-8 text-[#E2E8F0] mx-auto mb-2 opacity-50" />
                        <p className="text-xs text-[#94A3B8] font-bold">No notifications yet</p>
                      </div>
                    )}
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

          <div className="relative" ref={messageRef}>
            <button 
              onClick={() => {
                if (!isAuthenticated) {
                  dispatch(openAuthModal());
                  return;
                }
                router.push("/chats");
              }}
              className="relative p-1.5 rounded-full transition-all duration-200 text-[#757575] hover:bg-[#F5F5F5]"
            >
              <MessageSquare className="w-5 h-5" />
            </button>
          </div>
        </div>

        <button 
          onClick={onPartnersClick}
          className="xl:hidden p-2 text-[#757575] hover:bg-[#F5F5F5] rounded-full transition-colors relative"
        >
          <MessageCircle className="w-6 h-6" />
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-[#16A34A] rounded-full border-2 border-white"></span>
        </button>

        {isAuthenticated && user ? (
          <div className="relative" ref={userMenuRef}>
            <div className="flex items-center gap-2 md:gap-3 group">
              <button
                type="button"
                onClick={toggleUserMenu}
                className="w-8 h-8 md:w-10 md:h-10 rounded-full overflow-hidden border border-[#E0E0E0] shrink-0 group-hover:border-[#0A7EA4] transition-colors sm:hidden cursor-pointer"
                aria-label="Open account menu"
              >
                <ImageWithFallback
                  src={resolveUserProfileImageUrl(user, `${user.firstName} ${user.lastName}`)}
                  alt={`${user.firstName} ${user.lastName}`}
                  className="w-full h-full object-cover"
                />
              </button>
              <div className="hidden sm:block w-8 h-8 md:w-10 md:h-10 rounded-full overflow-hidden border border-[#E0E0E0] shrink-0 group-hover:border-[#0A7EA4] transition-colors pointer-events-none">
                <ImageWithFallback
                  src={resolveUserProfileImageUrl(user, `${user.firstName} ${user.lastName}`)}
                  alt={`${user.firstName} ${user.lastName}`}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="hidden sm:flex flex-col">
                <button
                  type="button"
                  onClick={toggleUserMenu}
                  className="flex items-center gap-1 text-left cursor-pointer"
                  aria-expanded={showUserMenu}
                  aria-haspopup="menu"
                >
                  <span className="font-bold text-[14px] text-[#1A1A2E] group-hover:text-[#0A7EA4] transition-colors">
                    {user.firstName} {user.lastName}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-[#757575] transition-transform duration-200 ${showUserMenu ? "rotate-180 text-[#0A7EA4]" : ""}`}
                  />
                </button>
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
            <AnimatePresence>
              {showUserMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-2 w-44 bg-white rounded-xl shadow-xl border border-[#E0E0E0] overflow-hidden z-[1000] py-1"
                  role="menu"
                >
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      router.push("/profile");
                      setShowUserMenu(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-[#1A1A2E] hover:bg-[#F5F5F5] transition-colors"
                  >
                    <User className="w-4 h-4 text-[#757575]" />
                    Profile
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      router.push("/chats");
                      setShowUserMenu(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-[#1A1A2E] hover:bg-[#F5F5F5] transition-colors"
                  >
                    <MessageSquare className="w-4 h-4 text-[#757575]" />
                    Chat
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      router.push("/settings");
                      setShowUserMenu(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-[#1A1A2E] hover:bg-[#F5F5F5] transition-colors"
                  >
                    <Settings className="w-4 h-4 text-[#757575]" />
                    Settings
                  </button>
                  <div className="my-1 border-t border-[#F0F0F0]" />
                  <button
                    type="button"
                    role="menuitem"
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : (
          <button 
            onClick={() => dispatch(openAuthModal())}
            className="px-4 h-9 bg-[#1A1A2E] text-white rounded-full text-sm font-bold hover:bg-[#2A2A3E] transition-all active:scale-95 shadow-md"
          >
            Sign In
          </button>
        )}
      </div>
    </header>
  );
}
