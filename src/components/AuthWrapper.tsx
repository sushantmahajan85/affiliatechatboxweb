"use client";

import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { useGetProfileQuery } from "@/store/endpoints/auth";
import { updateUser, logout } from "@/store/authSlice";
import { getSocket } from "@/lib/socket";
import { useChatRealtimeSync } from "@/hooks/use-chat-realtime-sync";

export function AuthWrapper({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const { userId, token } = useAppSelector((state) => state.auth);

  useChatRealtimeSync();

  // Skip query if no userId
  const { data, error, isLoading } = useGetProfileQuery(userId as string, {
    skip: !userId || !token,
  });

  useEffect(() => {
    if (data && data.user) {
      dispatch(updateUser(data.user));
    }
  }, [data, dispatch]);

  useEffect(() => {
    if (userId && token) {
      const socket = getSocket();
      socket.connect();
      socket.emit("user_connected", userId);

      return () => {
        socket.disconnect();
      };
    }
  }, [userId, token]);

  useEffect(() => {
    if (error) {
      console.error("Auth error:", error);
      const code = (error as { data?: { code?: string } }).data?.code;
      if (code === "account_deleted") {
        dispatch(logout());
      }
    }
  }, [error, dispatch]);

  // Optionally show a global loading state during initial profile fetch
  // if (isLoading) {
  //   return <div>Loading profile...</div>;
  // }

  return <>{children}</>;
}
