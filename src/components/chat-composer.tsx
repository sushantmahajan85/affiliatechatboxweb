"use client";

import { clsx } from "clsx";
import { Loader2, Paperclip, Send, Smile, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const CHAT_EMOJIS = [
  "😀", "😂", "😊", "😍", "🥰", "😎", "🤔", "👍",
  "🙏", "👏", "🔥", "💯", "✅", "❤️", "🎉", "💪",
  "😢", "😮", "🙌", "💼", "📈", "🤝", "💬", "📎",
];

type PendingImage = {
  file: File;
  previewUrl: string;
};

type ChatComposerProps = {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onAttachImage: (file: File, caption: string) => Promise<boolean> | boolean;
  beforeAttach?: () => boolean;
  disabled?: boolean;
  isSending?: boolean;
  isUploading?: boolean;
  placeholder?: string;
};

export function ChatComposer({
  value,
  onChange,
  onSend,
  onAttachImage,
  beforeAttach,
  disabled = false,
  isSending = false,
  isUploading = false,
  placeholder = "Type a message...",
}: ChatComposerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewCaptionRef = useRef<HTMLInputElement>(null);
  const [pendingImage, setPendingImage] = useState<PendingImage | null>(null);
  const [previewCaption, setPreviewCaption] = useState("");
  const [previewSending, setPreviewSending] = useState(false);

  const busy = disabled || isSending || isUploading || previewSending;
  const canSend = Boolean(value.trim()) && !busy;
  const previewOpen = Boolean(pendingImage);

  useEffect(() => {
    if (!previewOpen) return;
    const t = window.setTimeout(() => previewCaptionRef.current?.focus(), 50);
    return () => window.clearTimeout(t);
  }, [previewOpen]);

  useEffect(() => {
    return () => {
      if (pendingImage?.previewUrl) URL.revokeObjectURL(pendingImage.previewUrl);
    };
  }, [pendingImage?.previewUrl]);

  const closePreview = () => {
    if (pendingImage?.previewUrl) URL.revokeObjectURL(pendingImage.previewUrl);
    setPendingImage(null);
    setPreviewCaption("");
    setPreviewSending(false);
  };

  const insertEmoji = (emoji: string) => {
    if (previewOpen) {
      setPreviewCaption((c) => c + emoji);
      return;
    }
    onChange(value + emoji);
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || busy) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }
    if (beforeAttach && !beforeAttach()) return;

    const previewUrl = URL.createObjectURL(file);
    setPreviewCaption("");
    setPendingImage((prev) => {
      if (prev?.previewUrl) URL.revokeObjectURL(prev.previewUrl);
      return { file, previewUrl };
    });
  };

  useEffect(() => {
    if (!previewOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !previewSending && !isUploading) closePreview();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [previewOpen, previewSending, isUploading]);

  const confirmPreviewSend = async () => {
    if (!pendingImage || previewSending) return;
    setPreviewSending(true);
    try {
      const ok = await onAttachImage(pendingImage.file, previewCaption.trim());
      if (ok) closePreview();
    } finally {
      setPreviewSending(false);
    }
  };

  return (
    <>
      {pendingImage ? (
        <div
          className="fixed inset-0 z-[100] flex flex-col bg-[#0b141a] text-white"
          role="dialog"
          aria-modal="true"
          aria-label="Image preview"
        >
          <div className="flex items-center gap-3 px-3 py-3 shrink-0 bg-[#0b141a] border-b border-white/10">
            <button
              type="button"
              onClick={closePreview}
              disabled={previewSending || isUploading}
              className="p-2 rounded-full hover:bg-white/10 transition-colors disabled:opacity-40"
              aria-label="Cancel"
            >
              <X className="w-6 h-6" />
            </button>
            <span className="text-[16px] font-medium text-white/90">Preview</span>
          </div>

          <div className="flex-1 min-h-0 flex items-center justify-center p-4 overflow-hidden bg-[#0b141a]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={pendingImage.previewUrl}
              alt="Attachment preview"
              className="max-w-full max-h-full object-contain rounded-md shadow-2xl"
            />
          </div>

          <div className="shrink-0 px-3 py-3 pb-4 bg-[#1f2c34] border-t border-white/10">
            <div className="flex items-end gap-3 max-w-4xl mx-auto">
              <div className="flex-1 flex items-center bg-[#2a3942] rounded-3xl px-4 py-2.5 min-h-[44px]">
                <input
                  ref={previewCaptionRef}
                  type="text"
                  value={previewCaption}
                  onChange={(e) => setPreviewCaption(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      void confirmPreviewSend();
                    }
                  }}
                  placeholder="Add a caption..."
                  disabled={previewSending || isUploading}
                  className="flex-1 bg-transparent border-none focus:outline-none text-[15px] text-white placeholder:text-[#8696a0] disabled:opacity-50"
                />
              </div>
              <button
                type="button"
                onClick={() => void confirmPreviewSend()}
                disabled={previewSending || isUploading}
                className={clsx(
                  "shrink-0 w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-lg",
                  previewSending || isUploading
                    ? "bg-[#00a884]/60 cursor-not-allowed"
                    : "bg-[#00a884] hover:bg-[#06cf9c] active:scale-95"
                )}
                aria-label="Send image"
              >
                {previewSending || isUploading ? (
                  <Loader2 className="w-5 h-5 text-white animate-spin" />
                ) : (
                  <Send className="w-5 h-5 text-white ml-0.5" />
                )}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="flex items-center gap-2 md:gap-4 max-w-4xl mx-auto bg-[#F5F7FB] p-2 rounded-2xl border border-[#E0E0E0] w-full">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onFileChange}
        />
        <button
          type="button"
          disabled={busy}
          onClick={() => fileInputRef.current?.click()}
          className="p-2 text-[#757575] hover:bg-white rounded-xl transition-all disabled:opacity-40"
          aria-label="Attach image"
          title="Attach image"
        >
          {isUploading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Paperclip className="w-5 h-5" />
          )}
        </button>

        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              if (canSend) onSend();
            }
          }}
          placeholder={placeholder}
          disabled={busy}
          className="flex-1 bg-transparent border-none focus:outline-none text-[15px] placeholder:text-[#9E9E9E] px-2 disabled:opacity-50"
        />

        <div className="flex items-center gap-1 pr-1">
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                disabled={busy}
                className="p-2 text-[#757575] hover:bg-white rounded-xl transition-all disabled:opacity-40"
                aria-label="Insert emoji"
                title="Emoji"
              >
                <Smile className="w-5 h-5" />
              </button>
            </PopoverTrigger>
            <PopoverContent
              align="end"
              side="top"
              className="w-[280px] p-2 bg-white border border-[#E0E0E0] shadow-lg"
            >
              <div className="grid grid-cols-8 gap-0.5 max-h-[200px] overflow-y-auto">
                {CHAT_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => insertEmoji(emoji)}
                    className="h-9 w-9 flex items-center justify-center text-xl hover:bg-[#F5F7FB] rounded-lg transition-colors"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          <button
            type="button"
            onClick={onSend}
            disabled={!canSend}
            className={clsx(
              "p-2.5 rounded-xl transition-all shadow-sm active:scale-95",
              canSend ? "bg-[#0A7EA4] text-white" : "bg-gray-200 text-gray-400 cursor-not-allowed"
            )}
            aria-label="Send message"
          >
            {isSending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
    </>
  );
}
