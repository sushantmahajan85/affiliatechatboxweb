"use client";
import { useAddPostMutation } from "@/store/endpoints/posts";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { openAuthModal } from "@/store/uiSlice";
import {
  ChevronDown,
  Image as ImageIcon,
  Layers,
  Loader2,
  Tag,
  X
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { ImageWithFallback } from "./figma/ImageWithFallback";

export function CreatePost() {
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  const [addPost, { isLoading }] = useAddPostMutation();
  
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("blank"); // Maps to backend 'tag'
  const [tag, setTag] = useState(""); // Additional tag string
  const [shareToLinkedin, setShareToLinkedin] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.size > 10 * 1024 * 1024) { // 10MB limit
        toast.error("File size too large. Max 10MB allowed.");
        return;
      }
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
    }
  };

  const removeFile = () => {
    setFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async () => {
    if (!isAuthenticated) {
      dispatch(openAuthModal());
      return;
    }
    if (!content.trim() && !file) {
      toast.error("Please add some content or a photo to your post.");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("postContent", content);
      formData.append("tag", category);
      formData.append("addedToLinkedin", String(shareToLinkedin));
      
      // Combine description and secondary tag if needed
      if (tag) {
        formData.append("postDescription", `Tag: #${tag}`);
      }

      if (file) {
        formData.append("postMedia", file);
      }

      await addPost({ userId: user!._id, formData }).unwrap();
      
      toast.success("Post created successfully! It will appear in the feed once approved.");
      
      // Reset form
      setContent("");
      setCategory("blank");
      setTag("");
      setShareToLinkedin(false);
      removeFile();
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to create post. Please try again.");
    }
  };

  return (
    <div className="bg-white rounded-[14px] p-4 md:p-5 shadow-[0_2px_8px_rgba(0,0,0,0.06)] border border-[#E0E0E0]">
      <h2 className="text-[18px] font-bold text-[#1A1A2E] mb-4">Create a Post</h2>
      
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="w-10 h-10 md:w-11 md:h-11 rounded-full overflow-hidden shrink-0 border border-[#E0E0E0]">
          <ImageWithFallback
           src={user?.profileImageUrl || `https://ui-avatars.com/api/?name=${user?.firstName}+${user?.lastName}&background=0A7EA4&color=fff`}
                alt={`${user?.firstName} ${user?.lastName}`}
            className="w-full h-full object-cover"
          />
        </div>
        <textarea
          placeholder="What's on your mind regarding affiliate marketing?"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onClick={() => !isAuthenticated && dispatch(openAuthModal())}
          className="flex-1 w-full min-h-[44px] max-h-[200px] bg-[#F5F5F5] border border-[#E0E0E0] rounded-[10px] px-4 py-2 text-[14px] text-[#3C3C3C] focus:outline-none focus:ring-1 focus:ring-[#0A7EA4] placeholder:text-[#757575] resize-none"
        />
      </div>

      {previewUrl && (
        <div className="mt-4 relative inline-block">
          <div className="max-w-[300px] rounded-lg overflow-hidden border border-[#E0E0E0] shadow-sm bg-black">
            {file?.type.startsWith("video/") ? (
              <video src={previewUrl} controls className="max-w-full max-h-[300px]" />
            ) : (
              <img src={previewUrl} alt="Preview" className="max-w-full max-h-[300px] object-contain" />
            )}
          </div>
          <button 
            onClick={removeFile}
            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between mt-4 gap-4">
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          {/* Photo/Video */}
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*,video/*"
            onChange={handleFileChange}
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-3 h-[38px] border border-[#E0E0E0] rounded-lg text-[#3C3C3C] text-[13px] hover:bg-[#F5F5F5] transition-colors"
          >
            <ImageIcon className="w-4 h-4 text-[#757575]" />
            <span className="hidden sm:inline">Photo/Video</span>
          </button>

          {/* Category Dropdown (Backend 'tag') */}
          <div className="relative group h-[38px]">
            <Layers className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#757575] pointer-events-none" />
            <select 
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="appearance-none pl-9 pr-8 h-full border border-[#E0E0E0] rounded-lg text-[#3C3C3C] text-[13px] hover:bg-[#F5F5F5] transition-colors focus:outline-none cursor-pointer bg-white min-w-[100px]"
            >
              <option value="blank">General</option>
              <option value="sell">Sell</option>
              <option value="buy">Buy</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#757575] pointer-events-none" />
          </div>

          {/* Tags Dropdown */}
          <div className="relative group h-[38px]">
            <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#757575] pointer-events-none" />
            <select 
              value={tag}
              onChange={(e) => setTag(e.target.value)}
              className="appearance-none pl-9 pr-8 h-full border border-[#E0E0E0] rounded-lg text-[#3C3C3C] text-[13px] hover:bg-[#F5F5F5] transition-colors focus:outline-none cursor-pointer bg-white min-w-[120px]"
            >
              <option value="">Add Tags</option>
              <option value="SEO">SEO</option>
              <option value="MARKETING">MARKETING</option>
              <option value="Hiring">Hiring</option>
              <option value="Affiliate">Affiliate</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#757575] pointer-events-none" />
          </div>

          {/* LinkedIn Checkbox */}
          <label className="flex items-center gap-3 px-3 h-[38px] border border-[#E0E0E0] rounded-lg text-[#3C3C3C] text-[13px] hover:bg-[#F5F5F5] transition-colors cursor-pointer group">
            <div className="flex items-center gap-2">
              <div className="bg-[#0A66C2] text-white text-[9px] w-4 h-4 flex items-center justify-center rounded-[1px] font-bold shrink-0">in</div>
              <span className="hidden sm:inline">Share to LinkedIn</span>
            </div>
            <div className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={shareToLinkedin}
                onChange={() => setShareToLinkedin(!shareToLinkedin)}
                className="sr-only peer" 
              />
              <div className="w-8 h-4 bg-[#E0E0E0] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-[#0A7EA4]"></div>
            </div>
          </label>

        </div>

        <button 
          onClick={handleSubmit}
          disabled={isLoading || (!content.trim() && !file)}
          className="w-full lg:w-auto bg-[#0A7EA4] text-white font-bold text-[14px] h-[42px] px-8 rounded-[10px] hover:bg-[#086a8a] active:scale-95 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Posting...</span>
            </>
          ) : (
            <span>Share Post</span>
          )}
        </button>
      </div>
    </div>
  );
}
