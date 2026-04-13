"use client";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function SettingsPage() {
  const router = useRouter();
  const [chatEnabled, setChatEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(true);

  const Toggle = ({ enabled, setEnabled }: { enabled: boolean; setEnabled: (v: boolean) => void }) => (
    <button 
      onClick={() => setEnabled(!enabled)}
      className={`relative w-[48px] h-[24px] rounded-full transition-colors duration-200 outline-none ${
        enabled ? "bg-[#1C3A4A]" : "bg-[#D1D1D1]"
      }`}
    >
      <motion.div
        animate={{ x: enabled ? 26 : 2 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        className="absolute top-[2px] left-0 w-[20px] h-[20px] bg-white rounded-full shadow-sm"
      />
    </button>
  );

  return (
    <div className="sm:-m-8 p-6 flex flex-col font-sans">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8 pt-2">
        <button 
          onClick={() => router.back()}
          className="p-1 hover:bg-[#1C3A4A]/5 rounded-full transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-[#1A1A1A]" strokeWidth={2.5} />
        </button>
        <h1 className="text-[24px] font-bold text-[#1A1A1A]">Notification Settings</h1>
      </div>

      {/* Settings Card */}
      <div className="bg-white rounded-[16px] shadow-[0_4px_12px_rgba(0,0,0,0.04)] overflow-hidden">
        
        {/* Push Notifications Row */}
        <div 
          onClick={() => {}} 
          className="flex items-center justify-between px-5 py-[22px] cursor-pointer hover:bg-gray-50 transition-colors"
        >
          <div className="flex flex-col gap-0.5">
            <span className="text-[16px] font-bold text-[#1A1A1A]">Push Notifications</span>
            <span className="text-[13px] text-[#757575]">Receive push notifications</span>
          </div>
          <ChevronRight className="w-5 h-5 text-[#B0B0B0]" />
        </div>

        <div className="h-[1px] bg-[#EEEEEE] mx-5" />

        {/* Chat Notifications Row */}
        <div className="flex items-center justify-between px-5 py-[22px]">
          <div className="flex flex-col gap-0.5">
            <span className="text-[16px] font-bold text-[#1A1A1A]">Chat Notifications</span>
            <span className="text-[13px] text-[#757575]">Receive push notifications</span>
          </div>
          <Toggle enabled={chatEnabled} setEnabled={setChatEnabled} />
        </div>

        <div className="h-[1px] bg-[#EEEEEE] mx-5" />

        {/* Email Notifications Row */}
        <div className="flex items-center justify-between px-5 py-[22px]">
          <div className="flex flex-col gap-0.5 max-w-[70%]">
            <span className="text-[16px] font-bold text-[#1A1A1A]">Email Notifications</span>
            <span className="text-[13px] text-[#757575] leading-[1.4]">
              Receive emails about chat requests and new posts
            </span>
          </div>
          <Toggle enabled={emailEnabled} setEnabled={setEmailEnabled} />
        </div>

      </div>

      {/* Additional Android-style space at bottom */}
      <div className="mt-auto py-8 text-center">
        <p className="text-[12px] text-[#A0A0A0] uppercase tracking-wider font-medium">Notification Preferences v1.0</p>
      </div>
    </div>
  );
}


