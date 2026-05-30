"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { openAuthModal } from "@/store/uiSlice";
import { isAuthRequiredPath } from "@/lib/auth-guard-paths";

export function GuestRouteGuard() {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  useEffect(() => {
    if (isAuthenticated || !isAuthRequiredPath(pathname)) return;
    dispatch(openAuthModal());
    router.replace("/");
  }, [pathname, isAuthenticated, dispatch, router]);

  return null;
}
