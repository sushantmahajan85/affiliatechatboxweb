"use client";

import { useEffect, useRef } from "react";
import { useAppSelector } from "@/store/hooks";
import { useInboxPreviewChats } from "@/hooks/use-inbox-preview-chats";
import {
  getDesktopChatNotificationsEnabled,
  getDesktopPushMasterEnabled,
  tryShowDesktopNotification,
} from "@/lib/web-desktop-notifications";
import { getFirebaseWebVapidKey, subscribeForegroundFcm, syncWebFcmTokenToServer } from "@/lib/fcm-web";

export function DesktopNotificationBridge() {
  const { userId: authUserId, user: currentUser, isAuthenticated, token } = useAppSelector((s) => s.auth);
  const currentUserId = authUserId || currentUser?._id || "";

  const { recentChats, inboxReady, useFb } = useInboxPreviewChats();

  const lastUnreadByChatRef = useRef<Record<string, number>>({});
  const chatInitialRef = useRef(true);
  const lastUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (lastUserIdRef.current !== currentUserId) {
      lastUserIdRef.current = currentUserId || null;
      lastUnreadByChatRef.current = {};
      chatInitialRef.current = true;
    }
  }, [currentUserId]);

  useEffect(() => {
    if (!isAuthenticated || !currentUserId || !token) return;
    if (!getDesktopPushMasterEnabled()) return;
    if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
    if (!getFirebaseWebVapidKey()) return;

    let alive = true;
    let unsub: (() => void) | undefined;

    void (async () => {
      const result = await syncWebFcmTokenToServer(currentUserId, token);
      if (!alive) return;
      if (!result.ok) {
        console.warn("[fcm] Web push token was not saved:", result.reason);
      }
      const off = await subscribeForegroundFcm((title, body, url, tag) => {
        if (!alive || Notification.permission !== "granted") return;
        if (!getDesktopPushMasterEnabled()) return;
        try {
          const n = new Notification(title, { body, tag });
          n.onclick = () => {
            try {
              window.focus();
              window.location.assign(url);
            } finally {
              n.close();
            }
          };
        } catch {
          /* ignore */
        }
      });
      if (!alive) {
        off();
        return;
      }
      unsub = off;
    })();

    return () => {
      alive = false;
      unsub?.();
    };
  }, [isAuthenticated, currentUserId, token]);

  useEffect(() => {
    if (!isAuthenticated || !currentUserId) return;
    if (!inboxReady || !recentChats.length) return;
    if (!useFb) {
      recentChats.forEach((c) => {
        lastUnreadByChatRef.current[c.id] = c.unreadCount;
      });
      chatInitialRef.current = false;
      return;
    }

    if (chatInitialRef.current) {
      recentChats.forEach((c) => {
        lastUnreadByChatRef.current[c.id] = c.unreadCount;
      });
      chatInitialRef.current = false;
      return;
    }

    if (!getDesktopChatNotificationsEnabled()) {
      recentChats.forEach((c) => {
        lastUnreadByChatRef.current[c.id] = c.unreadCount;
      });
      return;
    }

    for (const chat of recentChats) {
      const prev = lastUnreadByChatRef.current[chat.id] ?? 0;
      if (chat.unreadCount > prev) {
        const preview = chat.lastMsg.trim() || "New message";
        const body =
          preview.length > 120 ? `${preview.slice(0, 117)}…` : preview;
        tryShowDesktopNotification({
          title: chat.name,
          body,
          tag: `acbx-chat-${chat.id}`,
          navigateUrl: `${window.location.origin}/chats?userId=${encodeURIComponent(chat.id)}`,
        });
      }
      lastUnreadByChatRef.current[chat.id] = chat.unreadCount;
    }
  }, [recentChats, inboxReady, isAuthenticated, currentUserId, useFb]);

  return null;
}
