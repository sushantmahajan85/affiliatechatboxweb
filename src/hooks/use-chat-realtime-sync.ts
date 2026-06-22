"use client";

import { useEffect } from "react";
import { useChatBackendIsFirebase } from "@/context/FirebaseChatRoomsProvider";
import { getSocket, type ChatSocketPayload } from "@/lib/socket";
import { api } from "@/store/api";
import { useAppDispatch, useAppSelector } from "@/store/hooks";

export function useChatRealtimeSync() {
  const dispatch = useAppDispatch();
  const { userId, token } = useAppSelector((s) => s.auth);
  const useFb = useChatBackendIsFirebase();

  useEffect(() => {
    if (!userId || !token) return;

    const socket = getSocket();
    if (!socket.connected) {
      socket.connect();
    }

    const invalidate = () => {
      dispatch(api.util.invalidateTags(["Conversations", "ChatHistory", "NotificationUnread", "ChatRequestNotifications"]));
    };

    const onMessageReceived = (_payload: ChatSocketPayload) => {
      if (useFb) {
        dispatch(api.util.invalidateTags(["NotificationUnread", "ChatRequestNotifications"]));
        return;
      }
      invalidate();
    };

    const onChatUpdate = (_payload: ChatSocketPayload) => {
      if (useFb) {
        dispatch(api.util.invalidateTags(["NotificationUnread", "ChatRequestNotifications"]));
        return;
      }
      invalidate();
    };

    socket.on("message_received", onMessageReceived);
    socket.on("chat_update", onChatUpdate);

    return () => {
      socket.off("message_received", onMessageReceived);
      socket.off("chat_update", onChatUpdate);
    };
  }, [userId, token, dispatch, useFb]);
}
