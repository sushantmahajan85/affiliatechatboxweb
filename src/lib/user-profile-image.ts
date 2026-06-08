export type UserProfileImageSource = {
  profileImageUrl?: string | null;
  googleProfileImageUrl?: string | null;
  linkedinProfileImageUrl?: string | null;
  awsbucketObjectkey?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
};

export function buildUiAvatarUrl(displayName: string): string {
  const q = encodeURIComponent(String(displayName || "User").trim() || "User");
  return `https://ui-avatars.com/api/?name=${q}&background=0A7EA4&color=fff`;
}

/** Custom S3 upload → Google picture → LinkedIn picture → legacy profileImageUrl → generated avatar. */
export function resolveUserProfileImageUrl(
  user?: UserProfileImageSource | null,
  fallbackDisplayName = "User"
): string {
  if (!user || typeof user !== "object") return buildUiAvatarUrl(fallbackDisplayName);

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
  return buildUiAvatarUrl(fn || (user.email != null ? String(user.email) : "") || fallbackDisplayName);
}
