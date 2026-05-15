export function isLinkedinOnlyChatBlocked(
  senderLinkedinVerified: boolean | undefined,
  recipientLinkedinVerified: boolean | undefined
): boolean {
  if (!senderLinkedinVerified) return false;
  return recipientLinkedinVerified !== true;
}
