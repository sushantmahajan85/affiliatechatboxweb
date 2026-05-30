"use client";
import { LinkedinChatGuardDialog } from "@/components/linkedin-chat-guard-dialog";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";
import {
  useFirebasePhoneVerifyMutation,
  useGetProfileQuery,
  useRegisterUserMutation,
  useGoogleVerifyMutation,
  useVerifyUserMutation,
} from "@/store/endpoints/auth";
import { isFirebaseConfigured } from "@/lib/firebase-app";
import {
  confirmFirebasePhoneOtp,
  firebasePhoneAuthErrorMessage,
  getFirebasePhoneAuthIdToken,
  resetPhoneRecaptcha,
  sendFirebasePhoneOtp,
} from "@/lib/firebase-phone-auth";
import { setCredentials } from "@/store/authSlice";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { getApiBaseUrl } from "@/lib/api-base-url";
import { useGoogleLogin } from "@react-oauth/google";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { openAuthModal, openConnectionModal } from "@/store/uiSlice";
import { useGetConversationsQuery } from "@/store/endpoints/chats";
import { useFirebaseChatRoomsContext, useChatBackendIsFirebase } from "@/context/FirebaseChatRoomsProvider";
import { getLinkedinChatBlockReason, isSelfChatPartner } from "@/lib/linkedin-messaging";
import { resolveUserProfileImageUrl } from "@/lib/user-profile-image";
import { 
  FiAlertCircle, 
  FiBriefcase, 
  FiCalendar, 
  FiCheckCircle, 
  FiChevronRight, 
  FiExternalLink, 
  FiLoader, 
  FiMail, 
  FiMapPin, 
  FiMessageCircle, 
  FiSave, 
  FiSend, 
  FiShield, 
  FiUser, 
  FiX 
} from "react-icons/fi";
import { 
  FaLinkedin, 
  FaInstagram, 
  FaFacebook, 
  FaTelegram, 
  FaSkype 
} from "react-icons/fa";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

const PHONE_COUNTRY_DIAL_OPTIONS = [
  { dial: "91", label: "India +91" },
  { dial: "1", label: "US / CA +1" },
  { dial: "44", label: "UK +44" },
  { dial: "61", label: "Australia +61" },
  { dial: "971", label: "UAE +971" },
  { dial: "966", label: "Saudi +966" },
  { dial: "880", label: "Bangladesh +880" },
] as const;

const DEFAULT_PHONE_DIAL = String(
  process.env.NEXT_PUBLIC_PHONE_DEFAULT_DIAL || "91"
).replace(/\D/g, "") || "91";

function splitStoredMobileForCountryInputs(
  fullDigits: string,
  defaultDial: string
): { dial: string; national: string } {
  const raw = fullDigits.replace(/\D/g, "");
  if (!raw) return { dial: defaultDial, national: "" };
  const sorted = [...PHONE_COUNTRY_DIAL_OPTIONS].sort(
    (a, b) => b.dial.length - a.dial.length
  );
  for (const o of sorted) {
    if (raw.startsWith(o.dial) && raw.length > o.dial.length) {
      return { dial: o.dial, national: raw.slice(o.dial.length) };
    }
  }
  if (raw.length === 10) return { dial: defaultDial, national: raw };
  return { dial: defaultDial, national: raw };
}

