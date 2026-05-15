export function isLinkedinOnlyChatBlocked(
  senderLinkedinVerified: boolean | undefined,
  recipientLinkedinVerified: boolean | undefined,
  senderIsAdmin?: boolean
): boolean {
  if (senderIsAdmin) return false;
  if (!senderLinkedinVerified) return false;
  return recipientLinkedinVerified !== true;
}
