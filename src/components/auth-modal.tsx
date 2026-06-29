"use client";

import { useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { AlertCircle, ChevronRight, Mail } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useRouter } from "next/navigation";
import { TermsAcceptancePanel } from "@/components/terms-acceptance-panel";
import { hasAcceptedTerms } from "@/lib/terms-acceptance-preference";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setCredentials } from "@/store/authSlice";
import { closeAuthModal, setAuthView } from "@/store/uiSlice";
import { openWalkthroughForNewUser } from "@/lib/walkthrough-preference";
import { 
  useGoogleLoginMutation, 
  useLinkedinLoginMutation, 
  useMobileContactMutation, 
  useVerifyUserMutation 
} from "@/store/endpoints/auth";
import { getLinkedInAuthUrl } from "@/lib/linkedin-auth";
import { useGoogleLogin } from "@react-oauth/google";

// SVG Icons (Reused from auth.tsx)
const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-1 .67-2.28 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

const LinkedInIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
  </svg>
);

export function AuthModal() {
  const { isAuthModalOpen, authView } = useAppSelector((state) => state.ui);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState<string | null>(null);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [termsReady, setTermsReady] = useState(false);

  useEffect(() => {
    setTermsAccepted(hasAcceptedTerms());
    setTermsReady(true);
  }, []);

  useEffect(() => {
    if (isAuthModalOpen) {
      setTermsAccepted(hasAcceptedTerms());
    }
  }, [isAuthModalOpen]);
  
  const dispatch = useAppDispatch();
  const router = useRouter();
  
  const [googleLogin, { isLoading: isGoogleLoading }] = useGoogleLoginMutation();
  const [linkedinLogin, { isLoading: isLinkedinLoading }] = useLinkedinLoginMutation();
  const [verifyUser, { isLoading: isVerifyLoading }] = useVerifyUserMutation();

  const isLoading = isGoogleLoading || isLinkedinLoading || isVerifyLoading;
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        setError(null);
        const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        });
        const userInfo = await userInfoRes.json();
        
        const payload = {
          email: userInfo.email,
          firstName: userInfo.given_name,
          lastName: userInfo.family_name || " ",
          mobileNumber: "",
          googleProfileImageUrl:
            typeof userInfo.picture === "string" ? userInfo.picture : "",
        };
        
        const response = await googleLogin(payload).unwrap();
        dispatch(setCredentials({ user: response.user, token: response.user.jwttoken }));
        
        // For project requirements: New signups need email verification
        if (!response.user.isEmailVerified) {
          dispatch(setAuthView('verify-email'));
        } else {
          dispatch(closeAuthModal());
          openWalkthroughForNewUser(dispatch, response.user._id, Boolean(response.isNewUser));
        }
      } catch (err: any) {
        setError(err?.data?.message || "Google Sign-In failed");
      }
    },
    onError: () => setError("Google Sign-In failed"),
  });

  const handleLinkedinLogin = () => {
    // Calling the backend redirect endpoint directly is cleaner if the backend handles the full flow
    window.location.href = getLinkedInAuthUrl();
  };

  // LinkedIn return (?linkedin_success=) is handled globally by LinkedInOAuthCallback in Providers.

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyEmail = async () => {
    // This would call your verification endpoint
    // Temporarily closing modal for now
    dispatch(closeAuthModal());
  };

  return (
    <Dialog open={isAuthModalOpen} onOpenChange={(open) => !open && dispatch(closeAuthModal())}>
      <DialogContent className="sm:max-w-[520px] p-0 overflow-hidden rounded-[32px] border-none shadow-2xl">
        <div className="bg-white p-8 md:p-10">
          <AnimatePresence mode="wait">
            {termsReady && !termsAccepted && authView === "login" && (
              <motion.div
                key="terms"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <TermsAcceptancePanel
                  compact
                  onAccepted={() => setTermsAccepted(true)}
                />
              </motion.div>
            )}

            {termsReady && termsAccepted && authView === 'login' && (
              <motion.div
                key="login"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div className="text-center mb-8">
                  <h2 className="text-[24px] font-black text-[#1A1A1A] tracking-tight">Join Our Community</h2>
                  <p className="text-[#64748B] font-bold text-sm mt-2">Sign in to interact with professionals</p>
                </div>

                {error && (
                  <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-600 text-xs font-bold">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                  </div>
                )}

                <div className="space-y-3">
                  <button
                    onClick={() => handleGoogleLogin()}
                    disabled={isLoading}
                    className="w-full h-[56px] bg-white border-2 border-[#E2E8F0] rounded-[16px] flex items-center justify-center gap-4 text-[15px] font-black text-[#1A1A1A] hover:bg-[#F8FAFC] hover:border-[#0A7EA4] transition-all disabled:opacity-50"
                  >
                    <GoogleIcon />
                    <span>Continue with Google</span>
                  </button>

                  <button
                    onClick={handleLinkedinLogin}
                    disabled={isLoading}
                    className="w-full h-[56px] bg-[#0A66C2] rounded-[16px] flex items-center justify-center gap-4 text-[15px] font-black text-white hover:bg-[#085aae] transition-all disabled:opacity-50 shadow-md"
                  >
                    <LinkedInIcon />
                    <span>Continue with LinkedIn</span>
                  </button>
                </div>

                <div className="relative py-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-[#E2E8F0]"></div>
                  </div>
                  <div className="relative flex justify-center text-[10px] uppercase tracking-[0.2em] font-black text-[#94A3B8]">
                    <span className="bg-white px-4">OR EXPLORER</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={() => dispatch(closeAuthModal())}
                    className="w-full h-[56px] bg-[#1A1A2E] rounded-[16px] flex items-center justify-center gap-3 text-[15px] font-black text-white hover:bg-[#2A2A3E] transition-all active:scale-[0.98]"
                  >
                    <span>Continue as Guest</span>
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </motion.div>
            )}

            {authView === 'verify-email' && (
              <motion.div
                key="verify"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-[#0A7EA4]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Mail className="w-8 h-8 text-[#0A7EA4]" />
                  </div>
                  <h2 className="text-[24px] font-black text-[#1A1A1A]">Verify Email</h2>
                  <p className="text-[#64748B] font-bold text-sm mt-2">Enter the verification code sent to your email</p>
                </div>

                <div className="flex justify-between gap-2">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => { inputRefs.current[index] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      className="w-full h-[56px] text-center text-[20px] font-black border-2 border-[#E2E8F0] rounded-[12px] focus:border-[#0A7EA4] outline-none transition-all"
                    />
                  ))}
                </div>

                <button
                  onClick={handleVerifyEmail}
                  disabled={isLoading || otp.some(d => !d)}
                  className="w-full h-[56px] bg-[#1A1A2E] rounded-[16px] text-white font-black hover:bg-[#2A2A3E] transition-all disabled:opacity-50"
                >
                  Confirm Verification
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}
