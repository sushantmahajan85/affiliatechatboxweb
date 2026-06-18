"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getSiteUrl } from "@/lib/site-url";
import clsx from "clsx";
import { useEffect, useState } from "react";
import {
  FaFacebookF,
  FaLinkedinIn,
  FaTelegramPlane,
  FaTwitter,
  FaWhatsapp,
} from "react-icons/fa";
import { FiCheck, FiCopy, FiX } from "react-icons/fi";
import { toast } from "sonner";

type SharePostDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  postId: string;
  postContent: string;
};

export function getPostShareUrl(postId: string): string {
  const path = `/post/${encodeURIComponent(postId)}`;
  if (typeof window !== "undefined") {
    return `${window.location.origin}${path}`;
  }
  return `${getSiteUrl()}${path}`;
}

export function SharePostDialog({
  open,
  onOpenChange,
  postId,
  postContent,
}: SharePostDialogProps) {
  const [copied, setCopied] = useState(false);
  const [shareUrl, setShareUrl] = useState("");

  useEffect(() => {
    if (!open || !postId) return;
    setShareUrl(getPostShareUrl(postId));
    setCopied(false);
  }, [open, postId]);

  const previewText =
    postContent.length > 100 ? `${postContent.substring(0, 100)}...` : postContent;

  const platforms = [
    {
      name: "WhatsApp",
      icon: FaWhatsapp,
      color: "#25D366",
      bg: "#E8FAEF",
      href: `https://wa.me/?text=${encodeURIComponent(`${postContent}\n\nRead more at: ${shareUrl}`)}`,
    },
    {
      name: "Facebook",
      icon: FaFacebookF,
      color: "#1877F2",
      bg: "#E8F1FF",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
    },
    {
      name: "X",
      icon: FaTwitter,
      color: "#000000",
      bg: "#F5F5F5",
      href: `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(previewText)}`,
    },
    {
      name: "LinkedIn",
      icon: FaLinkedinIn,
      color: "#0A66C2",
      bg: "#E6F0F9",
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
    },
    {
      name: "Telegram",
      icon: FaTelegramPlane,
      color: "#0088CC",
      bg: "#E5F3F9",
      href: `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(previewText)}`,
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white border-none rounded-[24px] p-0 overflow-hidden shadow-2xl">
        <div className="p-6">
          <DialogHeader className="mb-6">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-[20px] font-bold text-[#1A1A2E]">
                Share Post
              </DialogTitle>
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="p-2 hover:bg-[#F5F5F5] rounded-full transition-colors"
              >
                <FiX className="w-5 h-5 text-[#757575]" />
              </button>
            </div>
          </DialogHeader>

          <div className="grid grid-cols-4 gap-4 mb-8">
            {platforms.map((platform) => (
              <a
                key={platform.name}
                href={shareUrl ? platform.href : undefined}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-2 group cursor-pointer"
                onClick={(e) => {
                  if (!shareUrl) e.preventDefault();
                }}
              >
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-active:scale-95"
                  style={{ backgroundColor: platform.bg }}
                >
                  <platform.icon className="w-6 h-6" style={{ color: platform.color }} />
                </div>
                <span className="text-[12px] font-medium text-[#4B5563]">
                  {platform.name}
                </span>
              </a>
            ))}
          </div>

          <div className="space-y-2">
            <label className="text-[13px] font-bold text-[#757575] uppercase tracking-wider">
              Page Link
            </label>
            <div className="flex items-center gap-2 p-1.5 bg-[#F8F9FA] border border-[#E5E7EB] rounded-xl focus-within:border-[#0A7EA4] transition-colors group">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="flex-1 bg-transparent px-3 py-2 text-[14px] text-[#1A1A2E] outline-none"
              />
              <button
                type="button"
                onClick={() => {
                  if (!shareUrl) return;
                  navigator.clipboard.writeText(shareUrl);
                  setCopied(true);
                  toast.success("Link copied to clipboard!");
                  setTimeout(() => setCopied(false), 2000);
                }}
                className={clsx(
                  "px-4 py-2 rounded-lg text-[13px] font-bold transition-all flex items-center gap-2",
                  copied
                    ? "bg-[#10B981] text-white"
                    : "bg-[#0A7EA4] text-white hover:bg-[#086a8a]"
                )}
              >
                {copied ? <FiCheck className="w-4 h-4" /> : <FiCopy className="w-4 h-4" />}
                <span>{copied ? "Copied" : "Copy"}</span>
              </button>
            </div>
          </div>
        </div>

        <div className="bg-[#F8F9FA] px-6 py-4 border-t border-[#E5E7EB] flex items-center justify-between">
          <span className="text-[13px] text-[#6B7280]">
            Anyone with this link can view this post.
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
