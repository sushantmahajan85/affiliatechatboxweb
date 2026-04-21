"use client";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Mail,
  MapPin,
  Save,
  ShieldCheck,
  User,
  X,
  Loader2,
  MessageCircle
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAppSelector } from "@/store/hooks";
import { useGetProfileQuery, useRegisterUserMutation } from "@/store/endpoints/auth";

export function ProfilePage({ id }: { id?: string }) {
  const router = useRouter();
  const { userId: currentUserId } = useAppSelector((state) => state.auth);
  const profileId = id || (currentUserId as string);
  const isOwnProfile = !id || id === currentUserId;

  const { data, isLoading, isError, refetch } = useGetProfileQuery(profileId, {
    skip: !profileId,
  });

  const [updateProfile, { isLoading: isUpdating }] = useRegisterUserMutation();

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
    lastName: ""
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
        avatar: user.profileImageUrl || "https://images.unsplash.com/photo-1599566150163-29194dcaad36?q=80&w=250",
        bio: user.bio || "No bio provided.",
        location: user.location || "Not specified",
        joined: user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : "Not available",
        googleVerified: !!user.isGoogleVerified,
        linkedinVerified: !!user.isLinkedinVerified,
        otpVerified: !!user.iscontactverified,
        email: user.email || "No email",
        phone: user.mobileNumber || "No phone number",
        firstName: user.firstName || "",
        lastName: user.lastName || ""
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
      // Backend expects mobileNumber if needed, but here we focus on profile fields

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-[#0A7EA4]" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <AlertCircle className="w-12 h-12 text-red-500" />
        <p className="text-[#64748B]">Failed to load profile. Please try again later.</p>
      </div>
    );
  }

  return (
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
            {profile.googleVerified && (
              <div className="absolute bottom-0 right-0 bg-blue-500 rounded-full p-1.5 border-2 border-white">
                <ShieldCheck className="w-4 h-4 text-white" />
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
              </div>
            ) : (
              <>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-1">
                  <h1 className="text-2xl font-bold text-[#1A1A1A]">{profile.name}</h1>
                  {!isOwnProfile && (
                    <button 
                      onClick={() => router.push(`/chats?userId=${profileId}`)}
                      className="flex items-center justify-center gap-2 px-6 py-2 bg-[#0A7EA4] text-white rounded-xl text-sm font-bold hover:bg-[#086a8a] transition-all shadow-md active:scale-95 shrink-0"
                    >
                      <MessageCircle className="w-4 h-4" />
                      Chat with me
                    </button>
                  )}
                </div>
                <p className="text-[#64748B] text-sm flex items-center justify-center sm:justify-start gap-2 mb-3">
                  <MapPin className="w-4 h-4" /> {profile.location}
                  <span className="w-1 h-1 bg-[#CBD5E1] rounded-full" />
                  <Calendar className="w-4 h-4" /> Joined {profile.joined}
                </p>
                <p className="text-[#475569] leading-relaxed max-w-md">
                  {profile.bio}
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Trust & Authenticity Section - Only visible on own profile */}
      {isOwnProfile && (
        <div className="flex flex-col gap-4">
          <h2 className="text-[15px] font-bold text-[#64748B] uppercase tracking-wider px-2">Trust & Authenticity</h2>
          <div className="bg-white rounded-[20px] overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-[#F1F5F9]">
            {/* Google Verification */}
            <div className="p-5 flex items-center justify-between border-b border-[#F1F5F9] hover:bg-[#F8FAFC] transition-colors cursor-pointer group">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                  <Mail className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#1A1A1A]">Google Verification</span>
                    {profile.googleVerified ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <AlertCircle className="w-4 h-4 text-amber-500" />}
                  </div>
                  <p className="text-[13px] text-[#64748B]">Gmail Verification + Google Sign Up</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-[12px] font-bold px-3 py-1 rounded-full ${profile.googleVerified ? 'bg-green-100 text-green-700' : 'bg-[#F1F5F9] text-[#64748B]'}`}>
                  {profile.googleVerified ? 'VERIFIED' : 'CONNECT'}
                </span>
                <ChevronRight className="w-5 h-5 text-[#CBD5E1] group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* LinkedIn Verification */}
            <div className="p-5 flex items-center justify-between border-b border-[#F1F5F9] hover:bg-[#F8FAFC] transition-colors cursor-pointer group">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#0A66C2]/10 rounded-xl flex items-center justify-center">
                  <ShieldCheck className="w-6 h-6 text-[#0A66C2]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#1A1A1A]">LinkedIn Verification</span>
                    {profile.linkedinVerified ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <AlertCircle className="w-4 h-4 text-amber-500" />}
                  </div>
                  <p className="text-[13px] text-[#64748B]">Professional identity verification</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-[12px] font-bold px-3 py-1 rounded-full ${profile.linkedinVerified ? 'bg-green-100 text-green-700' : 'bg-blue-600 text-white'}`}>
                  {profile.linkedinVerified ? 'VERIFIED' : 'VERIFY NOW'}
                </span>
                <ChevronRight className="w-5 h-5 text-[#CBD5E1] group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* OTP Verification */}
            <div className="p-5 flex items-center justify-between hover:bg-[#F8FAFC] transition-colors cursor-pointer group">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center">
                  <ShieldCheck className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#1A1A1A]">Mobile Verification</span>
                    {profile.otpVerified ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <AlertCircle className="w-4 h-4 text-amber-500" />}
                  </div>
                  <p className="text-[13px] text-[#64748B]">Secure access via OTP</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-[12px] font-bold px-3 py-1 rounded-full ${profile.otpVerified ? 'bg-green-100 text-green-700' : 'bg-[#F1F5F9] text-[#64748B]'}`}>
                  {profile.otpVerified ? 'VERIFIED' : 'VERIFY'}
                </span>
                <ChevronRight className="w-5 h-5 text-[#CBD5E1] group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Account Info Card */}
      <div className="bg-white rounded-[20px] p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-[#F1F5F9]">
        <h3 className="text-[16px] font-bold text-[#1A1A1A] mb-6 flex items-center gap-2">
          <User className="w-5 h-5 text-[#64748B]" /> Account Information
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
          <div className="flex justify-between items-center py-2 border-b border-[#F8FAFC]">
            <span className="text-sm text-[#64748B]">Phone Number</span>
            <span className="text-sm font-medium text-[#1A1A1A]">{profile.phone}</span>
          </div>
          
          {isOwnProfile && (
            <div className="flex gap-3 pt-4">
              {isEditing ? (
                <>
                  <button 
                    onClick={handleCancel}
                    disabled={isUpdating}
                    className="flex-1 py-3 bg-white text-[#64748B] text-sm font-bold rounded-xl hover:bg-[#F8FAFC] transition-colors border border-[#E2E8F0] flex items-center justify-center gap-2"
                  >
                    <X className="w-4 h-4" /> Cancel
                  </button>
                  <button 
                    onClick={handleSave}
                    disabled={isUpdating}
                    className="flex-1 py-3 bg-[#0A7EA4] text-white text-sm font-bold rounded-xl hover:bg-[#086a8a] transition-colors border border-transparent flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
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
    </div>
  );
}


