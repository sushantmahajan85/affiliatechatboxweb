"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch } from "@/store/hooks";
import { setCredentials } from "@/store/authSlice";
import { getApiBaseUrl } from "@/lib/api-base-url";
import { toast } from "sonner";

export function LinkedInOAuthCallback() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const handled = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined" || handled.current) return;

    const params = new URLSearchParams(window.location.search);
    const linkedinSuccess = params.get("linkedin_success");
    const token = params.get("token");
    const userId = params.get("userId");
    const linkedInUrlFromRedirect = params.get("linkedInUrl");

    if (linkedinSuccess !== "true" || !token || !userId) return;

    handled.current = true;

    const finish = async () => {
      try {
        const res = await fetch(`${getApiBaseUrl()}/api/users/${userId}/get_user`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data?.user) {
          dispatch(setCredentials({ user: data.user, token }));
          const savedUrl = data.user.LinkedIn || linkedInUrlFromRedirect;
          if (savedUrl) {
            toast.success("LinkedIn connected. Your profile link is saved.");
          } else {
            toast.success("LinkedIn verified.");
            toast.message(
              "Profile URL was not returned by LinkedIn. Add your LinkedIn URL on your profile, or ask admin to enable r_basicprofile on the server.",
              { duration: 8000 }
            );
          }
        } else {
          toast.error("Could not load your account after LinkedIn sign-in.");
        }
      } catch (e) {
        console.error("LinkedIn OAuth callback sync failed:", e);
        toast.error("Failed to sync LinkedIn account.");
      } finally {
        const path = window.location.pathname || "/";
        router.replace(path);
      }
    };

    finish();
  }, [dispatch, router]);

  return null;
}
