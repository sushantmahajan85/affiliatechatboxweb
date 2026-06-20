"use client";
import { clsx } from "clsx";
import { sanitizeTextOnChange } from "@/lib/sanitize-plain-text";
import { useAddPostMutation } from "@/store/endpoints/posts";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { openAuthModal } from "@/store/uiSlice";
import { sharePostOnLinkedIn } from "@/utils/linkedin-service";
import {
  ChevronDown,
  Image as ImageIcon,
  Layers,
  Loader2,
  Tag,
  X
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { validateMediaUpload } from "@/lib/media-upload-limits";
import { GENERAL_POST_TYPE } from "@/lib/post-tags";
import { resolveUserProfileImageUrl } from "@/lib/user-profile-image";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";

const STATIC_POST_TAGS = [
  "Affiliate Marketing",
  "CPA",
  "CPL",
  "PPC",
  "SEO",
  "Lead Gen",
  "E-commerce",
  "Influencer",
  "Content Marketing",
  "Email Marketing",
  "Social Media",
  "Display Ads",
  "Networking",
  "Partnership",
  "SaaS",
] as const;

function normalizeTag(raw: string): string {
  return raw.trim().replace(/^#+/, "").replace(/\s+/g, "");
}

function formatTagsForPostDescription(tags: string[]): string {
  if (tags.length === 0) return "";
  return tags.map((t) => `#${normalizeTag(t)}`).join(" ");
}

export function CreatePost() {
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  const [addPost, { isLoading }] = useAddPostMutation();
  
  const [content, setContent] = useState("");
  const [category, setCategory] = useState(""); // Maps to backend 'tag'; empty shows placeholder
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tagsDialogOpen, setTagsDialogOpen] = useState(false);
  const [customTagInput, setCustomTagInput] = useState("");
  const canShareToLinkedin = Boolean(
    user?.isLinkedinVerified && user?.linkedInAccessToken && user?.linkedInId
  );
  const [shareToLinkedin, setShareToLinkedin] = useState(true);

  useEffect(() => {
    if (!canShareToLinkedin) setShareToLinkedin(false);
  }, [canShareToLinkedin]);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    const validation = validateMediaUpload(selectedFile);
    if (!validation.ok) {
      toast.error(validation.message);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setFile(selectedFile);
    setPreviewUrl(URL.createObjectURL(selectedFile));
  };

  const removeFile = () => {
    setFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const toggleTag = (label: string) => {
    const normalized = normalizeTag(label);
    if (!normalized) return;
    setSelectedTags((prev) =>
      prev.some((t) => normalizeTag(t).toLowerCase() === normalized.toLowerCase())
        ? prev.filter((t) => normalizeTag(t).toLowerCase() !== normalized.toLowerCase())
        : [...prev, label]
    );
  };

  const addCustomTag = () => {
    const normalized = normalizeTag(customTagInput);
    if (!normalized) return;
    if (selectedTags.some((t) => normalizeTag(t).toLowerCase() === normalized.toLowerCase())) {
      toast.message("Tag already added");
      return;
    }
    setSelectedTags((prev) => [...prev, normalized]);
    setCustomTagInput("");
  };

  const removeTag = (tag: string) => {
    setSelectedTags((prev) => prev.filter((t) => t !== tag));
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

    if (selectedTags.length === 0) {
      toast.error("Please add at least one tag before posting.");
      setTagsDialogOpen(true);
      return;
    }

    try {
      const formData = new FormData();
      formData.append("postContent", content);
      formData.append("tag", category || GENERAL_POST_TYPE);
      formData.append("addedToLinkedin", String(canShareToLinkedin && shareToLinkedin));

      const tagLine = formatTagsForPostDescription(selectedTags);
      formData.append("postDescription", tagLine);

      if (file) {
        formData.append("postMedia", file);
      }

      await addPost({ userId: user!._id, formData }).unwrap();
      
      // Handle LinkedIn sharing if enabled
      if (canShareToLinkedin && shareToLinkedin) {
        if (user?.linkedInAccessToken && user?.linkedInId) {
          const linkedinResult = await sharePostOnLinkedIn(
            content,
            user.linkedInAccessToken,
            user.linkedInId
          );
          if (linkedinResult.success) {
            toast.success("Also shared to your LinkedIn profile!");
          } else {
            toast.error(linkedinResult.data);
          }
        } else {
          toast.warning("LinkedIn credentials not found. Post shared internally but not to LinkedIn.");
        }
      }

      toast.success("Post created successfully! It will appear in the feed once approved.");
      
      // Reset form
      setContent("");
      setCategory("");
      setSelectedTags([]);
      setCustomTagInput("");
      setTagsDialogOpen(false);
      setShareToLinkedin(canShareToLinkedin);
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
           src={resolveUserProfileImageUrl(
              user ?? undefined,
              `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || "User"
            )}
                alt={`${user?.firstName} ${user?.lastName}`}
            className="w-full h-full object-cover"
          />
        </div>
        <textarea
          placeholder="What's on your mind regarding affiliate marketing?"
          value={content}
          onChange={(e) => sanitizeTextOnChange(e.target.value, setContent)}
          onClick={() => !isAuthenticated && dispatch(openAuthModal())}
          className="flex-1 w-full min-h-[44px] max-h-[200px] bg-[#F5F5F5] border border-[#E0E0E0] rounded-[10px] px-4 py-2 text-[14px] text-[#3C3C3C] focus:outline-none focus:ring-1 focus:ring-[#0A7EA4] placeholder:text-[#757575] resize-none"
        />
      </div>

      {selectedTags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {selectedTags.map((t) => (
            <span
              key={t}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#E0F2F7] text-[#0A7EA4] text-[12px] font-semibold"
            >
              #{normalizeTag(t)}
              <button
                type="button"
                onClick={() => removeTag(t)}
                className="hover:text-[#086a8a]"
                aria-label={`Remove ${t}`}
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

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
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*,video/*"
            onChange={handleFileChange}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-3 h-[38px] border border-[#E0E0E0] rounded-lg text-[#3C3C3C] text-[13px] hover:bg-[#F5F5F5] transition-colors"
          >
            <ImageIcon className="w-4 h-4 text-[#757575]" />
            <span className="hidden sm:inline">Photo/Video</span>
          </button>

          <div className="relative group h-[38px]">
            <Layers className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#757575] pointer-events-none" />
            <select
              value={category}
              onChange={(e) => sanitizeTextOnChange(e.target.value, setCategory)}
              className={clsx(
                "appearance-none pl-9 pr-8 h-full border border-[#E0E0E0] rounded-lg text-[13px] hover:bg-[#F5F5F5] transition-colors focus:outline-none cursor-pointer bg-white min-w-[120px]",
                category ? "text-[#3C3C3C]" : "text-[#757575]"
              )}
            >
              <option value="" disabled>
                Post type
              </option>
              <option value={GENERAL_POST_TYPE}>General</option>
              <option value="sell">Sell</option>
              <option value="buy">Buy</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#757575] pointer-events-none" />
          </div>

          <button
            type="button"
            onClick={() => {
              if (!isAuthenticated) {
                dispatch(openAuthModal());
                return;
              }
              setTagsDialogOpen(true);
            }}
            className={clsx(
              "flex items-center gap-2 px-3 h-[38px] border rounded-lg text-[13px] transition-colors",
              selectedTags.length > 0
                ? "border-[#0A7EA4] bg-[#E0F2F7] text-[#0A7EA4]"
                : "border-[#E0E0E0] text-[#3C3C3C] hover:bg-[#F5F5F5]"
            )}
          >
            <Tag className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">
              {selectedTags.length > 0 ? `Tags (${selectedTags.length})` : "Add Tags"}
              <span className="text-red-500 ml-0.5" aria-hidden>*</span>
            </span>
            <span className="sm:hidden">
              {selectedTags.length > 0 ? selectedTags.length : "Tags"}
              <span className="text-red-500 ml-0.5" aria-hidden>*</span>
            </span>
          </button>

          {canShareToLinkedin && (
            <label className="flex items-center gap-3 px-3 h-[38px] border border-[#E0E0E0] rounded-lg text-[#3C3C3C] text-[13px] hover:bg-[#F5F5F5] transition-colors cursor-pointer group">
              <div className="flex items-center gap-2">
                <div className="bg-[#0A66C2] text-white text-[9px] w-4 h-4 flex items-center justify-center rounded-[1px] font-bold shrink-0">
                  in
                </div>
                <span className="hidden sm:inline">Share to LinkedIn</span>
              </div>
              <div className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={shareToLinkedin}
                  onChange={() => setShareToLinkedin(!shareToLinkedin)}
                  className="sr-only peer"
                />
                <div className="w-8 h-4 bg-[#E0E0E0] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-[#0A7EA4]" />
              </div>
            </label>
          )}
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={isLoading || (!content.trim() && !file) || selectedTags.length === 0}
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

      <Dialog open={tagsDialogOpen} onOpenChange={setTagsDialogOpen}>
        <DialogContent className="sm:max-w-[480px] gap-0 p-0 overflow-hidden rounded-[32px] border-none shadow-2xl bg-white">
          <DialogHeader className="px-5 pt-5 pb-3 border-b border-[#E0E0E0] bg-white text-left">
            <DialogTitle className="text-[18px] font-bold text-[#1A1A2E]">
              Add Tags <span className="text-red-500" aria-hidden>*</span>
            </DialogTitle>
            <DialogDescription className="text-[13px] text-[#757575]">
              At least one tag is required. Pick suggested tags or add your own.
            </DialogDescription>
          </DialogHeader>

          <div className="px-5 py-4 max-h-[50vh] overflow-y-auto bg-white">
            <p className="text-[11px] font-bold uppercase tracking-wide text-[#757575] mb-2">
              Suggested
            </p>
            <div className="flex flex-wrap gap-2">
              {STATIC_POST_TAGS.map((label) => {
                const isSelected = selectedTags.some(
                  (t) => normalizeTag(t).toLowerCase() === normalizeTag(label).toLowerCase()
                );
                return (
                  <button
                    key={label}
                    type="button"
                    onClick={() => toggleTag(label)}
                    className={clsx(
                      "px-3 py-1.5 rounded-full text-[13px] font-semibold border transition-colors",
                      isSelected
                        ? "bg-[#0A7EA4] border-[#0A7EA4] text-white"
                        : "bg-white border-[#E0E0E0] text-[#3C3C3C] hover:border-[#0A7EA4] hover:text-[#0A7EA4]"
                    )}
                  >
                    #{normalizeTag(label)}
                  </button>
                );
              })}
            </div>

            <p className="text-[11px] font-bold uppercase tracking-wide text-[#757575] mt-5 mb-2">
              Custom tag
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={customTagInput}
                onChange={(e) => sanitizeTextOnChange(e.target.value, setCustomTagInput)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addCustomTag();
                  }
                }}
                placeholder="e.g. crypto, forex"
                className="flex-1 h-[40px] px-3 bg-white border border-[#E0E0E0] rounded-lg text-[14px] text-[#1A1A2E] focus:outline-none focus:ring-1 focus:ring-[#0A7EA4]"
              />
              <button
                type="button"
                onClick={addCustomTag}
                disabled={!normalizeTag(customTagInput)}
                className="h-[40px] px-4 rounded-lg bg-[#1A1A2E] text-white text-[13px] font-bold hover:bg-[#2A2A3E] disabled:opacity-50"
              >
                Add
              </button>
            </div>

            {selectedTags.length > 0 && (
              <div className="mt-4 pt-4 border-t border-[#E0E0E0]">
                <p className="text-[11px] font-bold uppercase tracking-wide text-[#757575] mb-2">
                  Selected ({selectedTags.length})
                </p>
                <div className="flex flex-wrap gap-2">
                  {selectedTags.map((t) => (
                    <span
                      key={t}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#E0F2F7] text-[#0A7EA4] text-[12px] font-semibold"
                    >
                      #{normalizeTag(t)}
                      <button
                        type="button"
                        onClick={() => removeTag(t)}
                        className="hover:text-[#086a8a]"
                        aria-label={`Remove ${t}`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="px-5 py-4 border-t border-[#E0E0E0] flex justify-end gap-2 bg-white">
            <button
              type="button"
              onClick={() => setSelectedTags([])}
              disabled={selectedTags.length === 0}
              className="h-[40px] px-4 rounded-lg border border-[#E0E0E0] text-[#3C3C3C] text-[13px] font-semibold hover:bg-white disabled:opacity-50"
            >
              Clear all
            </button>
            <button
              type="button"
              onClick={() => setTagsDialogOpen(false)}
              className="h-[40px] px-5 rounded-lg bg-[#0A7EA4] text-white text-[13px] font-bold hover:bg-[#086a8a]"
            >
              Done
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
