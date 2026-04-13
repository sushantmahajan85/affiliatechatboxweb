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
  X
} from "lucide-react";
import { useState } from "react";

export function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState({
    name: "Alex Johnson",
    avatar: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?q=80&w=250",
    bio: "Senior Affiliate Marketer with 10+ years of experience in lead generation and performance marketing.",
    location: "New York, USA",
    joined: "March 2024",
    googleVerified: true,
    linkedinVerified: false,
    otpVerified: true,
    email: "alex.johnson@example.com",
    phone: "+1 (***) ***-8901"
  });

  const [editValues, setEditValues] = useState({ ...profile });

  const handleSave = () => {
    setProfile({ ...editValues });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValues({ ...profile });
    setIsEditing(false);
  };

  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto pb-12">
      {/* Profile Header Card */}
      <div className="bg-white rounded-[20px] p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-[#F1F5F9]">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="relative">
            <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-[#F8FAFC] group relative">
              <ImageWithFallback 
                src={profile.avatar} 
                alt={profile.name} 
                className="w-full h-full object-cover" 
              />
              {isEditing && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center cursor-pointer">
                  <span className="text-[10px] text-white font-bold">CHANGE</span>
                </div>
              )}
            </div>
            {profile.googleVerified && (
              <div className="absolute bottom-0 right-0 bg-blue-500 rounded-full p-1.5 border-2 border-white">
                <ShieldCheck className="w-4 h-4 text-white" />
              </div>
            )}
          </div>
          
          <div className="flex-1 text-center sm:text-left w-full">
            {isEditing ? (
              <div className="space-y-3">
                <div>
                  <label className="text-[11px] font-bold text-[#64748B] uppercase mb-1 block">Full Name</label>
                  <input 
                    type="text" 
                    value={editValues.name}
                    onChange={(e) => setEditValues({ ...editValues, name: e.target.value })}
                    className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:border-[#0A7EA4]"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-[#64748B] uppercase mb-1 block">Location</label>
                  <input 
                    type="text" 
                    value={editValues.location}
                    onChange={(e) => setEditValues({ ...editValues, location: e.target.value })}
                    className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:border-[#0A7EA4]"
                  />
                </div>
                <div>
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
                <h1 className="text-2xl font-bold text-[#1A1A1A] mb-1">{profile.name}</h1>
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

      {/* Verification Status Section */}
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
                  {profile.googleVerified ? (
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-amber-500" />
                  )}
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
                {/* <Linkedin className="w-6 h-6 text-[#0A66C2]" /> */}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-[#1A1A1A]">LinkedIn / Notik App</span>
                  {profile.linkedinVerified ? (
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-amber-500" />
                  )}
                </div>
                <p className="text-[13px] text-[#64748B]">Verify your professional identity</p>
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
                {/* <Lock className="w-6 h-6 text-purple-600" /> */}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-[#1A1A1A]">Double OTP Verification</span>
                  {profile.otpVerified ? (
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-amber-500" />
                  )}
                </div>
                <p className="text-[13px] text-[#64748B]">Secured chat access with 2-factor authentication</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-[12px] font-bold px-3 py-1 rounded-full ${profile.otpVerified ? 'bg-green-100 text-green-700' : 'bg-[#F1F5F9] text-[#64748B]'}`}>
                {profile.otpVerified ? 'ENABLED' : 'SETUP'}
              </span>
              <ChevronRight className="w-5 h-5 text-[#CBD5E1] group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </div>

      {/* Informational Notice */}
      <div className="bg-[#EEF2FF] border border-[#C7D2FE] rounded-[16px] p-4 flex gap-3">
        <AlertCircle className="w-5 h-5 text-[#4F46E5] shrink-0" />
        <p className="text-[13px] text-[#3730A3] leading-relaxed">
          <strong>Note:</strong> Web Chat Access requires successful Google Sign Up + Gmail Verification. For higher trust, complete the LinkedIn/Notik App verification and enable Double OTP.
        </p>
      </div>

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
                className="text-sm font-medium text-[#1A1A1A] bg-[#F8FAFC] border border-[#E2E8F0] rounded px-2 py-1 text-right focus:outline-none focus:border-[#0A7EA4]"
              />
            ) : (
              <span className="text-sm font-medium text-[#1A1A1A]">{profile.email}</span>
            )}
          </div>
          <div className="flex justify-between items-center py-2 border-b border-[#F8FAFC]">
            <span className="text-sm text-[#64748B]">Phone Number</span>
            {isEditing ? (
              <input 
                type="text" 
                value={editValues.phone}
                onChange={(e) => setEditValues({ ...editValues, phone: e.target.value })}
                className="text-sm font-medium text-[#1A1A1A] bg-[#F8FAFC] border border-[#E2E8F0] rounded px-2 py-1 text-right focus:outline-none focus:border-[#0A7EA4]"
              />
            ) : (
              <span className="text-sm font-medium text-[#1A1A1A] flex items-center gap-1">
                 {/* <Phone className="w-3.5 h-3.5" /> {profile.phone} */}
              </span>
            )}
          </div>
          
          <div className="flex gap-3">
            {isEditing ? (
              <>
                <button 
                  onClick={handleCancel}
                  className="flex-1 mt-4 py-3 bg-white text-[#64748B] text-sm font-bold rounded-xl hover:bg-[#F8FAFC] transition-colors border border-[#E2E8F0] flex items-center justify-center gap-2"
                >
                  <X className="w-4 h-4" /> Cancel
                </button>
                <button 
                  onClick={handleSave}
                  className="flex-1 mt-4 py-3 bg-[#0A7EA4] text-white text-sm font-bold rounded-xl hover:bg-[#086a8a] transition-colors border border-transparent flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" /> Save Changes
                </button>
              </>
            ) : (
              <button 
                onClick={() => setIsEditing(true)}
                className="w-full mt-4 py-3 bg-[#F8FAFC] text-[#1A1A1A] text-sm font-bold rounded-xl hover:bg-[#F1F5F9] transition-colors border border-[#E2E8F0]"
              >
                Edit Profile Details
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


