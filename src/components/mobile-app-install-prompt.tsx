"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  dismissMobileAppInstallPrompt,
  getMobileAppStoreUrl,
  shouldShowMobileAppInstallPrompt,
} from "@/lib/mobile-app-install";
import { Smartphone } from "lucide-react";
import { useEffect, useState } from "react";

export function MobileAppInstallPrompt() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (shouldShowMobileAppInstallPrompt()) {
      setOpen(true);
    }
  }, []);

  const handleInstall = () => {
    window.open(getMobileAppStoreUrl(), "_blank", "noopener,noreferrer");
    setOpen(false);
  };

  const handleDismiss = () => {
    dismissMobileAppInstallPrompt();
    setOpen(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-md rounded-2xl border-[#E0E0E0]">
        <AlertDialogHeader className="text-left">
          <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E0F2F7] text-[#0A7EA4]">
            <Smartphone className="h-6 w-6" />
          </div>
          <AlertDialogTitle className="text-[20px] font-bold text-[#1A1A2E]">
            Get the Affiliate Chat Box app
          </AlertDialogTitle>
          <AlertDialogDescription className="text-[14px] leading-relaxed text-[#64748B]">
            Install our mobile app for a faster experience — chat, posts, and member
            directory on the go.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col gap-2 sm:flex-col">
          <AlertDialogAction
            onClick={handleInstall}
            className="h-11 w-full rounded-xl bg-[#0A7EA4] text-[15px] font-bold hover:bg-[#086d8c]"
          >
            Install app
          </AlertDialogAction>
          <AlertDialogCancel
            onClick={handleDismiss}
            className="h-11 w-full rounded-xl border-[#E0E0E0] text-[15px] font-bold text-[#64748B]"
          >
            Not now
          </AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
