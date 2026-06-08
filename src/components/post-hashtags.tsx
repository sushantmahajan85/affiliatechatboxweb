"use client";

import { clsx } from "clsx";
import { parsePostHashtags } from "@/lib/post-tags";

interface PostHashtagsProps {
  postDescription?: string | null;
  className?: string;
  onTagClick?: (e: React.MouseEvent) => void;
  /** Feed cards: cap visible tags to keep card height consistent */
  maxTags?: number;
}

export function PostHashtags({
  postDescription,
  className,
  onTagClick,
  maxTags,
}: PostHashtagsProps) {
  const tags = parsePostHashtags(postDescription);
  if (tags.length === 0) return null;

  const visibleTags =
    maxTags != null && maxTags > 0 ? tags.slice(0, maxTags) : tags;
  const hiddenCount = tags.length - visibleTags.length;

  return (
    <div
      className={clsx("flex flex-wrap items-center gap-x-2 gap-y-1", className)}
      onClick={onTagClick}
    >
      {visibleTags.map((tag) => (
        <span
          key={tag}
          className="text-[13px] font-semibold text-[#0A7EA4] hover:underline shrink-0"
        >
          #{tag}
        </span>
      ))}
      {hiddenCount > 0 && (
        <span className="text-[12px] font-medium text-[#757575] shrink-0">
          +{hiddenCount} more
        </span>
      )}
    </div>
  );
}
