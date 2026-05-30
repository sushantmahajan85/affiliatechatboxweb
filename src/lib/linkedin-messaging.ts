export type LinkedinChatBlockReason = "sender_not_verified" | "recipient_not_verified";

export function isSelfChatPartner(
  currentUserId: string | undefined,
  partnerId: string | undefined
): boolean {
  if (!currentUserId || !partnerId) return false;
  return String(currentUserId) === String(partnerId);
}

export function getLinkedinChatBlockReason(
  senderLinkedinVerified: boolean | undefined,
  recipientLinkedinVerified: boolean | undefined,
  senderIsAdmin?: boolean,
  recipientIsAdmin?: boolean
): LinkedinChatBlockReason | null {
  if (senderIsAdmin) return null;
  if (!senderLinkedinVerified) return "sender_not_verified";
  if (recipientIsAdmin) return null;
  if (recipientLinkedinVerified !== true) return "recipient_not_verified";
  return null;
}

/** True when chat must not proceed (non-admin sender). LinkedIn-verified users may only chat with LinkedIn-verified members or admins. */
export function isLinkedinOnlyChatBlocked(
  senderLinkedinVerified: boolean | undefined,
  recipientLinkedinVerified: boolean | undefined,
  senderIsAdmin?: boolean,
  recipientIsAdmin?: boolean
): boolean {
  return (
    getLinkedinChatBlockReason(
      senderLinkedinVerified,
      recipientLinkedinVerified,
      senderIsAdmin,
      recipientIsAdmin
    ) !== null
  );
}

export function senderCanUseLinkedinChat(
  senderLinkedinVerified: boolean | undefined,
  senderIsAdmin?: boolean
): boolean {
  return Boolean(senderIsAdmin || senderLinkedinVerified);
}
