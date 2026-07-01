"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { TermsContentBody } from "@/components/terms-content-body";
import {
  TERMS_OF_SERVICE_META,
  TERMS_OF_SERVICE_SECTIONS,
} from "@/lib/terms-of-service-content";
import { markTermsAccepted } from "@/lib/terms-acceptance-preference";

const MIN_READ_MS = 5000;
const SCROLL_BOTTOM_THRESHOLD = 24;

type TermsAcceptancePanelProps = {
  onAccepted: () => void;
  compact?: boolean;
  continueLabel?: string;
};

export function TermsAcceptancePanel({
  onAccepted,
  compact = false,
  continueLabel = "Continue to sign in",
}: TermsAcceptancePanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const openedAt = useRef(Date.now());
  const hasScrolled = useRef(false);

  const [canCheck, setCanCheck] = useState(false);
  const [checked, setChecked] = useState(false);

  const evaluateScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;

    if (el.scrollTop > 8) {
      hasScrolled.current = true;
    }

    const atBottom =
      el.scrollTop + el.clientHeight >= el.scrollHeight - SCROLL_BOTTOM_THRESHOLD;

    if (atBottom) {
      setCanCheck(true);
    }
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    if (el.scrollHeight <= el.clientHeight + 1) {
      setCanCheck(true);
    }

    evaluateScroll();
  }, [evaluateScroll]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      const elapsed = Date.now() - openedAt.current;
      if (elapsed >= MIN_READ_MS && hasScrolled.current) {
        setCanCheck(true);
      }
    }, 400);

    return () => window.clearInterval(timer);
  }, []);

  const handleContinue = () => {
    if (!checked || !canCheck) return;
    markTermsAccepted();
    onAccepted();
  };

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h2 className={compact ? "text-[20px] font-black text-[#1A1A1A]" : "text-[24px] font-black text-[#1A1A1A]"}>
          {TERMS_OF_SERVICE_META.title}
        </h2>
        <p className="text-[#64748B] font-bold text-sm mt-2">
          Please read and accept before continuing
        </p>
        <p className="text-[12px] text-[#94A3B8] mt-1">
          {TERMS_OF_SERVICE_META.dateLabel}: {TERMS_OF_SERVICE_META.lastUpdated}
        </p>
      </div>

      <div
        ref={scrollRef}
        onScroll={evaluateScroll}
        className="max-h-[240px] sm:max-h-[280px] overflow-y-auto rounded-[16px] border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-4 scroll-smooth"
        aria-label="Terms of Service content"
      >
        <TermsContentBody sections={TERMS_OF_SERVICE_SECTIONS} compact />
      </div>

      {!canCheck ? (
        <p className="text-[12px] text-[#94A3B8] text-center font-medium">
          Scroll to the bottom or read for a few seconds to enable acceptance
        </p>
      ) : null}

      <label
        className={`flex items-start gap-3 rounded-[12px] border px-4 py-3 transition-colors ${
          canCheck
            ? "border-[#E2E8F0] bg-white cursor-pointer"
            : "border-[#F1F5F9] bg-[#FAFAFA] cursor-not-allowed opacity-70"
        }`}
      >
        <Checkbox
          id="terms-accept"
          checked={checked}
          disabled={!canCheck}
          onCheckedChange={(value) => setChecked(value === true)}
          className="mt-0.5"
        />
        <span className="text-[13px] text-[#4B5563] leading-relaxed">
          I have read and agree to the{" "}
          <Link
            href="/terms-of-service"
            target="_blank"
            className="text-[#0A7EA4] font-semibold hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link
            href="/privacy-policy"
            target="_blank"
            className="text-[#0A7EA4] font-semibold hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            Privacy Policy
          </Link>
        </span>
      </label>

      <button
        type="button"
        onClick={handleContinue}
        disabled={!canCheck || !checked}
        className="w-full h-[56px] bg-[#1A1A2E] rounded-[16px] text-white font-black hover:bg-[#2A2A3E] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {continueLabel}
      </button>
    </div>
  );
}