export function ProfilePage({ id }: { id?: string }) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { userId: currentUserId, user: viewerUser } = useAppSelector((state) => state.auth);
  const profileId = id || (currentUserId as string);
  const isOwnProfile = !id || id === currentUserId;

  const chatBackendIsFirebase = useChatBackendIsFirebase();
  const { rooms: firebaseRooms } = useFirebaseChatRoomsContext();

  const { data: convData } = useGetConversationsQuery(currentUserId as string, {
    skip: !currentUserId || chatBackendIsFirebase,
  });

  const hasConnectedChat = useMemo(() => {
    if (!currentUserId || !profileId) return false;
    if (String(currentUserId) === String(profileId)) return true;
    if (chatBackendIsFirebase) {
      return firebaseRooms.some(
        (r) => String(r.partnerId) === String(profileId) && r.isRequested === "accepted"
      );
    }
    return Boolean(convData?.conversations?.some((c) => String(c.id) === String(profileId)));
  }, [currentUserId, profileId, chatBackendIsFirebase, firebaseRooms, convData?.conversations]);

  const showProfileDetailSections = isOwnProfile || hasConnectedChat;

  const { data, isLoading, isError, refetch } = useGetProfileQuery(profileId, {
    skip: !profileId,
  });

  const [linkedinGuardOpen, setLinkedinGuardOpen] = useState(false);
  const [linkedinGuardReason, setLinkedinGuardReason] = useState<
    "sender_not_verified" | "recipient_not_verified" | null
  >(null);

  const handleStartChat = () => {
    if (!currentUserId) {
      dispatch(openAuthModal());
      return;
    }
    if (isSelfChatPartner(currentUserId, profileId)) {
      toast.error("You cannot chat with yourself");
      return;
    }

    const blockReason = getLinkedinChatBlockReason(
      viewerUser?.isLinkedinVerified,
      data?.user?.isLinkedinVerified,
      viewerUser?.role === "admin",
      data?.user?.role === "admin"
    );
    if (blockReason) {
      setLinkedinGuardReason(blockReason);
      setLinkedinGuardOpen(true);
      return;
    }
    const hasChat = hasConnectedChat;
    if (hasChat) {
      router.push(`/chats?userId=${profileId}`);
    } else {
      dispatch(openConnectionModal(profileId));
    }
  };

  const [updateProfile, { isLoading: isUpdating }] = useRegisterUserMutation();
  const [googleVerifyMutate, { isLoading: isGoogleVerifying }] = useGoogleVerifyMutation();
  const [firebasePhoneVerifyMutate] = useFirebasePhoneVerifyMutation();
  const [verifyUserMutate] = useVerifyUserMutation();
  const [mobileVerifyOpen, setMobileVerifyOpen] = useState(false);
  const [mobileVerifyStep, setMobileVerifyStep] = useState<"phone" | "otp">("phone");
  const [phoneCountryDial, setPhoneCountryDial] = useState(DEFAULT_PHONE_DIAL);
  const [phoneNationalNumber, setPhoneNationalNumber] = useState("");
  const [mobileOtpInput, setMobileOtpInput] = useState("");
  const [isSendingPhoneOtp, setIsSendingPhoneOtp] = useState(false);
  const [isVerifyingPhoneOtp, setIsVerifyingPhoneOtp] = useState(false);
  const [firebaseVerificationId, setFirebaseVerificationId] = useState<string | null>(null);

  const normalizedMobileDialogDigits = (): string => {
    const national = phoneNationalNumber.replace(/\D/g, "").replace(/^0+/, "");
    const cc = phoneCountryDial.replace(/\D/g, "");
    if (!national) return "";
    return `+${cc}${national}`;
  };

  const apiErrorMessage = (err: unknown, fallback: string): string => {
    const e = err as { data?: { message?: string } };
    return e.data?.message || fallback;
  };

  const resetMobileDialog = (): void => {
    setMobileVerifyStep("phone");
    setMobileOtpInput("");
    setPhoneNationalNumber("");
    setPhoneCountryDial(DEFAULT_PHONE_DIAL);
    setFirebaseVerificationId(null);
    resetPhoneRecaptcha();
  };

  const openMobileVerifyDialog = (): void => {
    if (!isFirebaseConfigured()) {
      toast.error("Firebase is not configured. Check NEXT_PUBLIC_FIREBASE_* in .env.local.");
      return;
    }
    const u = data?.user;
    const raw = u?.mobileNumber ? String(u.mobileNumber).replace(/\D/g, "") : "";
    const { dial, national } = splitStoredMobileForCountryInputs(raw, DEFAULT_PHONE_DIAL);
    setPhoneCountryDial(dial);
    setPhoneNationalNumber(national);
    setMobileOtpInput("");
    setFirebaseVerificationId(null);
    setMobileVerifyStep("phone");
    setMobileVerifyOpen(true);
  };

  /** Web equivalent of Android's verifyPhoneNumber → codeSent → PhoneAuthProvider.credential → signInWithCredential */
  const handleSendPhoneOtp = async (): Promise<void> => {
    const e164 = normalizedMobileDialogDigits();
    const nationalLen = phoneNationalNumber.replace(/\D/g, "").length;
    if (!e164 || nationalLen < 6) {
      toast.error("Enter a valid mobile number.");
      return;
    }
    setIsSendingPhoneOtp(true);
    try {
      const verificationId = await sendFirebasePhoneOtp(e164);
      setFirebaseVerificationId(verificationId);
      setMobileVerifyStep("otp");
      toast.success("Verification code sent by SMS.");
    } catch (err: unknown) {
      toast.error(firebasePhoneAuthErrorMessage(err));
    } finally {
      setIsSendingPhoneOtp(false);
    }
  };

  /** Web equivalent of Android's PhoneAuthProvider.credential → signInWithCredential → verifyUser API */
  const handleVerifyPhoneOtpSubmit = async (): Promise<void> => {
    const code = mobileOtpInput.replace(/\D/g, "");
    if (!/^\d{6}$/.test(code)) {
      toast.error("Enter the 6-digit code.");
      return;
    }
    if (!firebaseVerificationId) {
      toast.error("Session expired. Request a new code.");
      setMobileVerifyStep("phone");
      return;
    }
    setIsVerifyingPhoneOtp(true);
    try {
      // Same as Android: PhoneAuthProvider.credential(verificationId, smsCode) + signInWithCredential
      await confirmFirebasePhoneOtp(firebaseVerificationId, code);

      // Sync verified phone to our backend (same as Android's verifyUser API call)
      let response: { user: { jwttoken: string; _id: string; isverified: boolean } & Record<string, unknown> };
      try {
        const firebaseIdToken = await getFirebasePhoneAuthIdToken();
        response = await firebasePhoneVerifyMutate({ firebaseIdToken }).unwrap();
      } catch {
        const e164 = normalizedMobileDialogDigits();
        const digits = e164.replace(/\D/g, "");
        response = await verifyUserMutate({ mobileNumber: digits ? `+${digits}` : e164 }).unwrap();
      }

      dispatch(setCredentials({ user: response.user, token: response.user.jwttoken }));
      refetch();
      toast.success("Mobile verified.");
      setMobileVerifyOpen(false);
      resetMobileDialog();
    } catch (err: unknown) {
      toast.error(apiErrorMessage(err, firebasePhoneAuthErrorMessage(err)));
    } finally {
      setIsVerifyingPhoneOtp(false);
    }
  };

  const handleResendPhoneOtp = async (): Promise<void> => {
    setMobileVerifyStep("phone");
    setFirebaseVerificationId(null);
    setMobileOtpInput("");
    await handleSendPhoneOtp();
  };

  const promptGoogleVerification = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      if (!currentUserId) return;
      try {
        const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        });
        const userInfo = await userInfoRes.json();
        const digits = String(viewerUser?.mobileNumber || "").replace(/\D/g, "");
        const response = await googleVerifyMutate({
          id: String(currentUserId),
          email: userInfo.email,
          firstName: userInfo.given_name,
          lastName: userInfo.family_name || " ",
          ...(digits ? { mobileNumber: digits } : {}),
          googleProfileImageUrl:
            typeof userInfo.picture === "string" ? userInfo.picture : "",
        }).unwrap();
        dispatch(setCredentials({ user: response.user, token: response.user.jwttoken }));
        refetch();
        toast.success("Google verification completed.");
      } catch (err: unknown) {
        const e = err as { data?: { message?: string } };
        toast.error(e?.data?.message || "Google verification failed.");
      }
    },
    onError: () => toast.error("Google sign-in was cancelled or failed."),
  });

  const startLinkedinVerification = (): void => {
    window.location.href = `${getApiBaseUrl()}/auth/linkedin?t=${Date.now()}`;
  };

  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState({
    name: "",
    avatar: "",
    bio: "",
    location: "",
    joined: "",
    googleVerified: false,
    linkedinVerified: false,
    otpVerified: false,
    email: "",
    phone: "",
    firstName: "",
    lastName: "",
    linkedin: "",
    instagram: "",
    telegram: "",
    facebook: "",
    skype: "",
    company: "",
    designation: ""
  });

  const [editValues, setEditValues] = useState({ ...profile });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (data && data.user) {
      const user = data.user;
      const newProfile = {
        name: `${user.firstName || ""} ${user.lastName || ""}`.trim() || "User",
        avatar: resolveUserProfileImageUrl(user, `${user.firstName || ""} ${user.lastName || ""}`.trim() || "User"),
        bio: user.bio || "No bio provided.",
        location: user.location || "Not specified",
        joined: user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : "Not available",
        googleVerified: !!user.isGoogleVerified,
        linkedinVerified: !!user.isLinkedinVerified,
        otpVerified: !!user.iscontactverified,
        email: user.email || "No email",
        phone: user.mobileNumber || "No phone number",
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        linkedin: user.LinkedIn || "",
        instagram: user.Instagram || "",
        telegram: user.Telegram || "",
        facebook: user.Facebook || "",
        skype: user.Skype || "",
        company: user.Company || "",
        designation: user.Designation || ""
      };
      setProfile(newProfile);
      setEditValues(newProfile);
    }
  }, [data]);

  const handleSave = async () => {
    try {
      const formData = new FormData();
      
      // Map editValues back to backend fields
      formData.append("firstName", editValues.firstName);
      formData.append("lastName", editValues.lastName);
      formData.append("bio", editValues.bio);
      formData.append("location", editValues.location);
      formData.append("email", editValues.email);

      const appendIfSet = (key: string, value: string) => {
        const v = (value || "").trim();
        if (v) formData.append(key, v);
      };
      appendIfSet("LinkedIn", editValues.linkedin);
      appendIfSet("Instagram", editValues.instagram);
      appendIfSet("Telegram", editValues.telegram);
      appendIfSet("Facebook", editValues.facebook);
      appendIfSet("Skype", editValues.skype);
      formData.append("Company", editValues.company);
      formData.append("Designation", editValues.designation);

      if (selectedFile) {
        formData.append("ProfilePicture", selectedFile);
      }

      await updateProfile({ userId: profileId, data: formData }).unwrap();
      refetch();
      setIsEditing(false);
      setSelectedFile(null);
      setPreviewUrl(null);
    } catch (err) {
      console.error("Failed to update profile:", err);
    }
  };

  const handleCancel = () => {
    setEditValues({ ...profile });
    setSelectedFile(null);
    setPreviewUrl(null);
    setIsEditing(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const canVerifyFromHere = isOwnProfile && Boolean(currentUserId);
  const googleRowActive = canVerifyFromHere && !profile.googleVerified;
  const linkedinRowActive = canVerifyFromHere && !profile.linkedinVerified;
  const mobileRowActive = canVerifyFromHere && !profile.otpVerified;

  const googlePill = profile.googleVerified
    ? { text: "VERIFIED", cls: "bg-green-100 text-green-700" }
    : canVerifyFromHere
      ? { text: "CONNECT", cls: "bg-[#F1F5F9] text-[#64748B]" }
      : { text: "NOT VERIFIED", cls: "bg-[#F1F5F9] text-[#64748B]" };

  const linkedinPill = profile.linkedinVerified
    ? { text: "VERIFIED", cls: "bg-green-100 text-green-700" }
    : canVerifyFromHere
      ? { text: "VERIFY NOW", cls: "bg-blue-600 text-white" }
      : { text: "NOT VERIFIED", cls: "bg-[#F1F5F9] text-[#64748B]" };

  const mobilePill = profile.otpVerified
    ? { text: "VERIFIED", cls: "bg-green-100 text-green-700" }
    : canVerifyFromHere
      ? { text: "VERIFY", cls: "bg-[#F1F5F9] text-[#64748B]" }
      : { text: "NOT VERIFIED", cls: "bg-[#F1F5F9] text-[#64748B]" };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <FiLoader className="w-8 h-8 animate-spin text-[#0A7EA4]" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <FiAlertCircle className="w-12 h-12 text-red-500" />
        <p className="text-[#64748B]">Failed to load profile. Please try again later.</p>
      </div>
    );
  }

  return (
    <>
    <div className="flex flex-col gap-6 max-w-2xl mx-auto pb-12">
      {/* Profile Header Card */}
      <div className="bg-white rounded-[20px] p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-[#F1F5F9]">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="relative">
            <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-[#F8FAFC] group relative">
              <ImageWithFallback 
                src={previewUrl || profile.avatar} 
                alt={profile.name} 
                className="w-full h-full object-cover" 
              />
              {isEditing && isOwnProfile && (
                <div 
                  className="absolute inset-0 bg-black/40 flex items-center justify-center cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <span className="text-[10px] text-white font-bold uppercase tracking-tighter">CHANGE</span>
                </div>
              )}
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*"
                onChange={handleFileChange}
              />
            </div>
            {showProfileDetailSections && profile.googleVerified && (
              <div className="absolute bottom-0 right-0 bg-blue-500 rounded-full p-1.5 border-2 border-white">
                <FiShield className="w-4 h-4 text-white" />
              </div>
            )}
          </div>
          
          <div className="flex-1 text-center sm:text-left w-full">
            {isEditing ? (
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-1">
                  <label className="text-[11px] font-bold text-[#64748B] uppercase mb-1 block">First Name</label>
                  <input 
                    type="text" 
                    value={editValues.firstName}
                    onChange={(e) => setEditValues({ ...editValues, firstName: e.target.value })}
                    className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:border-[#0A7EA4]"
                  />
                </div>
                <div className="col-span-1">
                  <label className="text-[11px] font-bold text-[#64748B] uppercase mb-1 block">Last Name</label>
                  <input 
                    type="text" 
                    value={editValues.lastName}
                    onChange={(e) => setEditValues({ ...editValues, lastName: e.target.value })}
                    className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:border-[#0A7EA4]"
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-[11px] font-bold text-[#64748B] uppercase mb-1 block">Location</label>
                  <input 
                    type="text" 
                    value={editValues.location}
                    onChange={(e) => setEditValues({ ...editValues, location: e.target.value })}
                    className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:border-[#0A7EA4]"
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-[11px] font-bold text-[#64748B] uppercase mb-1 block">Bio</label>
                  <textarea 
                    value={editValues.bio}
                    onChange={(e) => setEditValues({ ...editValues, bio: e.target.value })}
                    className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:border-[#0A7EA4] h-20 resize-none"
                  />
                </div>
                <div className="col-span-1">
                  <label className="text-[11px] font-bold text-[#64748B] uppercase mb-1 block">Company</label>
                  <input 
                    type="text" 
                    value={editValues.company}
                    onChange={(e) => setEditValues({ ...editValues, company: e.target.value })}
                    className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:border-[#0A7EA4]"
                    placeholder="e.g. Acme Corp"
                  />
                </div>
                <div className="col-span-1">
                  <label className="text-[11px] font-bold text-[#64748B] uppercase mb-1 block">Designation</label>
                  <input 
                    type="text" 
                    value={editValues.designation}
                    onChange={(e) => setEditValues({ ...editValues, designation: e.target.value })}
                    className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:border-[#0A7EA4]"
                    placeholder="e.g. Software Engineer"
                  />
                </div>
              </div>
            ) : (
              <>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-1">
                  <h1 className="text-2xl font-bold text-[#1A1A1A]">{profile.name}</h1>
                  {!isOwnProfile && (
                    <button 
                      onClick={handleStartChat}
                      className="flex items-center justify-center gap-2 px-6 py-2 bg-[#0A7EA4] text-white rounded-xl text-sm font-bold hover:bg-[#086a8a] transition-all shadow-md active:scale-95 shrink-0"
                    >
                      <FiMessageCircle className="w-4 h-4" />
                      Chat with me
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-y-1 gap-x-4 mb-3">
                  <p className="text-[#64748B] text-sm flex items-center gap-1.5">
                    <FiMapPin className="w-4 h-4" /> {profile.location}
                  </p>
                  <span className="hidden sm:block w-1 h-1 bg-[#CBD5E1] rounded-full" />
                  <p className="text-[#64748B] text-sm flex items-center gap-1.5">
                    <FiCalendar className="w-4 h-4" /> Joined {profile.joined}
                  </p>
                  {(profile.company || profile.designation) && (
                    <>
                      <span className="hidden sm:block w-1 h-1 bg-[#CBD5E1] rounded-full" />
                      <p className="text-[#64748B] text-sm flex items-center gap-1.5">
                        <FiBriefcase className="w-4 h-4" /> {profile.designation} {profile.company && `at ${profile.company}`}
                      </p>
                    </>
                  )}
                </div>
                <p className="text-[#475569] leading-relaxed max-w-md">
                  {profile.bio}
                </p>
                
                {showProfileDetailSections && (
                <div className="flex flex-wrap gap-2 mt-4 justify-center sm:justify-start">
                  {profile.linkedin && (
                    <a href={profile.linkedin.startsWith('http') ? profile.linkedin : `https://linkedin.com/in/${profile.linkedin}`} target="_blank" rel="noopener noreferrer" className="p-2 bg-[#F8FAFC] rounded-lg text-[#0A66C2] hover:bg-[#0A66C2]/10 transition-colors">
                      <FaLinkedin className="w-4 h-4" />
                    </a>
                  )}
                  {profile.instagram && (
                    <a href={profile.instagram.startsWith('http') ? profile.instagram : `https://instagram.com/${profile.instagram}`} target="_blank" rel="noopener noreferrer" className="p-2 bg-[#F8FAFC] rounded-lg text-[#E4405F] hover:bg-[#E4405F]/10 transition-colors">
                      <FaInstagram className="w-4 h-4" />
                    </a>
                  )}
                  {profile.facebook && (
                    <a href={profile.facebook.startsWith('http') ? profile.facebook : `https://facebook.com/${profile.facebook}`} target="_blank" rel="noopener noreferrer" className="p-2 bg-[#F8FAFC] rounded-lg text-[#1877F2] hover:bg-[#1877F2]/10 transition-colors">
                      <FaFacebook className="w-4 h-4" />
                    </a>
                  )}
                  {profile.telegram && (
                    <a href={profile.telegram.startsWith('http') ? profile.telegram : `https://t.me/${profile.telegram}`} target="_blank" rel="noopener noreferrer" className="p-2 bg-[#F8FAFC] rounded-lg text-[#0088cc] hover:bg-[#0088cc]/10 transition-colors">
                      <FaTelegram className="w-4 h-4" />
                    </a>
                  )}
                </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {showProfileDetailSections && (
      <>
      {/* Social Links Card */}
      <div className="bg-white rounded-[20px] p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-[#F1F5F9]">
        <h3 className="text-[16px] font-bold text-[#1A1A1A] mb-6 flex items-center gap-2">
          <FiExternalLink className="w-5 h-5 text-[#64748B]" /> Social Profiles
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-4">
            <div>
              <label className="text-[11px] font-bold text-[#64748B] uppercase mb-1 block">LinkedIn</label>
              {isEditing ? (
                <div className="relative">
                  <FaLinkedin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]" />
                  <input 
                    type="text" 
                    value={editValues.linkedin}
                    onChange={(e) => setEditValues({ ...editValues, linkedin: e.target.value })}
                    className="w-full pl-10 pr-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:border-[#0A7EA4]"
                    placeholder="Username or Profile URL"
                  />
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm text-[#1A1A1A] bg-[#F8FAFC] p-2 rounded-lg">
                  <FaLinkedin className="w-4 h-4 text-[#0A66C2]" />
                  <span>{profile.linkedin || "Not connected"}</span>
                </div>
              )}
            </div>
            <div>
              <label className="text-[11px] font-bold text-[#64748B] uppercase mb-1 block">Instagram</label>
              {isEditing ? (
                <div className="relative">
                  <FaInstagram className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]" />
                  <input 
                    type="text" 
                    value={editValues.instagram}
                    onChange={(e) => setEditValues({ ...editValues, instagram: e.target.value })}
                    className="w-full pl-10 pr-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:border-[#0A7EA4]"
                    placeholder="Username"
                  />
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm text-[#1A1A1A] bg-[#F8FAFC] p-2 rounded-lg">
                  <FaInstagram className="w-4 h-4 text-[#E4405F]" />
                  <span>{profile.instagram || "Not connected"}</span>
                </div>
              )}
            </div>
            <div>
              <label className="text-[11px] font-bold text-[#64748B] uppercase mb-1 block">Telegram</label>
              {isEditing ? (
                <div className="relative">
                  <FaTelegram className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]" />
                  <input 
                    type="text" 
                    value={editValues.telegram}
                    onChange={(e) => setEditValues({ ...editValues, telegram: e.target.value })}
                    className="w-full pl-10 pr-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:border-[#0A7EA4]"
                    placeholder="Username"
                  />
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm text-[#1A1A1A] bg-[#F8FAFC] p-2 rounded-lg">
                  <FaTelegram className="w-4 h-4 text-[#0088cc]" />
                  <span>{profile.telegram || "Not connected"}</span>
                </div>
              )}
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-[11px] font-bold text-[#64748B] uppercase mb-1 block">Facebook</label>
              {isEditing ? (
                <div className="relative">
                  <FaFacebook className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]" />
                  <input 
                    type="text" 
                    value={editValues.facebook}
                    onChange={(e) => setEditValues({ ...editValues, facebook: e.target.value })}
                    className="w-full pl-10 pr-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:border-[#0A7EA4]"
                    placeholder="Username or URL"
                  />
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm text-[#1A1A1A] bg-[#F8FAFC] p-2 rounded-lg">
                  <FaFacebook className="w-4 h-4 text-[#1877F2]" />
                  <span>{profile.facebook || "Not connected"}</span>
                </div>
              )}
            </div>
            <div>
              <label className="text-[11px] font-bold text-[#64748B] uppercase mb-1 block">Skype</label>
              {isEditing ? (
                <div className="relative">
                  <FaSkype className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]" />
                  <input 
                    type="text" 
                    value={editValues.skype}
                    onChange={(e) => setEditValues({ ...editValues, skype: e.target.value })}
                    className="w-full pl-10 pr-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:border-[#0A7EA4]"
                    placeholder="Skype ID"
                  />
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm text-[#1A1A1A] bg-[#F8FAFC] p-2 rounded-lg">
                  <FaSkype className="w-4 h-4 text-[#00AFF0]" />
                  <span>{profile.skype || "Not connected"}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[20px] p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-[#F1F5F9]">
        <h3 className="text-[16px] font-bold text-[#1A1A1A] mb-6 flex items-center gap-2">
          <FiUser className="w-5 h-5 text-[#64748B]" /> Account Information
        </h3>
        <div className="space-y-4">
          <div className="flex justify-between items-center py-2 border-b border-[#F8FAFC]">
            <span className="text-sm text-[#64748B]">Email Address</span>
            {isEditing ? (
              <input 
                type="email" 
                value={editValues.email}
                onChange={(e) => setEditValues({ ...editValues, email: e.target.value })}
                className="text-sm font-medium text-[#1A1A1A] bg-[#F8FAFC] border border-[#E2E8F0] rounded px-2 py-1 text-right focus:outline-none focus:border-[#0A7EA4] flex-1 ml-4"
              />
            ) : (
              <span className="text-sm font-medium text-[#1A1A1A]">{profile.email}</span>
            )}
          </div>
          {isOwnProfile && (
            <div className="flex justify-between items-center py-2 border-b border-[#F8FAFC]">
              <span className="text-sm text-[#64748B]">Phone Number</span>
              <span className="text-sm font-medium text-[#1A1A1A]">{profile.phone}</span>
            </div>)}

          {isOwnProfile && (
            <div className="flex gap-3 pt-4">
              {isEditing ? (
                <>
                  <button 
                    onClick={handleCancel}
                    disabled={isUpdating}
                    className="flex-1 py-3 bg-white text-[#64748B] text-sm font-bold rounded-xl hover:bg-[#F8FAFC] transition-colors border border-[#E2E8F0] flex items-center justify-center gap-2"
                  >
                    <FiX className="w-4 h-4" /> Cancel
                  </button>
                  <button 
                    onClick={handleSave}
                    disabled={isUpdating}
                    className="flex-1 py-3 bg-[#0A7EA4] text-white text-sm font-bold rounded-xl hover:bg-[#086a8a] transition-colors border border-transparent flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isUpdating ? <FiLoader className="w-4 h-4 animate-spin" /> : <FiSave className="w-4 h-4" />}
                    Save Changes
                  </button>
                </>
              ) : (
                <button 
                  onClick={() => setIsEditing(true)}
                  className="w-full py-3 bg-[#F8FAFC] text-[#1A1A1A] text-sm font-bold rounded-xl hover:bg-[#F1F5F9] transition-colors border border-[#E2E8F0]"
                >
                  Edit Profile Details
                </button>
              )}
            </div>
          )}
        </div>
      </div>
      </>
      )}

      <div className="flex flex-col gap-4">
          <h2 className="text-[15px] font-bold text-[#64748B] uppercase tracking-wider px-2">Trust & Authenticity</h2>
          <div className="bg-white rounded-[20px] overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-[#F1F5F9]">
            {/* Google Verification */}
            <div
              role={googleRowActive ? "button" : undefined}
              tabIndex={googleRowActive ? 0 : undefined}
              onClick={() => {
                if (!googleRowActive || isGoogleVerifying) return;
                promptGoogleVerification();
              }}
              onKeyDown={(e) => {
                if (!googleRowActive || isGoogleVerifying) return;
                if (e.key !== "Enter" && e.key !== " ") return;
                e.preventDefault();
                promptGoogleVerification();
              }}
              className={`p-5 flex items-center justify-between border-b border-[#F1F5F9] transition-colors group ${
                googleRowActive ? "cursor-pointer hover:bg-[#F8FAFC]" : "cursor-default"
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                  <FiMail className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#1A1A1A]">Google Verification</span>
                    {profile.googleVerified ? <FiCheckCircle className="w-4 h-4 text-green-500" /> : <FiAlertCircle className="w-4 h-4 text-amber-500" />}
                  </div>
                  <p className="text-[13px] text-[#64748B]">
                    {canVerifyFromHere && !profile.googleVerified
                      ? "Link your Google account to verify email and sign-in."
                      : "Gmail verification + Google sign-in"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`text-[12px] font-bold px-3 py-1 rounded-full ${googlePill.cls}`}>
                  {googlePill.text}
                </span>
                {googleRowActive ? (
                  isGoogleVerifying ? (
                    <FiLoader className="w-5 h-5 animate-spin text-[#0A7EA4]" aria-hidden />
                  ) : (
                    <FiChevronRight className="w-5 h-5 text-[#CBD5E1] group-hover:translate-x-1 transition-transform" aria-hidden />
                  )
                ) : null}
              </div>
            </div>

            {/* LinkedIn Verification */}
            <div
              role={linkedinRowActive ? "button" : undefined}
              tabIndex={linkedinRowActive ? 0 : undefined}
              onClick={() => {
                if (!linkedinRowActive) return;
                startLinkedinVerification();
              }}
              onKeyDown={(e) => {
                if (!linkedinRowActive) return;
                if (e.key !== "Enter" && e.key !== " ") return;
                e.preventDefault();
                startLinkedinVerification();
              }}
              className={`p-5 flex items-center justify-between border-b border-[#F1F5F9] transition-colors group ${
                linkedinRowActive ? "cursor-pointer hover:bg-[#F8FAFC]" : "cursor-default"
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#0A66C2]/10 rounded-xl flex items-center justify-center">
                  <FiShield className="w-6 h-6 text-[#0A66C2]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#1A1A1A]">LinkedIn Verification</span>
                    {profile.linkedinVerified ? <FiCheckCircle className="w-4 h-4 text-green-500" /> : <FiAlertCircle className="w-4 h-4 text-amber-500" />}
                  </div>
                  <p className="text-[13px] text-[#64748B]">
                    {canVerifyFromHere && !profile.linkedinVerified
                      ? "Continue with LinkedIn to unlock messaging and verify your profile."
                      : "Professional identity verification"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`text-[12px] font-bold px-3 py-1 rounded-full ${linkedinPill.cls}`}>
                  {linkedinPill.text}
                </span>
                {linkedinRowActive ? (
                  <FiChevronRight className="w-5 h-5 text-[#CBD5E1] group-hover:translate-x-1 transition-transform" aria-hidden />
                ) : null}
              </div>
            </div>

            {/* Mobile / contact verification */}
            <div
              role={mobileRowActive ? "button" : undefined}
              tabIndex={mobileRowActive ? 0 : undefined}
              onClick={() => {
                if (!mobileRowActive) return;
                openMobileVerifyDialog();
              }}
              onKeyDown={(e) => {
                if (!mobileRowActive) return;
                if (e.key !== "Enter" && e.key !== " ") return;
                e.preventDefault();
                openMobileVerifyDialog();
              }}
              className={`p-5 flex items-center justify-between transition-colors group ${
                mobileRowActive ? "cursor-pointer hover:bg-[#F8FAFC]" : "cursor-default"
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center">
                  <FiShield className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#1A1A1A]">Mobile Verification</span>
                    {profile.otpVerified ? <FiCheckCircle className="w-4 h-4 text-green-500" /> : <FiAlertCircle className="w-4 h-4 text-amber-500" />}
                  </div>
                  <p className="text-[13px] text-[#64748B]">
                    {canVerifyFromHere && !profile.otpVerified
                      ? "Add your number and verify with a code we send by SMS."
                      : "Secure access via verified phone"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`text-[12px] font-bold px-3 py-1 rounded-full ${mobilePill.cls}`}>
                  {mobilePill.text}
                </span>
                {mobileRowActive ? (
                  <FiChevronRight className="w-5 h-5 text-[#CBD5E1] group-hover:translate-x-1 transition-transform" aria-hidden />
                ) : null}
              </div>
            </div>
          </div>
        </div>
    </div>
    <Dialog
      open={mobileVerifyOpen}
      onOpenChange={(open) => {
        setMobileVerifyOpen(open);
        if (!open) resetMobileDialog();
      }}
    >
      <DialogContent className="sm:max-w-[400px] bg-white rounded-2xl border border-[#E2E8F0]">
        <DialogHeader>
          <DialogTitle className="text-[#1A1A2E]">
            {mobileVerifyStep === "phone" ? "Verify mobile number" : "Enter verification code"}
          </DialogTitle>
          <DialogDescription className="text-[#64748B]">
            {mobileVerifyStep === "phone"
              ? "Same Firebase SMS as the app. Enter your number, tap Send code, then complete the reCAPTCHA box at the bottom of the screen."
              : `Code sent to ${(() => {
                  const d = normalizedMobileDialogDigits();
                  if (d.length <= 4) return "••••";
                  return `${"•".repeat(d.length - 4)}${d.slice(-4)}`;
                })()}`}
          </DialogDescription>
        </DialogHeader>
        {mobileVerifyStep === "phone" ? (
          <div className="flex flex-col gap-4 pt-2">
            <div className="flex gap-2 items-stretch">
              <select
                value={phoneCountryDial}
                onChange={(e) => setPhoneCountryDial(e.target.value)}
                className="h-10 min-w-[122px] rounded-xl border border-[#E2E8F0] bg-white text-black text-sm font-medium px-2 shrink-0"
                aria-label="Country calling code"
              >
                {PHONE_COUNTRY_DIAL_OPTIONS.map((o) => (
                  <option key={o.dial} value={o.dial}>
                    {o.label}
                  </option>
                ))}
              </select>
              <Input
                type="tel"
                inputMode="numeric"
                autoComplete="tel-national"
                placeholder="Mobile number"
                value={phoneNationalNumber}
                onChange={(e) =>
                  setPhoneNationalNumber(e.target.value.replace(/[^\d\s-]/g, ""))
                }
                className="flex-1 rounded-xl border-[#E2E8F0] bg-white text-black placeholder:text-neutral-500"
              />
            </div>
            <Button
              type="button"
              className="w-full rounded-xl bg-[#0A7EA4] hover:bg-[#086a8a] text-white"
              disabled={isSendingPhoneOtp}
              onClick={() => void handleSendPhoneOtp()}
            >
              {isSendingPhoneOtp ? (
                <span className="flex items-center justify-center gap-2">
                  <FiLoader className="w-4 h-4 animate-spin" /> Sending…
                </span>
              ) : (
                "Send code"
              )}
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-4 pt-2">
            <Input
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="6-digit code"
              value={mobileOtpInput}
              onChange={(e) => setMobileOtpInput(e.target.value.replace(/\D/g, "").slice(0, 6))}
              className="rounded-xl border-[#E2E8F0] bg-white text-black text-center text-2xl tracking-[0.4em] font-mono placeholder:text-neutral-500"
            />
            <Button
              type="button"
              className="w-full rounded-xl bg-[#0A7EA4] hover:bg-[#086a8a] text-white"
              disabled={isVerifyingPhoneOtp}
              onClick={() => void handleVerifyPhoneOtpSubmit()}
            >
              {isVerifyingPhoneOtp ? (
                <span className="flex items-center justify-center gap-2">
                  <FiLoader className="w-4 h-4 animate-spin" /> Verifying…
                </span>
              ) : (
                "Verify"
              )}
            </Button>
            <div className="flex gap-2 justify-between">
              <Button
                type="button"
                variant="ghost"
                className="text-[#64748B]"
                disabled={isSendingPhoneOtp || isVerifyingPhoneOtp}
                onClick={() => {
                  setMobileVerifyStep("phone");
                  setFirebaseVerificationId(null);
                  setMobileOtpInput("");
                }}
              >
                Change number
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="text-[#0A7EA4]"
                disabled={isSendingPhoneOtp || isVerifyingPhoneOtp}
                onClick={() => void handleResendPhoneOtp()}
              >
                Resend code
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
    <LinkedinChatGuardDialog
      open={linkedinGuardOpen}
      onOpenChange={setLinkedinGuardOpen}
      reason={linkedinGuardReason}
    />
    </>
  );
}


