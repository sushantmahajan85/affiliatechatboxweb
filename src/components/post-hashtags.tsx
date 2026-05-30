"use client";

import { clsx } from "clsx";
import { parsePostHashtags } from "@/lib/post-tags";

interface PostHashtagsProps {
  postDescription?: string | null;
  className?: string;
  onTagClick?: (e: React.MouseEvent) => void;
}

export function PostHashtags({
  postDescription,
  className,
  onTagClick,
}: PostHashtagsProps) {
  const tags = parsePostHashtags(postDescription);
  if (tags.length === 0) return null;

  return (
    <div
      className={clsx("flex flex-wrap gap-x-2 gap-y-1", className)}
      onClick={onTagClick}
    >
      {tags.map((tag) => (
        <span
          key={tag}
          className="text-[13px] font-semibold text-[#0A7EA4] hover:underline"
        >
          #{tag}
        </span>
      ))}
    </div>
  );
}
