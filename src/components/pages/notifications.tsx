"use client";
import { Bell, Check, MoreHorizontal, Filter, Search, ChevronRight } from "lucide-react";
import { motion } from "motion/react";

import { 
  useGetNotificationsQuery, 
  useMarkAllReadMutation 
} from "@/store/endpoints/notifications";
import { useAppSelector } from "@/store/hooks";
import { useState } from "react";

function formatRelativeTime(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return "just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  return `${Math.floor(diffInSeconds / 86400)}d ago`;
}

export function NotificationsPage() {
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [searchQuery, setSearchQuery] = useState("");

  const { data: notificationsData, isLoading } = useGetNotificationsQuery(user?._id || "", {
    skip: !isAuthenticated || !user?._id,
  });
  const [markAllRead, { isLoading: isMarkingAllRead }] = useMarkAllReadMutation();

  const handleMarkAllRead = async () => {
    if (!user?._id || isMarkingAllRead) return;
    try {
      await markAllRead(user._id).unwrap();
    } catch {
      // RTK optimistic update rolls back on failure
    }
  };

  const allNotifications = (notificationsData?.notifs || []).filter(
    (n) => n.type !== "chat_request"
  );
  
  const filteredNotifications = allNotifications.filter(notif => {
    const matchesFilter = filter === 'all' || !notif.isRead;
    const matchesSearch = notif.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         notif.message.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const hasUnread = allNotifications.some(n => !n.isRead);

  return (
    <div className="flex-1 bg-[#F8F9FA] min-h-screen overflow-y-auto no-scrollbar pb-10">
      <div className="max-w-4xl mx-auto px-4 py-6 md:py-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-[#1A1A2E] flex items-center gap-3">
              <Bell className="w-7 h-7 text-[#7B61FF]" />
              Notifications
            </h1>
            <p className="text-[#757575] text-sm mt-1">Stay updated with your latest activities and alerts</p>
          </div>
          <div className="flex items-center gap-3">
            {hasUnread && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                disabled={isMarkingAllRead}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-[#E0E0E0] rounded-xl text-sm font-medium text-[#1A1A2E] hover:bg-[#F5F5F5] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Check className="w-4 h-4" />
                {isMarkingAllRead ? "Marking..." : "Mark all as read"}
              </button>
            )}
            <button className="p-2 bg-white border border-[#E0E0E0] rounded-xl hover:bg-[#F5F5F5] transition-colors text-[#757575]">
              <MoreHorizontal className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="bg-white rounded-2xl border border-[#E0E0E0] p-4 mb-6 flex flex-col sm:flex-row items-center gap-4">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#757575]" />
            <input 
              type="text" 
              placeholder="Search notifications..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-11 bg-[#F5F5F5] border-none rounded-xl pl-10 pr-4 text-sm focus:ring-2 focus:ring-[#7B61FF]/20 transition-all"
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button 
              onClick={() => setFilter('all')}
              className={`flex items-center gap-2 px-4 h-11 rounded-xl text-sm font-bold border transition-all ${
                filter === 'all' 
                ? 'bg-[#F0ECF9] text-[#7B61FF] border-[#E0D9F0]' 
                : 'bg-white text-[#757575] border-[#E0E0E0] hover:bg-[#F5F5F5]'
              }`}
            >
              <Filter className="w-4 h-4" />
              All
            </button>
            <button 
              onClick={() => setFilter('unread')}
              className={`px-4 h-11 rounded-xl text-sm font-medium border transition-all ${
                filter === 'unread' 
                ? 'bg-[#F0ECF9] text-[#7B61FF] border-[#E0D9F0]' 
                : 'bg-white text-[#757575] border-[#E0E0E0] hover:bg-[#F5F5F5]'
              }`}
            >
              Unread
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="bg-white rounded-2xl border border-[#E0E0E0] overflow-hidden shadow-sm min-h-[400px]">
          {isLoading ? (
            <div className="p-20 text-center">
              <div className="w-10 h-10 border-4 border-[#7B61FF]/20 border-t-[#7B61FF] rounded-full animate-spin mx-auto mb-4" />
              <p className="text-sm text-[#94A3B8] font-bold">Loading notifications...</p>
            </div>
          ) : filteredNotifications.length > 0 ? (
            filteredNotifications.map((notif, index) => (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                key={notif._id} 
                className={`p-5 flex gap-4 hover:bg-[#F9F9F9] transition-colors cursor-pointer border-b border-[#F0F0F0] last:border-0 relative ${!notif.isRead ? 'bg-[#F0ECF9]/10' : ''}`}
              >
                {!notif.isRead && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#7B61FF]"></div>
                )}
                
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                  notif.type === 'post_approved' ? 'bg-green-100 text-green-600' :
                  notif.type === 'admin_pinned' ? 'bg-blue-100 text-blue-600' :
                  notif.type === 'chat_request' ? 'bg-purple-100 text-purple-600' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  <Bell className="w-6 h-6" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1 gap-2">
                    <div>
                      <h4 className={`text-[15px] font-bold text-[#1A1A2E] ${!notif.isRead ? 'font-black' : ''}`}>
                        {notif.title}
                      </h4>
                    </div>
                    <span className="text-xs text-[#9E9E9E] whitespace-nowrap">{formatRelativeTime(notif.timestamp)}</span>
                  </div>
                  <p className="text-sm text-[#757575] leading-relaxed">
                    {notif.message}
                  </p>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="p-20 text-center">
              <Bell className="w-12 h-12 text-[#E2E8F0] mx-auto mb-4 opacity-50" />
              <h3 className="text-[#1A1A2E] font-bold mb-1">No notifications found</h3>
              <p className="text-sm text-[#94A3B8]">We'll alert you when something interesting happens.</p>
            </div>
          )}
        </div>

        {/* Load More Mock - Could be paginated later */}
        {filteredNotifications.length > 10 && (
          <div className="mt-8 text-center">
            <button className="px-8 py-3 bg-white border border-[#E0E0E0] rounded-xl text-sm font-bold text-[#1A1A2E] hover:bg-[#F5F5F5] transition-all shadow-sm">
              Load Older Notifications
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

