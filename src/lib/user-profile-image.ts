function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function initialsFromName(displayName: string): string {
  const parts = String(displayName || "User")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) return "U";

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase() || "U";
}

export function buildInitialsAvatarDataUrl(
  displayName: string,
  background = "0A7EA4"
): string {
  const initials = escapeXml(initialsFromName(displayName));
  const bg = /^[0-9A-Fa-f]{6}$/.test(background) ? background : "0A7EA4";
  const svg = [
    '<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">',
    `<rect width="128" height="128" fill="#${bg}"/>`,
    `<text x="50%" y="50%" dy=".35em" text-anchor="middle" fill="#ffffff" font-family="system-ui,-apple-system,sans-serif" font-size="48" font-weight="600">${initials}</text>`,
    "</svg>",
  ].join("");

  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

export type UserProfileImageSource = {
  profileImageUrl?: string | null;
  googleProfileImageUrl?: string | null;
  linkedinProfileImageUrl?: string | null;
  awsbucketObjectkey?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
};

/** @deprecated Use buildInitialsAvatarDataUrl — kept as alias for existing imports. */
export function buildUiAvatarUrl(displayName: string): string {
  return buildInitialsAvatarDataUrl(displayName);
}

/** Custom S3 upload → Google picture → LinkedIn picture → legacy profileImageUrl → generated avatar. */
export function resolveUserProfileImageUrl(
  user?: UserProfileImageSource | null,
  fallbackDisplayName = "User"
): string {
  if (!user || typeof user !== "object") {
    return buildInitialsAvatarDataUrl(fallbackDisplayName);
  }

  const key = user.awsbucketObjectkey != null ? String(user.awsbucketObjectkey).trim() : "";
  const prof = user.profileImageUrl != null ? String(user.profileImageUrl).trim() : "";
  if (key && prof) return prof;

  const googlePic =
    user.googleProfileImageUrl != null ? String(user.googleProfileImageUrl).trim() : "";
  if (googlePic) return googlePic;

  const linkedinPic =
    user.linkedinProfileImageUrl != null ? String(user.linkedinProfileImageUrl).trim() : "";
  if (linkedinPic) return linkedinPic;

  if (prof) return prof;

  const fn = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
  return buildInitialsAvatarDataUrl(
    fn || (user.email != null ? String(user.email) : "") || fallbackDisplayName
  );
}
