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
    const linkedinError = params.get("linkedin_error");
    const linkedinErrorDescription = params.get("linkedin_error_description");

    if (linkedinError) {
      handled.current = true;
      toast.error(
        linkedinErrorDescription ||
          "LinkedIn sign-in could not complete. Try again after removing the app under LinkedIn Settings → Permitted services.",
        { duration: 12000 }
      );
      router.replace(window.location.pathname || "/");
      return;
    }

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
            toast.success("LinkedIn connected.");
          } else {
            toast.error(
              "LinkedIn signed you in but your profile link was not saved. Sign in with LinkedIn again after revoking the app in LinkedIn settings.",
              { duration: 10000 }
            );
          }
        } else {
          toast.error("Could not load your account after LinkedIn sign-in.");
        }
      } catch (e) {
        console.error("LinkedIn OAuth callback sync failed:", e);
        toast.error("Failed to sync LinkedIn account.");
      } finally {
        router.replace(window.location.pathname || "/");
      }
    };

    finish();
  }, [dispatch, router]);

  return null;
}
