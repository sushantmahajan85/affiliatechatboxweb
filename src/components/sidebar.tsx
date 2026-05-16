"use client";
import { clsx } from "clsx";
import {
  Apple,
  Building2,
  Headset,
  Home,
  LogOut,
  Menu,
  MessageSquare,
  Smartphone,
  User,
  Users,
  X
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import googlePlayQr from "@/imports/qr-code-google-playstore.png";
import { usePathname, useRouter } from "next/navigation";
import { ImageWithFallback } from "./figma/ImageWithFallback";

const MENU_ITEMS = [
  { icon: Home, label: "Home", path: "/" },
  { icon: User, label: "Profile", path: "/profile" },
  { icon: MessageSquare, label: "Chats", path: "/chats" },
  { icon: Headset, label: "Contact Admin", path: "/admin" },
  {
    icon: Users,
    label: "Member Directory",
    path: "/directory",
  },
  { icon: Building2, label: "Partners", path: "/partners" },
  // {
  //   icon: Bell,
  //   label: "Notification Settings",
  //   path: "/settings",
  // },
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

import { logout } from "@/store/authSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);

  const handleLogout = () => {
    dispatch(logout());
    router.push("/login");
  };

  return (
    <>
      <aside
        className={clsx(
          "bg-white border-r border-[#E0E0E0] flex flex-col h-full shrink-0 transition-all duration-300 z-50",
          "fixed md:sticky top-0 left-0 md:translate-x-0",
          isCollapsed ? "w-[72px]" : "w-[230px]",
          isOpen
            ? "translate-x-0 shadow-2xl"
            : "-translate-x-full",
        )}
      >
        <div className={clsx(
          "p-4 flex items-center gap-3",
          isCollapsed ? "justify-center" : "justify-between"
        )}>
          {!isCollapsed && (
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="flex items-center justify-center h-8">
                <ImageWithFallback
                  src="/assets/logo.png"
                  alt="Logo"
                  className="h-full w-auto object-contain"
                />
              </div>
            </div>
          )}
          
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="hidden md:flex p-2 text-[#757575] hover:bg-[#F5F5F5] rounded-lg transition-colors"
              title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              <Menu className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="md:hidden p-1 text-[#757575] hover:bg-[#F5F5F5] rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

     

        <nav className="flex-1 pt-4 overflow-y-auto no-scrollbar">
          {MENU_ITEMS.map((item) => {
            const isActive = pathname === item.path;
            return (
            <Link
              key={item.path}
              href={item.path}
              onClick={() => {
                if (window.innerWidth < 768) {
                  onClose?.();
                }
              }}
              className={clsx(
                "flex items-center transition-colors",
                isCollapsed ? "justify-center px-0 h-[52px]" : "gap-4 px-4 h-[52px] text-[15px]",
                isActive
                  ? "bg-[#EEF2FF] text-[#1A1A2E] font-bold"
                  : "text-[#757575] hover:bg-[#F5F5F5]",
              )}
              title={isCollapsed ? item.label : ""}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              {!isCollapsed && <span className="truncate">{item.label}</span>}
            </Link>
            )
          })}

          {/* Download App Section - Hidden when collapsed */}
          {!isCollapsed && (
            <div className="mx-4 mt-8 mb-4 p-4 bg-[#F5F0FA] rounded-2xl border border-[#E0D9F0] overflow-hidden">
              <p className="text-[13px] font-bold text-[#1A1A2E] mb-3 whitespace-nowrap">
                Download Mobile App
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-2">
                  <div className="bg-white p-2 rounded-xl border border-[#E0D9F0] aspect-square flex items-center justify-center overflow-hidden hover:border-[#0A7EA4] transition-colors cursor-pointer shadow-sm">
                    <ImageWithFallback
                      src={googlePlayQr.src}
                      alt="Google Play QR Code"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="flex items-center gap-1 px-1">
                    <Smartphone className="w-3 h-3 text-[#757575]" />
                    <span className="text-[10px] font-bold text-[#1A1A2E] whitespace-nowrap">
                      Android
                    </span>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <div className="bg-white p-2 rounded-xl border border-[#E0D9F0] aspect-square flex items-center justify-center overflow-hidden hover:border-[#0A7EA4] transition-colors cursor-pointer shadow-sm">
                    <ImageWithFallback
                      src={googlePlayQr.src}
                      alt="App Store QR Code"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="flex items-center gap-1 px-1">
                    <Apple className="w-3 h-3 text-[#757575]" />
                    <span className="text-[10px] font-bold text-[#1A1A2E] whitespace-nowrap">
                      iOS App
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </nav>

        <div className="mt-auto border-t border-[#E0E0E0]">
          <button
            onClick={handleLogout}
            className={clsx(
              "w-full flex items-center transition-colors",
              isCollapsed ? "justify-center h-[52px]" : "gap-4 px-4 h-[52px] text-[15px]",
              "text-[#757575] hover:bg-[#F5F5F5]"
            )}
            title={isCollapsed ? "Logout" : ""}
          >
            <LogOut className="w-5 h-5 shrink-0" />
            {!isCollapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>
    </>
  );
}



