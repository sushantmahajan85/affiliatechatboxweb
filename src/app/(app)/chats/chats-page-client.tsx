"use client";

import dynamic from "next/dynamic";

const ChatsPage = dynamic(
  () => import("@/components/pages/chats").then((mod) => mod.ChatsPage),
  {
    ssr: false,
    loading: () => (
      <div className="bg-white rounded-[14px] shadow-[0_2px_8px_rgba(0,0,0,0.06)] h-[calc(100vh-180px)] min-h-[500px] flex items-center justify-center border border-[#F3F4F6]">
        <p className="text-[#9E9E9E] text-[14px]">Loading chats…</p>
      </div>
    ),
  }
);

export function ChatsPageClient() {
  return <ChatsPage />;
}
