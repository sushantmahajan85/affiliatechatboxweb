"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

type LegalSubsection = {
  title: string;
  bullets?: string[];
  paragraphs?: string[];
};

type LegalSection = {
  title: string;
  paragraphs: string[];
  bullets?: string[];
  subsections?: LegalSubsection[];
  isMajorHeading?: boolean;
};

type LegalPageShellProps = {
  title: string;
  subtitle: string;
  lastUpdated: string;
  dateLabel?: string;
  sections: LegalSection[];
  footerNote?: ReactNode;
};

export function LegalPageShell({
  title,
  subtitle,
  lastUpdated,
  dateLabel = "Last updated",
  sections,
  footerNote,
}: LegalPageShellProps) {
  const router = useRouter();

  return (
    <div className="w-full flex justify-center px-4 sm:px-6 py-6 sm:py-8">
      <div className="w-full max-w-3xl">
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-[14px] font-medium text-[#757575] hover:text-[#0A7EA4] transition-colors mb-6 px-1 py-1.5 rounded-lg hover:bg-white/80"
        >
          <ArrowLeft className="w-4 h-4 shrink-0" />
          Back
        </button>

        <div className="bg-white rounded-[16px] shadow-[0_4px_12px_rgba(0,0,0,0.04)] border border-[#F3F4F6] overflow-hidden">
        <div className="px-6 sm:px-10 pt-10 pb-8 border-b border-[#F3F4F6] bg-gradient-to-br from-[#F5F7FB] to-white">
          <p className="text-[12px] font-semibold uppercase tracking-wider text-[#0A7EA4] mb-3">
            Legal
          </p>
          <h1 className="text-[28px] sm:text-[32px] font-bold text-[#1A1A2E] leading-tight mb-3">
            {title}
          </h1>
          <p className="text-[15px] text-[#757575] leading-relaxed max-w-2xl">{subtitle}</p>
          <p className="text-[13px] text-[#9E9E9E] mt-4">{dateLabel}: {lastUpdated}</p>
        </div>

        <div className="px-6 sm:px-10 py-8 sm:py-10 space-y-10">
          {sections.map((section) => (
            <section
              key={section.title}
              className={section.isMajorHeading ? "border-t border-[#E8E8E8] pt-10" : undefined}
            >
              <h2
                className={
                  section.isMajorHeading
                    ? "text-[22px] font-bold text-[#1A1A2E] mb-4"
                    : "text-[18px] font-bold text-[#1A1A2E] mb-3"
                }
              >
                {section.title}
              </h2>
              <div className="space-y-3">
                {section.paragraphs.map((p) => (
                  <p key={p.slice(0, 40)} className="text-[15px] text-[#4B5563] leading-relaxed">
                    {p}
                  </p>
                ))}
              </div>
              {section.bullets?.length ? (
                <ul className="mt-3 space-y-2 list-disc pl-5">
                  {section.bullets.map((item) => (
                    <li key={item.slice(0, 40)} className="text-[15px] text-[#4B5563] leading-relaxed">
                      {item}
                    </li>
                  ))}
                </ul>
              ) : null}
              {section.subsections?.length ? (
                <div className="mt-4 space-y-4">
                  {section.subsections.map((sub) => (
                    <div key={sub.title || sub.paragraphs?.[0]?.slice(0, 40) || "sub"}>
                      {sub.title ? (
                        <h3 className="text-[15px] font-semibold text-[#1A1A2E] mb-2">{sub.title}</h3>
                      ) : null}
                      {sub.paragraphs?.map((p) => (
                        <p key={p.slice(0, 40)} className="text-[15px] text-[#4B5563] leading-relaxed mb-2">
                          {p}
                        </p>
                      ))}
                      {sub.bullets?.length ? (
                        <ul className="space-y-2 list-disc pl-5">
                          {sub.bullets.map((item) => (
                            <li key={item.slice(0, 40)} className="text-[15px] text-[#4B5563] leading-relaxed">
                              {item}
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : null}
            </section>
          ))}
        </div>

        {footerNote ? (
          <div className="px-6 sm:px-10 py-6 bg-[#FAFAFA] border-t border-[#F3F4F6]">
            <p className="text-[13px] text-[#757575] leading-relaxed">{footerNote}</p>
          </div>
        ) : null}
        </div>
      </div>
    </div>
  );
}
