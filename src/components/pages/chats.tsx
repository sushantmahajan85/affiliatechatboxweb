"use client";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";
import { clsx } from "clsx";
import {
  ArrowLeft,
  CheckCheck,
  MoreVertical,
  Paperclip,
  Phone,
  Search,
  Send,
  Smile,
  User,
  Video
} from "lucide-react";
import { motion } from "motion/react";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const CHATS_MOCK = [
  {
    id: 1,
    name: "Alex Johnson",
    avatar: "https://images.unsplash.com/photo-1584800526920-35d8a0409deb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBwb3J0cmFpdCUyMG1hbiUyMHdvbWFuJTIwaGVhZHNob3QlMjBhdmF0YXJ8ZW58MXx8fHwxNzc0NjAzOTMxfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    lastMessage: "I'll check the ROI and get back to you by tomorrow afternoon.",
    time: "10:45 AM",
    unreadCount: 0,
    online: true,
    tab: "messages"
  },
  {
    id: 2,
    name: "Sarah Miller",
    avatar: "https://images.unsplash.com/photo-1675186914580-94356f7c012c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzbWlsaW5nJTIwYnVzaW5lc3MlMjB3b21hbiUyMHBvcnRyYWl0JTIwYXZhdGFyfGVufDF8fHx8MTc3NDYwMzkzNHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    lastMessage: "The high-ticket SaaS offers are looking very promising right now.",
    time: "9:20 AM",
    unreadCount: 3,
    online: false,
    tab: "messages"
  },
  {
    id: 3,
    name: "James Wilson",
    avatar: "https://images.unsplash.com/photo-1628157588553-5eeea00af15c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx5b3VuZyUyMGVudHJlcHJlbmV1ciUyMG1hbiUyMHBvcnRyYWl0JTIwYXZhdGFyfGVufDF8fHx8MTc3NDYwMzkzNnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    lastMessage: "Thanks for the quality traffic sources. Let's discuss further.",
    time: "Yesterday",
    unreadCount: 0,
    online: true,
    tab: "messages"
  },
  {
    id: 4,
    name: "Marketing Lead",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=250&h=250&auto=format&fit=crop",
    lastMessage: "Interested in your affiliate program for SaaS tools.",
    time: "2:15 PM",
    unreadCount: 1,
    online: false,
    tab: "requests"
  },
  {
    id: 5,
    name: "E-commerce Partner",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=250&h=250&auto=format&fit=crop",
    lastMessage: "Hello! I saw your post about selling traffic.",
    time: "11:00 AM",
    unreadCount: 1,
    online: true,
    tab: "requests"
  }
];

const MESSAGE_HISTORY = {
  1: [
    { id: 1, text: "Hey Alex! How's the ROI looking on the new campaign?", sender: "me", time: "10:30 AM" },
    { id: 2, text: "It's improving. We're seeing about 15% increase since Monday.", sender: "them", time: "10:35 AM" },
    { id: 3, text: "That's great news. Any specific channels performing better?", sender: "me", time: "10:40 AM" },
    { id: 4, text: "I'll check the ROI and get back to you by tomorrow afternoon.", sender: "them", time: "10:45 AM" },
  ]
};

