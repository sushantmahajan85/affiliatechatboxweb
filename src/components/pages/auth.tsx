"use client";

import { ImageWithFallback } from "@/components/figma/ImageWithFallback";
import { setCredentials } from "@/store/authSlice";
import {
  useGoogleLoginMutation,
  useLinkedinLoginMutation
} from "@/store/endpoints/auth";
import { useAppDispatch } from "@/store/hooks";
import { AlertCircle, ChevronRight, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import bgImage from "../../../public/assets/authBG.jpg";
import { getLinkedInAuthUrl } from "@/lib/linkedin-auth";
import { useGoogleLogin } from "@react-oauth/google";

// SVG Icons for Google and LinkedIn
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

export function AuthPage() {
  const [step, setStep] = useState<"login" | "otp">("login");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  
  const dispatch = useAppDispatch();
  const router = useRouter();
  
  const [googleLogin, { isLoading: isGoogleLoading }] = useGoogleLoginMutation();
  const [linkedinLogin, { isLoading: isLinkedinLoading }] = useLinkedinLoginMutation();
  const isLoading = isGoogleLoading || isLinkedinLoading;
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Real Google Login Implementation
  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        setError(null);
        // Getting user info from Google's userinfo endpoint 
        // Or if using the standard component, it provides a 'credential' (ID Token)
        // Since useGoogleLogin gives an access_token, we fetch user info
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
        router.push("/");
      } catch (err: any) {
        setError(err?.data?.message || "Google Sign-In failed to sync with backend");
      }
    },
    onError: () => setError("Google Sign-In popup closed or failed"),
  });

  const handleLinkedinLogin = () => {
    try {
      setError(null);
      window.location.href = getLinkedInAuthUrl();
    } catch (err: any) {
      setError("Failed to initiate LinkedIn login");
    }
  };

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

  return (
    <div className="min-h-screen relative flex overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <ImageWithFallback 
          src={bgImage.src} 
          alt="Background" 
          className="w-full h-full object-cover"
        />
      </div>
      
      <div className="relative inset-0 z-10 w-full flex flex-col md:flex-row">
        <div className="flex-1 flex flex-col items-center justify-center p-8 md:p-16 text-center md:text-left">
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="max-w-[540px]"
          >
            <div className="mb-6 inline-flex items-center px-4 py-1.5 bg-[#B4E4FF]/20 backdrop-blur-md rounded-full border border-[#B4E4FF]/30 text-[#B4E4FF] text-[11px] font-black uppercase tracking-[0.25em]">
              Affiliate Networking Tool
            </div>

            <h1 className="font-black text-white leading-[1.05] mb-8 drop-shadow-lg text-[48px]">
              Affiliate Chat Box
            </h1>
            <p className="text-lg md:text-xl text-white/95 font-medium leading-relaxed drop-shadow-md mb-10">
              Connect directly with Affiliates, Merchants, Media Buyers, Agencies, Data Sellers, Developers..
            </p>

            <div className="flex flex-wrap gap-6 justify-center md:justify-start items-center">
              <div className="flex -space-x-4">
                {[1,2,3,4,5].map(i => (
                  <div key={i} className="w-12 h-12 rounded-full border-4 border-[#0A7EA4] overflow-hidden bg-white/20 backdrop-blur-md shadow-lg">
                    <ImageWithFallback src={`https://i.pravatar.cc/100?u=${i+10}`} alt="User" />
                  </div>
                ))}
              </div>
              <div className="flex flex-col">
                <p className="text-white text-base font-black">12,000+ Professionals</p>
                <p className="text-white/80 text-sm font-bold">Scaling their business today</p>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="flex-1 flex items-center justify-center p-6 bg-white/5 backdrop-blur-sm md:bg-transparent">
          <div className="w-full max-w-[500px] px-4">
            <AnimatePresence mode="wait">
              {step === "login" ? (
                <motion.div
                  key="login"
                  initial={{ opacity: 0, scale: 0.9, x: -50 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.9, x: 50 }}
                  transition={{ type: "spring", duration: 0.6, bounce: 0.2 }}
                  className="w-full bg-white rounded-[32px] p-10 md:p-12 shadow-[0_32px_80px_rgba(0,0,0,0.3)] border border-white relative"
                >
                  <div className="text-center mb-10">
                    <h2 className="text-[32px] font-black text-[#1A1A1A] tracking-tight">Access Community</h2>
                    <p className="text-[#64748B] font-bold mt-2">Sign in to interact with professionals</p>
                  </div>

                  {error && (
                    <div className="mb-8 p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-600 text-sm font-bold">
                      <AlertCircle className="w-5 h-5" />
                      {error}
                    </div>
                  )}

                  <div className="space-y-4">
                    <button
                      onClick={() => handleGoogleLogin()}
                      disabled={isLoading}
                      className="w-full h-[64px] bg-white border-2 border-[#E2E8F0] rounded-[20px] flex items-center justify-center gap-4 text-[16px] font-black text-[#1A1A1A] hover:bg-[#F8FAFC] hover:border-[#0A7EA4] transition-all active:scale-[0.98] disabled:opacity-50"
                    >
                      <GoogleIcon />
                      <span>Continue with Google</span>
                    </button>

                    <button
                      onClick={handleLinkedinLogin}
                      disabled={isLoading}
                      className="w-full h-[64px] bg-[#0A66C2] rounded-[20px] flex items-center justify-center gap-4 text-[16px] font-black text-white hover:bg-[#085aae] transition-all active:scale-[0.98] disabled:opacity-50 shadow-md"
                    >
                      <LinkedInIcon />
                      <span>Continue with LinkedIn</span>
                    </button>

                    <div className="relative py-6">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-[#E2E8F0]"></div>
                      </div>
                      <div className="relative flex justify-center text-[12px] uppercase tracking-[0.3em] font-black text-[#94A3B8]">
                        <span className="bg-white px-6">OR EXPLORE</span>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <button
                        onClick={() => router.push("/")}
                        className="w-full h-[64px] bg-[#1A1A2E] rounded-[20px] flex items-center justify-center gap-3 text-[16px] font-black text-white hover:bg-[#2A2A3E] transition-all active:scale-[0.98]"
                      >
                        <span>Continue as Guest</span>
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-10 pt-10 border-t border-[#F1F5F9] text-center">
                    <p className="text-[13px] text-[#64748B] leading-relaxed font-bold">
                      Protected by industry-standard encryption. <br />
                      <a href="#" className="text-[#0A7EA4] hover:underline">Privacy Policy</a>
                    </p>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="otp"
                  initial={{ opacity: 0, scale: 0.9, x: 50 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.9, x: -50 }}
                  transition={{ type: "spring", duration: 0.6, bounce: 0.2 }}
                  className="w-full bg-white rounded-[32px] p-10 md:p-12 shadow-[0_32px_80px_rgba(0,0,0,0.3)] border border-white relative"
                >
                  <button 
                    onClick={() => setStep("login")}
                    className="absolute top-10 right-10 p-3 rounded-full text-[#94A3B8] hover:bg-[#F1F5F9] hover:text-[#0A7EA4] transition-all"
                  >
                    <X className="w-6 h-6" />
                  </button>

                  <div className="text-center mb-10">
                    <h2 className="text-[28px] font-black text-[#1A1A1A]">Verify Email</h2>
                    <p className="text-[#64748B] font-bold mt-2">Enter the verification code sent to your email</p>
                  </div>

                  {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-600 text-sm font-bold">
                      <AlertCircle className="w-5 h-5" />
                      {error}
                    </div>
                  )}

                  <div className="flex justify-between gap-3 mb-10">
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
                        className="w-full h-[64px] text-center text-[20px] font-black border-2 border-[#E2E8F0] rounded-[12px] focus:border-[#0A7EA4] outline-none transition-all"
                      />
                    ))}
                  </div>

                  <button
                    className="w-full h-[64px] bg-[#1A1A2E] rounded-[20px] text-white font-black hover:bg-[#2A2A3E] transition-all shadow-[0_8px_24px_rgba(26,26,46,0.2)]"
                  >
                    Confirm Verification
                  </button>

                  <div className="mt-10 text-center">
                    <button 
                      className="text-[14px] text-[#64748B] font-bold hover:text-[#0A7EA4] transition-colors"
                    >
                      Didn't get the code? <span className="text-[#1A1A1A] ml-1">Resend now</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="mt-12 text-center"
            >
              <div className="inline-flex items-center gap-3 px-6 py-3 bg-white/10 backdrop-blur-md rounded-full border border-white/10 text-white/80 text-[14px] font-bold">
                <AlertCircle className="w-4 h-4" />
                <span>Locked & Secured. Verified environment only.</span>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}



