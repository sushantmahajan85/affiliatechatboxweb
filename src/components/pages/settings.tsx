"use client";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import {
  browserNotificationsSupported,
  getDesktopChatNotificationsEnabled,
  getDesktopPushMasterEnabled,
  requestBrowserNotificationPermission,
  setDesktopChatNotificationsEnabled,
  setDesktopPushMasterEnabled,
} from "@/lib/web-desktop-notifications";
import { getFirebaseWebVapidKey, syncWebFcmTokenToServer } from "@/lib/fcm-web";
import { useAppSelector } from "@/store/hooks";
import { useSaveEmailNotifPrefMutation } from "@/store/endpoints/members";

type SettingsToggleProps = {
  enabled: boolean;
  setEnabled: (v: boolean) => void;
};

function SettingsToggle({ enabled, setEnabled }: SettingsToggleProps) {
  return (
    <button
      type="button"
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
}

export function SettingsPage() {
  const router = useRouter();
  const { userId: authUserId, user, token } = useAppSelector((s) => s.auth);
  const uid = authUserId || user?._id || "";
  const [pushMaster, setPushMaster] = useState(() => getDesktopPushMasterEnabled());
  const [chatEnabled, setChatEnabled] = useState(() =>
    getDesktopChatNotificationsEnabled()
  );
  const [emailEnabled, setEmailEnabled] = useState(() =>
    user?.isEmailNotifAllowed !== false
  );
  const [emailSaving, setEmailSaving] = useState(false);
  const [permLabel, setPermLabel] = useState<string | null>(null);
  const [saveEmailPref] = useSaveEmailNotifPrefMutation();

  const onPushMasterChange = useCallback(async (next: boolean) => {
    if (next) {
      if (!browserNotificationsSupported()) {
        setPermLabel("This browser does not support notifications.");
        return;
      }
      const p = await requestBrowserNotificationPermission();
      if (p !== "granted") {
        setPermLabel("Permission denied — enable notifications in the browser site settings.");
        return;
      }
      if (!getFirebaseWebVapidKey()) {
        setPermLabel(
          "Add NEXT_PUBLIC_FIREBASE_VAPID_KEY (Firebase Console → Project settings → Cloud Messaging → Web Push certificates)."
        );
        return;
      }
      if (!uid || !token) {
        setPermLabel("You must be logged in on this browser to register Firebase web push.");
        return;
      }
      const saved = await syncWebFcmTokenToServer(uid, token);
      if (!saved) {
        setPermLabel(
          "Notifications are allowed, but the web device token could not be saved. Deploy the API (webFcmToken field + /update_web_fcm_token) and try again."
        );
        return;
      }
      setDesktopPushMasterEnabled(true);
      setPushMaster(true);
      setPermLabel(null);
      return;
    }
    setDesktopPushMasterEnabled(false);
    setPushMaster(false);
    setPermLabel(null);
  }, [uid, token]);

  const onChatToggle = useCallback((next: boolean) => {
    setDesktopChatNotificationsEnabled(next);
    setChatEnabled(next);
  }, []);

  const onEmailToggle = useCallback(async (next: boolean) => {
    if (!uid) return;
    setEmailEnabled(next);
    setEmailSaving(true);
    try {
      await saveEmailPref({ userId: uid, isAllowed: next }).unwrap();
    } catch {
      setEmailEnabled(!next);
    } finally {
      setEmailSaving(false);
    }
  }, [uid, saveEmailPref]);

  return (
    <div className="sm:-m-8 p-6 flex flex-col font-sans">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8 pt-2">
        <button 
          type="button"
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
        <div className="flex items-center justify-between px-5 py-[22px]">
          <div className="flex flex-col gap-0.5 max-w-[70%]">
            <span className="text-[16px] font-bold text-[#1A1A1A]">Push Notifications</span>
            <span className="text-[13px] text-[#757575]">
              Firebase web push (same FCM pipeline as the Android app): works in the background and when the tab is closed (if the browser allows).
            </span>
            {permLabel && (
              <span className="text-[12px] text-amber-700 mt-1">{permLabel}</span>
            )}
          </div>
          <SettingsToggle enabled={pushMaster} setEnabled={onPushMasterChange} />
        </div>

        <div className="h-1px bg-[#EEEEEE] mx-5" />

        {/* Chat Notifications Row */}
        <div className="flex items-center justify-between px-5 py-[22px]">
          <div className="flex flex-col gap-0.5 max-w-[70%]">
            <span className="text-[16px] font-bold text-[#1A1A1A]">Chat Notifications</span>
            <span className="text-[13px] text-[#757575]">
              Desktop alerts for new unread messages
            </span>
          </div>
          <SettingsToggle enabled={chatEnabled} setEnabled={onChatToggle} />
        </div>

        <div className="h-1px bg-[#EEEEEE] mx-5" />

        {/* Email Notifications Row */}
        <div className="flex items-center justify-between px-5 py-[22px]">
          <div className="flex flex-col gap-0.5 max-w-[70%]">
            <span className="text-[16px] font-bold text-[#1A1A1A]">Email Notifications</span>
            <span className="text-[13px] text-[#757575] leading-[1.4]">
              Receive emails about chat messages and new posts
            </span>
            {emailSaving && (
              <span className="text-[12px] text-[#0A7EA4] mt-1">Saving…</span>
            )}
          </div>
          <SettingsToggle enabled={emailEnabled} setEnabled={onEmailToggle} />
        </div>

        <div className="h-[1px] bg-[#EEEEEE] mx-5" />

        <button
          type="button"
          onClick={() => router.push("/notifications")}
          className="flex items-center justify-between px-5 py-[22px] cursor-pointer hover:bg-gray-50 transition-colors w-full text-left"
        >
          <span className="text-[16px] font-bold text-[#1A1A1A]">View in-app notifications</span>
          <ChevronRight className="w-5 h-5 text-[#B0B0B0]" />
        </button>

      </div>

      {/* Additional Android-style space at bottom */}
      <div className="mt-auto py-8 text-center">
        <p className="text-[12px] text-[#A0A0A0] uppercase tracking-wider font-medium">Notification Preferences v1.0</p>
      </div>
    </div>
  );
}
