"use client";

import "@/lib/firebase-app-check-bootstrap";
import { initFirebaseAppCheckOnClient } from "@/lib/firebase-app";
import { bootstrapFirebaseAuthRecaptcha } from "@/lib/firebase-auth-bootstrap";
import { Provider } from "react-redux";
import { useEffect } from "react";
import { store } from "@/store/store";
import { AuthWrapper } from "./AuthWrapper";
import { LinkedInOAuthCallback } from "./LinkedInOAuthCallback";
import { MobileAppInstallPrompt } from "./mobile-app-install-prompt";
import { FirebaseChatRoomsProvider } from "@/context/FirebaseChatRoomsProvider";
import { GoogleOAuthProvider } from "@react-oauth/google";

export function Providers({ children }: { children: React.ReactNode }) {
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";

  useEffect(() => {
    void bootstrapFirebaseAuthRecaptcha();
    const timer = window.setTimeout(() => initFirebaseAppCheckOnClient(), 1500);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <Provider store={store}>
        <AuthWrapper>
          <LinkedInOAuthCallback />
          <MobileAppInstallPrompt />
          <FirebaseChatRoomsProvider>{children}</FirebaseChatRoomsProvider>
        </AuthWrapper>
      </Provider>
    </GoogleOAuthProvider>
  );
}
