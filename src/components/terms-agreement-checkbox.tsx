"use client";

import Link from "next/link";
import { Checkbox } from "@/components/ui/checkbox";

type TermsAgreementCheckboxProps = {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  id?: string;
  className?: string;
};

export function TermsAgreementCheckbox({
  checked,
  onCheckedChange,
  id = "terms-agreement",
  className = "",
}: TermsAgreementCheckboxProps) {
  return (
    <label
      className={`flex items-start gap-3 rounded-[12px] border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3 cursor-pointer ${className}`}
    >
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={(value) => onCheckedChange(value === true)}
        className="mt-0.5"
      />
      <span className="text-[13px] text-[#4B5563] leading-relaxed">
        I agree to the{" "}
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
  );
}
