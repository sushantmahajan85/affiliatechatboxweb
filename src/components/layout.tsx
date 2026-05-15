"use client";
import { useAppSelector } from "@/store/hooks";
import { ReactNode, useState } from "react";
import { AuthModal } from "./auth-modal";
import { Header } from "./header";
import { MessagingOverlay } from "./messaging-overlay";
import { PartnersSidebar } from "./partners-sidebar";
import { Sidebar } from "./sidebar";
import { ConnectionRequestModal } from "./connection-request-modal";
import { DesktopNotificationBridge } from "./desktop-notification-bridge";

export function AppLayout({ children }: { children: ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isPartnersOpen, setIsPartnersOpen] = useState(false);
  
  const activeChats = useAppSelector((state) => state.chat.activeChats);

  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const isLinkedInVerified = user?.isLinkedinVerified || false;

  // Chat is hidden for Guests and users who are NOT LinkedIn verified
  const showChat = isAuthenticated && isLinkedInVerified;

  return (
    <div className="flex h-screen bg-[#F0F2F5] font-sans text-[#1A1A2E] overflow-hidden">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      
      <div className="flex-1 flex flex-col min-w-0 h-full">
        <Header 
          onMenuClick={() => setIsSidebarOpen(true)} 
          onPartnersClick={() => setIsPartnersOpen(true)}
        />
        
        <div className="flex-1 flex overflow-hidden relative">
          <main className="flex-1 p-4 md:p-6 overflow-y-auto relative no-scrollbar">
            <div className="max-w-[1000px] mx-auto overflow-hidden no-scrollbar">
              <style>{`
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
              `}</style>
              {children}
            </div>
          </main>
          
          <PartnersSidebar 
            isOpen={isPartnersOpen}
            onClose={() => setIsPartnersOpen(false)} activeChats={[]} setActiveChats={function (chats: any[]): void {
              throw new Error("Function not implemented.");
            } }          />

          {/* Messaging Windows & Bar - Floating outside sidebar clipping */}
          {showChat && (
            <MessagingOverlay />
          )}

          <AuthModal />
          <ConnectionRequestModal />
          {isAuthenticated && <DesktopNotificationBridge />}

          {/* Mobile Overlays */}
          {isSidebarOpen && (
            <div 
              className="fixed inset-0 bg-black/50 z-40 md:hidden"
              onClick={() => setIsSidebarOpen(false)}
            />
          )}
          {isPartnersOpen && (
            <div 
              className="fixed inset-0 bg-black/50 z-40 xl:hidden"
              onClick={() => setIsPartnersOpen(false)}
            />
          )}
        </div>
      </div>
    </div>
  );
}

