"use client";

import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { useGetProfileQuery } from "@/store/endpoints/auth";
import { updateUser, logout } from "@/store/authSlice";

export function AuthWrapper({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const { userId, token } = useAppSelector((state) => state.auth);

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
    if (error) {
      console.error("Auth error:", error);
      // If unauthorized, logout
      if ((error as any).status === 401) {
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
