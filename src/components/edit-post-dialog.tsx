"use client";

import { clsx } from "clsx";
import { ChevronDown, Image as ImageIcon, Loader2, Tag, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { ImageWithFallback } from "@/components/figma/ImageWithFallback";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { validateMediaUpload } from "@/lib/media-upload-limits";
import {
  formatTagsForPostDescription,
  GENERAL_POST_TYPE,
  normalizePostTag,
  parsePostHashtags,
  STATIC_POST_TAGS,
} from "@/lib/post-tags";
import { useEditPostMutation } from "@/store/endpoints/posts";
import { useAppSelector } from "@/store/hooks";

export type EditablePost = {
  _id: string;
  postContent?: string;
  postDescription?: string;
  tag?: string;
  postMediaUrl?: string;
  postMediaType?: string;
};

type EditPostDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  post: EditablePost | null;
};

export function EditPostDialog({ open, onOpenChange, post }: EditPostDialogProps) {
  const { user } = useAppSelector((state) => state.auth);
  const [editPost, { isLoading }] = useEditPostMutation();

  const [content, setContent] = useState("");
  const [category, setCategory] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tagsDialogOpen, setTagsDialogOpen] = useState(false);
  const [customTagInput, setCustomTagInput] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!post || !open) return;
    setContent(post.postContent || "");
    setCategory(post.tag && post.tag !== "blank" ? post.tag : GENERAL_POST_TYPE);
    setSelectedTags(parsePostHashtags(post.postDescription));
    setCustomTagInput("");
    setFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [post, open]);

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
    const normalized = normalizePostTag(label);
    if (!normalized) return;
    setSelectedTags((prev) =>
      prev.some((t) => normalizePostTag(t).toLowerCase() === normalized.toLowerCase())
        ? prev.filter((t) => normalizePostTag(t).toLowerCase() !== normalized.toLowerCase())
        : [...prev, label]
    );
  };

  const addCustomTag = () => {
    const normalized = normalizePostTag(customTagInput);
    if (!normalized) return;
    if (selectedTags.some((t) => normalizePostTag(t).toLowerCase() === normalized.toLowerCase())) {
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
    if (!post || !user?._id) return;

    if (!content.trim() && !file) {
      toast.error("Please add some content to your post.");
      return;
    }

    if (selectedTags.length === 0) {
      toast.error("Please add at least one tag.");
      setTagsDialogOpen(true);
      return;
    }

    try {
      const formData = new FormData();
      formData.append("postContent", content);
      formData.append("tag", category || GENERAL_POST_TYPE);
      formData.append("postDescription", formatTagsForPostDescription(selectedTags));
      formData.append("editorUserId", user._id);

      if (file) {
        formData.append("postMedia", file);
      }

      await editPost({ postId: post._id, formData }).unwrap();
      toast.success("Post updated successfully.");
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to update post.");
    }
  };

  const mediaPreview = previewUrl || post?.postMediaUrl;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[560px] gap-0 p-0 overflow-hidden rounded-[24px] border-none shadow-2xl bg-white max-h-[90vh] flex flex-col">
          <DialogHeader className="px-5 pt-5 pb-3 border-b border-[#E0E0E0] bg-white text-left shrink-0">
            <DialogTitle className="text-[18px] font-bold text-[#1A1A2E]">Edit Post</DialogTitle>
            <DialogDescription className="text-[13px] text-[#757575]">
              Fix typos, update your post type, or change tags. At least one tag is required.
            </DialogDescription>
          </DialogHeader>

          <div className="px-5 py-4 overflow-y-auto flex-1 space-y-4">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={5}
              placeholder="Post content…"
              className="w-full bg-[#F5F5F5] border border-[#E0E0E0] rounded-[10px] px-4 py-3 text-[14px] text-[#3C3C3C] focus:outline-none focus:ring-1 focus:ring-[#0A7EA4] resize-none"
            />

            <div className="flex flex-wrap items-center gap-2">
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
                Replace media
              </button>

              <div className="relative h-[38px]">
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="appearance-none pl-3 pr-8 h-full border border-[#E0E0E0] rounded-lg text-[13px] hover:bg-[#F5F5F5] transition-colors focus:outline-none cursor-pointer bg-white min-w-[120px] text-[#3C3C3C]"
                >
                  <option value={GENERAL_POST_TYPE}>General</option>
                  <option value="sell">Sell</option>
                  <option value="buy">Buy</option>
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#757575] pointer-events-none" />
              </div>

              <button
                type="button"
                onClick={() => setTagsDialogOpen(true)}
                className={clsx(
                  "flex items-center gap-2 px-3 h-[38px] border rounded-lg text-[13px] transition-colors",
                  selectedTags.length > 0
                    ? "border-[#0A7EA4] bg-[#E0F2F7] text-[#0A7EA4]"
                    : "border-[#FCA5A5] bg-[#FEF2F2] text-[#DC2626] hover:bg-[#FEE2E2]"
                )}
              >
                <Tag className="w-4 h-4 shrink-0" />
                {selectedTags.length > 0 ? `Tags (${selectedTags.length})` : "Edit Tags"}
                {selectedTags.length === 0 && (
                  <span className="text-red-500" aria-hidden>*</span>
                )}
              </button>
            </div>

            {selectedTags.length === 0 && (
              <p className="flex items-start gap-2 text-[13px] text-[#DC2626] bg-[#FEF2F2] border border-[#FECACA] rounded-lg px-3 py-2.5">
                <span className="shrink-0 mt-0.5" aria-hidden>⚠</span>
                <span>At least one tag is required. Open Edit Tags and add a tag before saving.</span>
              </p>
            )}

            {selectedTags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedTags.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#E0F2F7] text-[#0A7EA4] text-[12px] font-semibold"
                  >
                    #{normalizePostTag(t)}
                  </span>
                ))}
              </div>
            )}

            {mediaPreview && (
              <div className="relative inline-block">
                <div className="max-w-full rounded-lg overflow-hidden border border-[#E0E0E0] shadow-sm bg-black">
                  {(file?.type.startsWith("video/") || post?.postMediaType?.startsWith("video/")) && !previewUrl ? (
                    <video src={mediaPreview} controls className="max-w-full max-h-[240px]" />
                  ) : file?.type.startsWith("video/") ? (
                    <video src={mediaPreview} controls className="max-w-full max-h-[240px]" />
                  ) : (
                    <ImageWithFallback src={mediaPreview} alt="Post media" className="max-w-full max-h-[240px] object-contain" />
                  )}
                </div>
                {previewUrl && (
                  <button
                    type="button"
                    onClick={removeFile}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="px-5 py-4 border-t border-[#E0E0E0] flex justify-end gap-2 bg-white shrink-0">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="h-[40px] px-4 rounded-lg border border-[#E0E0E0] text-[#3C3C3C] text-[13px] font-semibold hover:bg-[#F5F5F5]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isLoading || (!content.trim() && !file) || selectedTags.length === 0}
              className="h-[40px] px-5 rounded-lg bg-[#0A7EA4] text-white text-[13px] font-bold hover:bg-[#086a8a] disabled:opacity-50 flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving…
                </>
              ) : (
                "Save Changes"
              )}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={tagsDialogOpen} onOpenChange={setTagsDialogOpen}>
        <DialogContent className="sm:max-w-[480px] gap-0 p-0 overflow-hidden rounded-[32px] border-none shadow-2xl bg-white">
          <DialogHeader className="px-5 pt-5 pb-3 border-b border-[#E0E0E0] bg-white text-left">
            <DialogTitle className="text-[18px] font-bold text-[#1A1A2E]">Edit Tags</DialogTitle>
            <DialogDescription className="text-[13px] text-[#757575]">
              At least one tag is required. Pick suggested tags or add your own.
            </DialogDescription>
          </DialogHeader>

          <div className="px-5 py-4 max-h-[50vh] overflow-y-auto bg-white">
            <p className="text-[11px] font-bold uppercase tracking-wide text-[#757575] mb-2">Suggested</p>
            <div className="flex flex-wrap gap-2">
              {STATIC_POST_TAGS.map((label) => {
                const isSelected = selectedTags.some(
                  (t) => normalizePostTag(t).toLowerCase() === normalizePostTag(label).toLowerCase()
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
                    #{normalizePostTag(label)}
                  </button>
                );
              })}
            </div>

            <p className="text-[11px] font-bold uppercase tracking-wide text-[#757575] mt-5 mb-2">Custom tag</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={customTagInput}
                onChange={(e) => setCustomTagInput(e.target.value)}
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
                disabled={!normalizePostTag(customTagInput)}
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
                      #{normalizePostTag(t)}
                      <button type="button" onClick={() => removeTag(t)} className="hover:text-[#086a8a]">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="px-5 py-4 border-t border-[#E0E0E0] flex justify-end bg-white">
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
    </>
  );
}
