"use client";

import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { useGetProfileQuery } from "@/store/endpoints/auth";
import { updateUser, logout } from "@/store/authSlice";
import { getSocket } from "@/lib/socket";
import { useChatRealtimeSync } from "@/hooks/use-chat-realtime-sync";
import { toast } from "sonner";

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
      if (data.user.isSuspended) {
        toast.error("Your account has been suspended. Contact support for assistance.");
        dispatch(logout());
        return;
      }
      if (data.user.isDeleted) {
        toast.error("Your account has been deleted.");
        dispatch(logout());
        return;
      }
      dispatch(updateUser(data.user));
    }
  }, [data, dispatch]);

  useEffect(() => {
    if (userId && token) {
      const socket = getSocket();

      const onAccountBlocked = (payload: { code?: string }) => {
        if (payload?.code === "account_suspended") {
          toast.error("Your account has been suspended. Contact support for assistance.");
        }
        dispatch(logout());
        socket.disconnect();
      };

      socket.connect();
      socket.emit("user_connected", userId);
      socket.on("account_blocked", onAccountBlocked);

      return () => {
        socket.off("account_blocked", onAccountBlocked);
        socket.disconnect();
      };
    }
  }, [userId, token, dispatch]);

  useEffect(() => {
    if (error) {
      console.error("Auth error:", error);
      const code = (error as { data?: { code?: string } }).data?.code;
      if (code === "account_deleted" || code === "account_suspended") {
        if (code === "account_suspended") {
          toast.error("Your account has been suspended. Contact support for assistance.");
        } else {
          toast.error("Your account has been deleted.");
        }
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
