"use client";

import { Handshake } from "lucide-react";

import { ImageWithFallback } from "@/components/figma/ImageWithFallback";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Partner } from "@/store/endpoints/partners";

const PARTNER_DESC_CLAMP_CHARS = 120;

export function shouldShowPartnerSeeMore(description?: string): boolean {
  return Boolean(description && description.trim().length > PARTNER_DESC_CLAMP_CHARS);
}

export function getPartnerTitle(partner: Partner): string {
  return partner.name?.trim() || partner.btntext?.trim() || "Business Partner";
}

type PartnerDetailDialogProps = {
  partner: Partner | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function PartnerDetailDialog({
  partner,
  open,
  onOpenChange,
}: PartnerDetailDialogProps) {
  if (!partner) return null;

  const title = getPartnerTitle(partner);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px] bg-white border border-[#E2E8F0] rounded-2xl p-0 overflow-hidden gap-0">
        <DialogHeader className="p-6 pb-4 text-left space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 overflow-hidden shadow-sm bg-[#F1F5F9] border border-[#E2E8F0]">
              <ImageWithFallback
                src={partner.logo}
                alt={title}
                className="w-full h-full object-cover"
              />
            </div>
            {partner.type ? (
              <p className="text-[11px] text-[#0A7EA4] font-bold uppercase tracking-wider">
                {partner.type}
              </p>
            ) : null}
          </div>
          <DialogTitle className="sr-only">{title}</DialogTitle>
          <DialogDescription className="sr-only">
            Full partner details for {title}
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 pb-6 space-y-5">
          <div className="max-h-[min(50vh,320px)] overflow-y-auto rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] p-4">
            <p className="text-[14px] text-[#374151] leading-[1.7] whitespace-pre-wrap break-words">
              {partner.description || "No description available."}
            </p>
          </div>

          {partner.link ? (
            <button
              type="button"
              onClick={() => window.open(partner.link, "_blank", "noopener,noreferrer")}
              className="w-full h-11 bg-[#0A7EA4] text-white rounded-xl text-[14px] font-bold hover:bg-[#086a8a] transition-all flex items-center justify-center gap-2 shadow-sm active:scale-[0.98]"
            >
              <Handshake className="w-4 h-4" />
              <span>{partner.btntext || "Connect Partner"}</span>
            </button>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
