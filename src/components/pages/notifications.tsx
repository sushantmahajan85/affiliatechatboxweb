"use client";
import { Bell, Check, MoreHorizontal, Filter, Search, ChevronRight } from "lucide-react";
import { motion } from "motion/react";

const NOTIFICATIONS = [
  { id: 1, title: "New Partner Connection", description: "Tech Solutions sent you a connect request for the upcoming Q4 campaign. They are interested in your affiliate network reach.", time: "2m ago", read: false, category: "Partners" },
  { id: 2, title: "System Update", description: "Version 2.4.0 is now live with new features including real-time analytics and enhanced reporting tools. Check out the dashboard for details.", time: "1h ago", read: true, category: "System" },
  { id: 3, title: "Security Alert", description: "New login detected from a new device in San Francisco, CA. If this wasn't you, please secure your account immediately.", time: "5h ago", read: true, category: "Security" },
  { id: 4, title: "Campaign Milestone", description: "Your 'Summer Deals' campaign has reached 10,000 clicks! Congratulations on this significant achievement.", time: "1d ago", read: true, category: "Performance" },
  { id: 5, title: "Payout Processed", description: "Your payout for the month of February has been successfully processed and sent to your bank account.", time: "2d ago", read: true, category: "Financial" },
  { id: 6, title: "New Message", description: "Sarah Miller sent you a message: 'Hey Alex, are we still on for the meeting tomorrow at 10 AM?'", time: "3d ago", read: true, category: "Messages" },
  { id: 7, title: "Account Verification", description: "Your LinkedIn verification has been successfully processed. Your profile now shows the verified badge.", time: "1w ago", read: true, category: "Account" },
];

export function NotificationsPage() {
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
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-[#E0E0E0] rounded-xl text-sm font-medium text-[#1A1A2E] hover:bg-[#F5F5F5] transition-colors">
              <Check className="w-4 h-4" />
              Mark all as read
            </button>
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
              className="w-full h-11 bg-[#F5F5F5] border-none rounded-xl pl-10 pr-4 text-sm focus:ring-2 focus:ring-[#7B61FF]/20 transition-all"
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button className="flex items-center gap-2 px-4 h-11 bg-[#F0ECF9] text-[#7B61FF] rounded-xl text-sm font-bold border border-[#E0D9F0]">
              <Filter className="w-4 h-4" />
              All
            </button>
            <button className="px-4 h-11 bg-white text-[#757575] rounded-xl text-sm font-medium hover:bg-[#F5F5F5] transition-colors">
              Unread
            </button>
            <button className="px-4 h-11 bg-white text-[#757575] rounded-xl text-sm font-medium hover:bg-[#F5F5F5] transition-colors">
              Archived
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="bg-white rounded-2xl border border-[#E0E0E0] overflow-hidden shadow-sm">
          {NOTIFICATIONS.map((notif, index) => (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              key={notif.id} 
              className={`p-5 flex gap-4 hover:bg-[#F9F9F9] transition-colors cursor-pointer border-b border-[#F0F0F0] last:border-0 relative ${!notif.read ? 'bg-[#F0ECF9]/20' : ''}`}
            >
              {!notif.read && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#7B61FF]"></div>
              )}
              
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                notif.category === 'Partners' ? 'bg-blue-100 text-blue-600' :
                notif.category === 'System' ? 'bg-purple-100 text-purple-600' :
                notif.category === 'Security' ? 'bg-red-100 text-red-600' :
                'bg-gray-100 text-gray-600'
              }`}>
                <Bell className="w-6 h-6" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-1 gap-2">
                  <div>
                    {/* <span className="text-[10px] font-bold uppercase tracking-wider text-[#7B61FF] mb-1 block">
                      {notif.category}
                    </span> */}
                    <h4 className={`text-[15px] font-bold text-[#1A1A2E] ${!notif.read ? 'font-extrabold' : ''}`}>
                      {notif.title}
                    </h4>
                  </div>
                  <span className="text-xs text-[#9E9E9E] whitespace-nowrap">{notif.time}</span>
                </div>
                <p className="text-sm text-[#757575] leading-relaxed mb-3">
                  {notif.description}
                </p>
                {/* <div className="flex items-center gap-4">
                  <button className="text-xs font-bold text-[#7B61FF] hover:underline flex items-center gap-1">
                    View Details
                    <ChevronRight className="w-3 h-3" />
                  </button>
                  <button className="text-xs font-medium text-[#757575] hover:text-[#1A1A2E]">
                    Archive
                  </button>
                </div> */}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Load More */}
        <div className="mt-8 text-center">
          <button className="px-8 py-3 bg-white border border-[#E0E0E0] rounded-xl text-sm font-bold text-[#1A1A2E] hover:bg-[#F5F5F5] transition-all shadow-sm">
            Load Older Notifications
          </button>
        </div>
      </div>
    </div>
  );
}

