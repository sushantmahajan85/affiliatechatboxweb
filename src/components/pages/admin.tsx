"use client";
import { useState, useRef, useEffect } from "react";
import { 
  MoreVertical, 
  Send, 
  Paperclip, 
  Smile, 
  CheckCheck,
  Phone,
  Video,
  ShieldCheck,
  Info
} from "lucide-react";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";
import { clsx } from "clsx";
import { motion } from "motion/react";

const ADMIN_PROFILE = {
  id: "admin_support",
  name: "Affiliate System Admin",
  role: "Official Support & Verification",
  avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=250",
  online: true,
  status: "Usually responds in minutes"
};

const INITIAL_MESSAGES = [
  { id: 1, text: "Hello! Welcome to Affiliate Chat Box support.", sender: "them", time: "09:00 AM" },
  { id: 2, text: "How can we assist you with your affiliate marketing journey today?", sender: "them", time: "09:00 AM" },
];

export function AdminPage() {
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [messageInput, setMessageInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
    if (!messageInput.trim()) return;

    const newMessage = {
      id: Date.now(),
      text: messageInput,
      sender: "me" as const,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages([...messages, newMessage]);
    setMessageInput("");

    // Mock auto-reply
    setTimeout(() => {
      const reply = {
        id: Date.now() + 1,
        text: "Thank you for reaching out! One of our administrators will review your message and get back to you shortly.",
        sender: "them" as const,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, reply]);
    }, 1500);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-180px)] min-h-[500px] bg-white rounded-[14px] shadow-[0_2px_8px_rgba(0,0,0,0.06)] overflow-hidden border border-[#F3F4F6]">
      {/* Header */}
      <div className="h-[72px] bg-white border-b border-[#F3F4F6] flex items-center justify-between px-6 z-10 shrink-0">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-11 h-11 rounded-full overflow-hidden border-2 border-[#0A7EA4]/10">
              <ImageWithFallback src={ADMIN_PROFILE.avatar} alt={ADMIN_PROFILE.name} className="w-full h-full object-cover" />
            </div>
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-[#4ADE80] border-2 border-white rounded-full" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-bold text-[16px] text-[#1A1A2E]">{ADMIN_PROFILE.name}</span>
              <ShieldCheck className="w-4 h-4 text-[#0A7EA4]" />
            </div>
            <span className="text-[12px] text-[#757575] font-medium flex items-center gap-1">
               <span className="w-1.5 h-1.5 bg-[#4ADE80] rounded-full" />
               Online • {ADMIN_PROFILE.status}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="hidden sm:flex p-2.5 text-[#757575] hover:bg-[#F5F7FB] rounded-full transition-colors">
            <Phone className="w-5 h-5" />
          </button>
          <button className="hidden sm:flex p-2.5 text-[#757575] hover:bg-[#F5F7FB] rounded-full transition-colors">
            <Video className="w-5 h-5" />
          </button>
          <button className="p-2.5 text-[#757575] hover:bg-[#F5F7FB] rounded-full transition-colors">
            <Info className="w-5 h-5" />
          </button>
          <button className="p-2.5 text-[#757575] hover:bg-[#F5F7FB] rounded-full transition-colors">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 no-scrollbar bg-[#E5DDD5] relative" style={{ 
        backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")',
        backgroundRepeat: 'repeat',
        backgroundSize: '400px',
        backgroundColor: '#efe7dd'
      }}>
        <div className="absolute inset-0 bg-white/40 pointer-events-none" />
        
        {/* Support Banner */}
        <div className="relative flex flex-col items-center justify-center my-6 z-10 space-y-2">
          <span className="px-4 py-1.5 bg-[#FFF9C4] text-[#856404] text-[12px] font-medium rounded-lg shadow-sm border border-[#FFEE58] max-w-[90%] text-center">
             Messages are encrypted and visible only to the support team.
          </span>
          <span className="px-3 py-1 bg-white/90 text-[#54656f] text-[12px] font-medium rounded-lg shadow-sm uppercase">Yesterday</span>
        </div>

        <div className="relative z-10 space-y-4">
          {messages.map((msg) => (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              key={msg.id}
              className={clsx(
                "flex",
                msg.sender === "me" ? "justify-end" : "justify-start"
              )}
            >
              <div className={clsx(
                "max-w-[85%] md:max-w-[70%] px-4 py-2.5 rounded-[12px] shadow-[0_1px_0.5px_rgba(0,0,0,0.13)] relative",
                msg.sender === "me" 
                  ? "bg-[#D9FDD3] text-[#111b21] rounded-tr-none" 
                  : "bg-white text-[#111b21] rounded-tl-none"
              )}>
                <p className="text-[14px] sm:text-[15px] leading-relaxed pb-2 whitespace-pre-wrap">{msg.text}</p>
                <div className="flex items-center justify-end gap-1.5 -mt-1">
                  <span className="text-[10px] text-[#667781] font-medium">{msg.time}</span>
                  {msg.sender === "me" && (
                    <CheckCheck className="w-3.5 h-3.5 text-[#53bdeb]" />
                  )}
                </div>
              </div>
            </motion.div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Bar */}
      <div className="bg-[#F0F2F5] px-4 py-3 flex items-center gap-3 shrink-0">
        <button className="text-[#54656f] hover:text-[#111b21] transition-colors p-1.5">
          <Smile className="w-6 h-6" />
        </button>
        <button className="text-[#54656f] hover:text-[#111b21] transition-colors p-1.5">
          <Paperclip className="w-6 h-6" />
        </button>
        <div className="flex-1">
          <input 
            type="text"
            placeholder="Describe your issue or request..."
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSendMessage();
            }}
            className="w-full h-11 bg-white border-none rounded-xl px-5 text-[15px] focus:outline-none placeholder:text-[#94a3b8] shadow-sm"
          />
        </div>
        <button 
          onClick={handleSendMessage}
          disabled={!messageInput.trim()}
          className={clsx(
            "w-11 h-11 flex items-center justify-center rounded-full transition-all shadow-sm active:scale-95",
            messageInput.trim() ? "bg-[#0A7EA4] text-white" : "bg-[#E0E0E0] text-[#9E9E9E] cursor-not-allowed"
          )}
        >
          <Send className="w-5 h-5 ml-0.5" />
        </button>
      </div>
    </div>
  );
}


