"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch } from "@/store/hooks";
import { setCredentials } from "@/store/authSlice";
import { openWalkthroughForNewUser } from "@/lib/walkthrough-preference";
import { getApiBaseUrl } from "@/lib/api-base-url";

const LINKEDIN_CALLBACK_PATH = "/auth/linkedin/callback";

type LinkedInOAuthCallbackProps = {
  /** Where to send the user after credentials are stored (default: home). */
  redirectTo?: string;
};

function stripUrlToPath(path: string) {
  if (typeof window === "undefined") return;
  window.history.replaceState(null, "", path);
}

export function LinkedInOAuthCallback({
  redirectTo = "/",
}: LinkedInOAuthCallbackProps = {}) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const handled = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined" || handled.current) return;

    const params = new URLSearchParams(window.location.search);
    const linkedinError = params.get("linkedin_error");
    const linkedinSuccess = params.get("linkedin_success");
    const token = params.get("token");
    const userId = params.get("userId");
    const isNewUser = params.get("isNewUser") === "true";

    const isCallback =
      linkedinError ||
      (linkedinSuccess === "true" && token && userId);

    if (!isCallback) return;

    handled.current = true;

    // Remove token and PII from the address bar immediately (before async work).
    stripUrlToPath(window.location.pathname || LINKEDIN_CALLBACK_PATH);

    if (linkedinError) {
      router.replace(redirectTo);
      return;
    }

    const finish = async () => {
      try {
        const res = await fetch(`${getApiBaseUrl()}/api/users/${userId}/get_user`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data?.user) {
          dispatch(setCredentials({ user: data.user, token: token! }));
          openWalkthroughForNewUser(dispatch, data.user._id, isNewUser);
        }
      } catch (e) {
        console.error("LinkedIn OAuth callback sync failed:", e);
      } finally {
        router.replace(redirectTo);
      }
    };

    finish();
  }, [dispatch, router, redirectTo]);

  return null;
}
