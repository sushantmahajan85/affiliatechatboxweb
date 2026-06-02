"use client";
import { clsx } from "clsx";
import {
  Apple,
  Building2,
  Headset,
  Home,
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
import appStoreQr from "@/imports/qr-code-appstore.png";
import { usePathname } from "next/navigation";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";

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

import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { openAuthModal } from "@/store/uiSlice";
import { isAuthRequiredMenuPath } from "@/lib/auth-guard-paths";

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showAppQrModal, setShowAppQrModal] = useState(false);
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  const handleProtectedNav = () => {
    dispatch(openAuthModal());
    if (window.innerWidth < 768) onClose?.();
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
            const requiresAuth = isAuthRequiredMenuPath(item.path);
            const navClassName = clsx(
              "flex items-center transition-colors w-full",
              isCollapsed ? "justify-center px-0 h-[52px]" : "gap-4 px-4 h-[52px] text-[15px]",
              isActive
                ? "bg-[#EEF2FF] text-[#1A1A2E] font-bold"
                : "text-[#757575] hover:bg-[#F5F5F5]",
            );

            if (requiresAuth && !isAuthenticated) {
              return (
                <button
                  key={item.path}
                  type="button"
                  onClick={handleProtectedNav}
                  className={navClassName}
                  title={isCollapsed ? item.label : ""}
                >
                  <item.icon className="w-5 h-5 shrink-0" />
                  {!isCollapsed && <span className="truncate">{item.label}</span>}
                </button>
              );
            }

            return (
              <Link
                key={item.path}
                href={item.path}
                onClick={() => {
                  if (window.innerWidth < 768) onClose?.();
                }}
                className={navClassName}
                title={isCollapsed ? item.label : ""}
              >
                <item.icon className="w-5 h-5 shrink-0" />
                {!isCollapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}

          {/* Download App Section - Hidden when collapsed */}
          {!isCollapsed && (
            <button
              type="button"
              onClick={() => setShowAppQrModal(true)}
              className="mx-4 mt-8 mb-4 w-[calc(100%-2rem)] p-4 bg-[#F5F0FA] rounded-2xl border border-[#E0D9F0] overflow-hidden text-left hover:border-[#0A7EA4] hover:shadow-md transition-all cursor-pointer group"
            >
              <p className="text-[13px] font-bold text-[#1A1A2E] mb-3 whitespace-nowrap group-hover:text-[#0A7EA4] transition-colors">
                Download Mobile App
              </p>
              <div className="grid grid-cols-2 gap-3 pointer-events-none">
                <div className="flex flex-col gap-2">
                  <div className="bg-white p-2 rounded-xl border border-[#E0D9F0] aspect-square flex items-center justify-center overflow-hidden shadow-sm">
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
                  <div className="bg-white p-2 rounded-xl border border-[#E0D9F0] aspect-square flex items-center justify-center overflow-hidden shadow-sm">
                    <ImageWithFallback
                      src={appStoreQr.src}
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
              <p className="text-[10px] text-[#757575] mt-3 text-center">Tap to enlarge QR codes</p>
            </button>
          )}
        </nav>

        <div className="mt-auto border-t border-[#E0E0E0]">
          {!isCollapsed ? (
            <div className="px-4 pt-3 pb-1 flex flex-col gap-1">
              <Link
                href="/privacy-policy"
                onClick={() => {
                  if (window.innerWidth < 768) onClose?.();
                }}
                className={clsx(
                  "text-[12px] text-[#757575] hover:text-[#0A7EA4] transition-colors py-1",
                  pathname === "/privacy-policy" && "text-[#0A7EA4] font-semibold"
                )}
              >
                Privacy Policy
              </Link>
              <Link
                href="/terms-of-service"
                onClick={() => {
                  if (window.innerWidth < 768) onClose?.();
                }}
                className={clsx(
                  "text-[12px] text-[#757575] hover:text-[#0A7EA4] transition-colors py-1",
                  pathname === "/terms-of-service" && "text-[#0A7EA4] font-semibold"
                )}
              >
                Terms of Service
              </Link>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1 py-2">
              <Link
                href="/privacy-policy"
                title="Privacy Policy"
                className={clsx(
                  "p-2 text-[#757575] hover:bg-[#F5F5F5] rounded-lg transition-colors text-[10px] font-bold",
                  pathname === "/privacy-policy" && "text-[#0A7EA4]"
                )}
              >
                PP
              </Link>
              <Link
                href="/terms-of-service"
                title="Terms of Service"
                className={clsx(
                  "p-2 text-[#757575] hover:bg-[#F5F5F5] rounded-lg transition-colors text-[10px] font-bold",
                  pathname === "/terms-of-service" && "text-[#0A7EA4]"
                )}
              >
                ToS
              </Link>
            </div>
          )}
        </div>
      </aside>

      <Dialog open={showAppQrModal} onOpenChange={setShowAppQrModal}>
        <DialogContent className="sm:max-w-[640px] p-0 gap-0 overflow-hidden border-[#E0D9F0] bg-white">
          <DialogHeader className="px-6 pt-6 pb-4 text-center sm:text-center border-b border-[#F0F0F0] bg-[#F5F0FA]">
            <DialogTitle className="text-xl font-bold text-[#1A1A2E]">
              Download Mobile App
            </DialogTitle>
            <DialogDescription className="text-sm text-[#757575] mt-1">
              Open your phone camera and scan the code for your platform
            </DialogDescription>
          </DialogHeader>

          <div className="p-6 sm:p-8 grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
            <div className="flex flex-col items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#E8F5E9] border border-[#C8E6C9]">
                <Smartphone className="w-4 h-4 text-[#2E7D32]" />
                <span className="text-sm font-bold text-[#1B5E20]">Android</span>
              </div>
              <div className="relative w-full max-w-[220px] aspect-square bg-white rounded-2xl border-2 border-[#E0D9F0] p-4 shadow-lg">
                <span className="absolute top-3 left-3 w-5 h-5 border-t-2 border-l-2 border-[#0A7EA4] rounded-tl-sm" />
                <span className="absolute top-3 right-3 w-5 h-5 border-t-2 border-r-2 border-[#0A7EA4] rounded-tr-sm" />
                <span className="absolute bottom-3 left-3 w-5 h-5 border-b-2 border-l-2 border-[#0A7EA4] rounded-bl-sm" />
                <span className="absolute bottom-3 right-3 w-5 h-5 border-b-2 border-r-2 border-[#0A7EA4] rounded-br-sm" />
                <ImageWithFallback
                  src={googlePlayQr.src}
                  alt="Google Play QR Code"
                  className="w-full h-full object-contain"
                />
              </div>
              <p className="text-xs text-[#757575] text-center leading-relaxed">
                Scan to download from Google Play
              </p>
            </div>

            <div className="flex flex-col items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#F5F5F5] border border-[#E0E0E0]">
                <Apple className="w-4 h-4 text-[#1A1A2E]" />
                <span className="text-sm font-bold text-[#1A1A2E]">iOS</span>
              </div>
              <div className="relative w-full max-w-[220px] aspect-square bg-white rounded-2xl border-2 border-[#E0D9F0] p-4 shadow-lg">
                <span className="absolute top-3 left-3 w-5 h-5 border-t-2 border-l-2 border-[#0A7EA4] rounded-tl-sm" />
                <span className="absolute top-3 right-3 w-5 h-5 border-t-2 border-r-2 border-[#0A7EA4] rounded-tr-sm" />
                <span className="absolute bottom-3 left-3 w-5 h-5 border-b-2 border-l-2 border-[#0A7EA4] rounded-bl-sm" />
                <span className="absolute bottom-3 right-3 w-5 h-5 border-b-2 border-r-2 border-[#0A7EA4] rounded-br-sm" />
                <ImageWithFallback
                  src={appStoreQr.src}
                  alt="App Store QR Code"
                  className="w-full h-full object-contain"
                />
              </div>
              <p className="text-xs text-[#757575] text-center leading-relaxed">
                Scan to download from the App Store
              </p>
            </div>
          </div>

          <div className="px-6 py-4 bg-[#FAFAFA] border-t border-[#F0F0F0] text-center">
            <p className="text-xs text-[#9E9E9E]">
              Hold your phone steady · Good lighting helps the scan succeed faster
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}



