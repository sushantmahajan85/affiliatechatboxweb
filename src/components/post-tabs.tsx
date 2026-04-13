"use client";
import { useState } from "react";
import { clsx } from "clsx";

import { useAppSelector } from "@/store/hooks";

interface PostTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function PostTabs({ activeTab, onTabChange }: PostTabsProps) {
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  return (
    <div className="border-b border-[#E0E0E0] flex gap-2 mb-4">
      <button
        onClick={() => onTabChange("all")}
        className={clsx(
          "px-5 py-2.5 text-[15px] transition-all relative",
          activeTab === "all" 
            ? "font-bold text-[#1A1A2E]" 
            : "text-[#9E9E9E]"
        )}
      >
        All Posts
        {activeTab === "all" && (
          <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#0A7EA4]" />
        )}
      </button>
      
      {isAuthenticated && (
        <button
          onClick={() => onTabChange("my")}
          className={clsx(
            "px-5 py-2.5 text-[15px] transition-all relative",
            activeTab === "my" 
              ? "font-bold text-[#1A1A2E]" 
              : "text-[#9E9E9E]"
          )}
        >
          My Posts
          {activeTab === "my" && (
            <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#0A7EA4]" />
          )}
        </button>
      )}
    </div>
  );
}

