"use client";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";
import { useGetProfileQuery, useRegisterUserMutation } from "@/store/endpoints/auth";
import { useAppSelector } from "@/store/hooks";
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
import { useEffect, useRef, useState } from "react";

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
        avatar: user.profileImageUrl || "https://static.vecteezy.com/system/resources/previews/026/327/062/non_2x/avatar-person-icon-profile-man-in-suit-or-tuxedo-for-business-office-portrait-png.png",
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
      
      formData.append("LinkedIn", editValues.linkedin);
      formData.append("Instagram", editValues.instagram);
      formData.append("Telegram", editValues.telegram);
      formData.append("Facebook", editValues.facebook);
      formData.append("Skype", editValues.skype);
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
                      onClick={() => router.push(`/chats?userId=${profileId}`)}
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
                
                {/* Social Links Badge Row */}
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
              </>
            )}
          </div>
        </div>
      </div>

   

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

      {/* Account Info Card */}
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

         {/* Trust & Authenticity Section - Only visible on own profile */}
      {isOwnProfile && (
        <div className="flex flex-col gap-4">
          <h2 className="text-[15px] font-bold text-[#64748B] uppercase tracking-wider px-2">Trust & Authenticity</h2>
          <div className="bg-white rounded-[20px] overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-[#F1F5F9]">
            {/* Google Verification */}
            <div className="p-5 flex items-center justify-between border-b border-[#F1F5F9] hover:bg-[#F8FAFC] transition-colors cursor-pointer group">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                  <FiMail className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#1A1A1A]">Google Verification</span>
                    {profile.googleVerified ? <FiCheckCircle className="w-4 h-4 text-green-500" /> : <FiAlertCircle className="w-4 h-4 text-amber-500" />}
                  </div>
                  <p className="text-[13px] text-[#64748B]">Gmail Verification + Google Sign Up</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-[12px] font-bold px-3 py-1 rounded-full ${profile.googleVerified ? 'bg-green-100 text-green-700' : 'bg-[#F1F5F9] text-[#64748B]'}`}>
                  {profile.googleVerified ? 'VERIFIED' : 'CONNECT'}
                </span>
                <FiChevronRight className="w-5 h-5 text-[#CBD5E1] group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* LinkedIn Verification */}
            <div className="p-5 flex items-center justify-between border-b border-[#F1F5F9] hover:bg-[#F8FAFC] transition-colors cursor-pointer group">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#0A66C2]/10 rounded-xl flex items-center justify-center">
                  <FiShield className="w-6 h-6 text-[#0A66C2]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#1A1A1A]">LinkedIn Verification</span>
                    {profile.linkedinVerified ? <FiCheckCircle className="w-4 h-4 text-green-500" /> : <FiAlertCircle className="w-4 h-4 text-amber-500" />}
                  </div>
                  <p className="text-[13px] text-[#64748B]">Professional identity verification</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-[12px] font-bold px-3 py-1 rounded-full ${profile.linkedinVerified ? 'bg-green-100 text-green-700' : 'bg-blue-600 text-white'}`}>
                  {profile.linkedinVerified ? 'VERIFIED' : 'VERIFY NOW'}
                </span>
                <FiChevronRight className="w-5 h-5 text-[#CBD5E1] group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* OTP Verification */}
            <div className="p-5 flex items-center justify-between hover:bg-[#F8FAFC] transition-colors cursor-pointer group">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center">
                  <FiShield className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#1A1A1A]">Mobile Verification</span>
                    {profile.otpVerified ? <FiCheckCircle className="w-4 h-4 text-green-500" /> : <FiAlertCircle className="w-4 h-4 text-amber-500" />}
                  </div>
                  <p className="text-[13px] text-[#64748B]">Secure access via OTP</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-[12px] font-bold px-3 py-1 rounded-full ${profile.otpVerified ? 'bg-green-100 text-green-700' : 'bg-[#F1F5F9] text-[#64748B]'}`}>
                  {profile.otpVerified ? 'VERIFIED' : 'VERIFY'}
                </span>
                <FiChevronRight className="w-5 h-5 text-[#CBD5E1] group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


