import { formatDistanceToNow } from "date-fns";

type PostTimingFields = {
  PostCreated?: string;
  BumpTime?: string | Date;
  isbumped?: boolean;
};

function parsePostDate(value?: string | Date): Date | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function getBumpCooldownAnchor(post: PostTimingFields): Date | null {
  if (post.isbumped && post.BumpTime) {
    return parsePostDate(post.BumpTime);
  }
  return parsePostDate(post.PostCreated);
}

export function canBumpPost(post: PostTimingFields): boolean {
  const anchor = getBumpCooldownAnchor(post);
  if (!anchor) return false;
  return Date.now() - anchor.getTime() >= 24 * 60 * 60 * 1000;
}

export function formatPostAge(post: PostTimingFields): string {
  const created = parsePostDate(post.PostCreated);
  if (created) {
    return formatDistanceToNow(created, { addSuffix: true });
  }
  const bumped = parsePostDate(post.BumpTime);
  if (bumped) {
    return formatDistanceToNow(bumped, { addSuffix: true });
  }
  return "recently";
}