export function ChatsPage() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<"messages" | "requests">("messages");
  const [selectedChatId, setSelectedChatId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [messageInput, setMessageInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Handle incoming userId from navigation
  useEffect(() => {
    const userId = searchParams?.get("userId");
    if (userId) {
      const id = parseInt(userId);
      setSelectedChatId(id);
      
      // If it's a known chat, make sure the correct tab is active
      const chat = CHATS_MOCK.find(c => c.id === id);
      if (chat) {
        setActiveTab(chat.tab as "messages" | "requests");
      }
    }
  }, [searchParams]);

  // Combined data to handle chats not in the mock list
  const selectedChat = CHATS_MOCK.find(c => c.id === selectedChatId) || 
    (selectedChatId ? {
      id: selectedChatId,
      name: `User #${selectedChatId}`, // Fallback name
      avatar: "https://images.unsplash.com/photo-1633332755192-727a05c4013d?q=80&w=250",
      online: true,
      lastMessage: "",
      time: "Now",
      unreadCount: 0,
      tab: "messages"
    } : null);
  const filteredChats = CHATS_MOCK.filter(chat => 
    chat.tab === activeTab && 
    chat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const requestCount = CHATS_MOCK.filter(c => c.tab === "requests").length;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedChatId]);

  return (
    <div className="bg-white rounded-[14px] shadow-[0_2px_8px_rgba(0,0,0,0.06)] h-[calc(100vh-180px)] min-h-[500px] flex overflow-hidden border border-[#F3F4F6]">
      {/* Sidebar - Chat List */}
      <div className={clsx(
        "w-full md:w-[360px] flex flex-col border-r border-[#F3F4F6] transition-all",
        selectedChatId !== null && "hidden md:flex"
      )}>
        {/* Header with Tabs */}
        <div className="p-4 border-b border-[#F3F4F6] bg-white">
          <h1 className="text-[20px] font-bold text-[#1A1A2E] mb-4">Chats</h1>
          
          <div className="flex gap-4 border-b border-[#F3F4F6]">
            <button 
              onClick={() => setActiveTab("messages")}
              className={clsx(
                "pb-3 text-[14px] font-semibold relative transition-colors",
                activeTab === "messages" ? "text-[#0A7EA4]" : "text-[#9E9E9E] hover:text-[#1A1A2E]"
              )}
            >
              All Messages
              {activeTab === "messages" && (
                <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#0A7EA4]" />
              )}
            </button>
            <button 
              onClick={() => setActiveTab("requests")}
              className={clsx(
                "pb-3 text-[14px] font-semibold relative transition-colors flex items-center gap-1.5",
                activeTab === "requests" ? "text-[#0A7EA4]" : "text-[#9E9E9E] hover:text-[#1A1A2E]"
              )}
            >
              All Request
              {requestCount > 0 && (
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              )}
              {activeTab === "requests" && (
                <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#0A7EA4]" />
              )}
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="p-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9E9E9E]" />
            <input 
              type="text"
              placeholder="Search chat"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 bg-[#F5F7FB] border-none rounded-xl pl-10 pr-4 text-[14px] focus:ring-2 focus:ring-[#0A7EA4]/20 outline-none transition-all"
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto no-scrollbar">
          {filteredChats.map((chat) => (
            <div 
              key={chat.id}
              onClick={() => setSelectedChatId(chat.id)}
              className={clsx(
                "flex items-center gap-3 p-4 cursor-pointer transition-colors border-l-4",
                selectedChatId === chat.id 
                  ? "bg-[#F0F7F9] border-[#0A7EA4]" 
                  : "bg-white border-transparent hover:bg-[#F9FAFB]"
              )}
            >
              <div className="relative shrink-0">
                <div className="w-12 h-12 rounded-full overflow-hidden border border-[#E0E0E0]">
                  <ImageWithFallback src={chat.avatar} alt={chat.name} className="w-full h-full object-cover" />
                </div>
                {chat.online && (
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-[#4ADE80] border-2 border-white rounded-full" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center mb-0.5">
                  <span className="font-bold text-[14px] text-[#1A1A2E] truncate">{chat.name}</span>
                  <span className="text-[11px] text-[#9E9E9E]">{chat.time}</span>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-[13px] text-[#757575] truncate mr-2">{chat.lastMessage}</p>
                  {chat.unreadCount > 0 && (
                    <span className="bg-[#0A7EA4] text-white text-[10px] font-bold min-w-[18px] h-[18px] rounded-full flex items-center justify-center px-1">
                      {chat.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}

          {filteredChats.length === 0 && (
            <div className="p-8 text-center text-[#9E9E9E] text-[14px]">
              No {activeTab} found
            </div>
          )}
        </div>
      </div>

      {/* Chat Panel - WhatsApp Style */}
      <div className={clsx(
        "flex-1 flex flex-col bg-[#F5F7FB] relative overflow-hidden",
        selectedChatId === null && "hidden md:flex"
      )}>
        {selectedChat ? (
          <>
            {/* Chat Header */}
            <div className="h-[72px] bg-white border-b border-[#F3F4F6] flex items-center justify-between px-4 z-10 shrink-0">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setSelectedChatId(null)}
                  className="md:hidden p-1 mr-1 text-[#757575]"
                >
                  <ArrowLeft className="w-6 h-6" />
                </button>
                <div className="relative">
                  <div className="w-10 h-10 rounded-full overflow-hidden border border-[#E0E0E0]">
                    <ImageWithFallback src={selectedChat.avatar} alt={selectedChat.name} className="w-full h-full object-cover" />
                  </div>
                  {selectedChat.online && (
                    <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[#4ADE80] border-2 border-white rounded-full" />
                  )}
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-[15px] text-[#1A1A2E]">{selectedChat.name}</span>
                  <span className="text-[12px] text-[#4ADE80] font-medium">
                    {selectedChat.online ? "Online" : "Away"}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="p-2 text-[#757575] hover:bg-[#F5F7FB] rounded-full transition-colors">
                  <Phone className="w-5 h-5" />
                </button>
                <button className="p-2 text-[#757575] hover:bg-[#F5F7FB] rounded-full transition-colors">
                  <Video className="w-5 h-5" />
                </button>
                <button className="p-2 text-[#757575] hover:bg-[#F5F7FB] rounded-full transition-colors">
                  <MoreVertical className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar bg-[#E5DDD5] relative" style={{ 
              backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")',
              backgroundRepeat: 'repeat',
              backgroundSize: '400px',
              backgroundColor: '#efe7dd'
            }}>
              <div className="absolute inset-0 bg-white/40 pointer-events-none" />
              
              {/* Date Separator */}
              <div className="relative flex justify-center my-6 z-10">
                <span className="px-3 py-1 bg-white/90 text-[#54656f] text-[12px] font-medium rounded-lg shadow-sm uppercase">Today</span>
              </div>

              <div className="relative z-10 space-y-3">
                {(MESSAGE_HISTORY[selectedChatId as keyof typeof MESSAGE_HISTORY] || []).map((msg) => (
                  <div 
                    key={msg.id}
                    className={clsx(
                      "flex",
                      msg.sender === "me" ? "justify-end" : "justify-start"
                    )}
                  >
                    <div className={clsx(
                      "max-w-[85%] md:max-w-[70%] px-3 py-2 rounded-lg shadow-[0_1px_0.5px_rgba(0,0,0,0.13)] relative",
                      msg.sender === "me" 
                        ? "bg-[#D9FDD3] text-[#111b21] rounded-tr-none" 
                        : "bg-white text-[#111b21] rounded-tl-none"
                    )}>
                      <p className="text-[14px] leading-tight pb-2">{msg.text}</p>
                      <div className="flex items-center justify-end gap-1 -mt-1">
                        <span className="text-[11px] text-[#667781]">{msg.time}</span>
                        {msg.sender === "me" && (
                          <CheckCheck className="w-3.5 h-3.5 text-[#53bdeb]" />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Input Bar */}
            <div className="h-[62px] bg-[#F0F2F5] px-4 flex items-center gap-3 shrink-0">
              <button className="text-[#54656f] hover:text-[#111b21] transition-colors">
                <Smile className="w-6 h-6" />
              </button>
              <button className="text-[#54656f] hover:text-[#111b21] transition-colors">
                <Paperclip className="w-6 h-6" />
              </button>
              <div className="flex-1">
                <input 
                  type="text"
                  placeholder="Type a message"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && messageInput.trim()) {
                      // Logic to send would go here
                      setMessageInput("");
                    }
                  }}
                  className="w-full h-10 bg-white border-none rounded-lg px-4 text-[15px] focus:outline-none placeholder:text-[#94a3b8]"
                />
              </div>
              <button 
                className={clsx(
                  "w-10 h-10 flex items-center justify-center rounded-full transition-colors",
                  messageInput.trim() ? "bg-[#00a884] text-white" : "text-[#54656f]"
                )}
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-[#F8F9FA]">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-sm mb-6">
              <User className="w-10 h-10 text-[#0A7EA4]" />
            </div>
            <h2 className="text-[20px] font-bold text-[#1A1A2E] mb-2">Select a chat to start messaging</h2>
            <p className="text-[#757575] max-w-xs mx-auto text-[14px]">
              Stay connected with your affiliate network and discuss new opportunities in real-time.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}


