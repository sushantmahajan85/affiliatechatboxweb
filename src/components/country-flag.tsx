import { countryFlagImageUrl, normalizeCountryCode } from "@/lib/country-flag";
import { clsx } from "clsx";
import { Globe } from "lucide-react";

type CountryFlagProps = {
  flag?: string | null;
  className?: string;
  imageClassName?: string;
  size?: number;
  title?: string;
  /** Show globe when no country flag is set. Default: globe */
  fallback?: "globe" | "none";
  /** inline = beside name; badge = avatar overlay / compact chip */
  variant?: "inline" | "badge";
};

export function CountryFlag({
  flag,
  className,
  imageClassName,
  size = 16,
  title,
  fallback = "globe",
  variant = "inline",
}: CountryFlagProps) {
  const countryCode = normalizeCountryCode(flag);
  const flagWidth = Math.round(size * 1.34);
  const flagHeight = size;

  if (!countryCode) {
    if (fallback === "none") return null;

    if (variant === "badge") {
      return (
        <span
          className={clsx(
            "inline-flex items-center justify-center bg-[#EEF6F9] text-[#0A7EA4]",
            className
          )}
          style={{ width: flagWidth, height: flagHeight }}
          title={title || "Global"}
        >
          <Globe size={Math.max(12, Math.round(size * 0.62))} strokeWidth={2.25} />
        </span>
      );
    }

    return (
      <span
        className={clsx("inline-flex shrink-0 items-center text-[#9E9E9E]", className)}
        title={title || "Global"}
      >
        <Globe size={size} strokeWidth={2} />
      </span>
    );
  }

  if (variant === "badge") {
    return (
      <span
        className={clsx("inline-flex shrink-0 overflow-hidden bg-[#F3F4F6]", className)}
        style={{ width: flagWidth, height: flagHeight }}
        title={title || countryCode}
      >
        <img
          src={countryFlagImageUrl(countryCode, flagWidth <= 24 ? 40 : 80)}
          width={flagWidth}
          height={flagHeight}
          alt={`${countryCode} flag`}
          className={clsx("h-full w-full object-cover", imageClassName)}
          loading="lazy"
          decoding="async"
        />
      </span>
    );
  }

  return (
    <span
      className={clsx("inline-flex shrink-0 items-center overflow-hidden rounded-[3px]", className)}
      title={title || countryCode}
    >
      <img
        src={countryFlagImageUrl(countryCode, size <= 20 ? 20 : 40)}
        srcSet={`${countryFlagImageUrl(countryCode, size <= 20 ? 40 : 80)} 2x`}
        width={flagWidth}
        height={flagHeight}
        alt={`${countryCode} flag`}
        className={clsx("object-cover", imageClassName)}
        loading="lazy"
        decoding="async"
      />
    </span>
  );
}
