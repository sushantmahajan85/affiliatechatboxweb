import type { LegalSection } from "@/lib/terms-of-service-content";

type TermsContentBodyProps = {
  sections: LegalSection[];
  compact?: boolean;
};

export function TermsContentBody({ sections, compact = false }: TermsContentBodyProps) {
  const headingClass = compact
    ? "text-[14px] font-bold text-[#1A1A2E] mb-2"
    : "text-[18px] font-bold text-[#1A1A2E] mb-3";
  const majorHeadingClass = compact
    ? "text-[15px] font-bold text-[#1A1A2E] mb-2"
    : "text-[22px] font-bold text-[#1A1A2E] mb-4";
  const textClass = compact
    ? "text-[13px] text-[#4B5563] leading-relaxed"
    : "text-[15px] text-[#4B5563] leading-relaxed";

  return (
    <div className={compact ? "space-y-5" : "space-y-10"}>
      {sections.map((section) => (
        <section
          key={section.title}
          className={section.isMajorHeading ? "border-t border-[#E8E8E8] pt-4" : undefined}
        >
          <h2 className={section.isMajorHeading ? majorHeadingClass : headingClass}>
            {section.title}
          </h2>
          <div className="space-y-2">
            {section.paragraphs.map((p) => (
              <p key={p.slice(0, 48)} className={textClass}>
                {p}
              </p>
            ))}
          </div>
          {section.bullets?.length ? (
            <ul className={`mt-2 space-y-1 list-disc pl-5 ${textClass}`}>
              {section.bullets.map((item) => (
                <li key={item.slice(0, 48)}>{item}</li>
              ))}
            </ul>
          ) : null}
          {section.subsections?.length ? (
            <div className="mt-3 space-y-3">
              {section.subsections.map((sub) => (
                <div key={sub.title || sub.paragraphs?.[0]?.slice(0, 48) || "sub"}>
                  {sub.title ? (
                    <h3 className="text-[13px] font-semibold text-[#1A1A2E] mb-1">{sub.title}</h3>
                  ) : null}
                  {sub.paragraphs?.map((p) => (
                    <p key={p.slice(0, 48)} className={`${textClass} mb-1`}>
                      {p}
                    </p>
                  ))}
                  {sub.bullets?.length ? (
                    <ul className={`space-y-1 list-disc pl-5 ${textClass}`}>
                      {sub.bullets.map((item) => (
                        <li key={item.slice(0, 48)}>{item}</li>
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
  );
}
