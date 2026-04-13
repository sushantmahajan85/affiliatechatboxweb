"use client";

import { Provider } from "react-redux";
import { store } from "@/store/store";
import { AuthWrapper } from "./AuthWrapper";
import { GoogleOAuthProvider } from "@react-oauth/google";

export function Providers({ children }: { children: React.ReactNode }) {
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <Provider store={store}>
        <AuthWrapper>
          {children}
        </AuthWrapper>
      </Provider>
    </GoogleOAuthProvider>
  );
}
