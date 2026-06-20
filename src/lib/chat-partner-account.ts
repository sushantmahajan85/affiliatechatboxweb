import { clsx } from "clsx";

export type ChatPartnerAccountStatusLabel =
  | "active"
  | "suspended"
  | "deleted"
  | "unavailable";

export type ChatPartnerAccountStatus = {
  isSuspended: boolean;
  isDeleted: boolean;
  accountDisabled: boolean;
  statusLabel: ChatPartnerAccountStatusLabel;
  displayName?: string;
};

export function chatPartnerStatusBadge(label: ChatPartnerAccountStatusLabel): string | null {
  if (label === "suspended") return "Suspended";
  if (label === "deleted") return "Deleted";
  if (label === "unavailable") return "Unavailable";
  return null;
}

export function chatPartnerDisabledMessage(label: ChatPartnerAccountStatusLabel): string {
  if (label === "deleted") return "This account has been deleted.";
  if (label === "suspended") return "This account has been suspended.";
  return "This user is no longer available.";
}

export function chatPartnerRowClassName(
  selected: boolean,
  accountDisabled: boolean
): string {
  return clsx(
    "flex items-center gap-3 p-4 border-l-4 transition-colors",
    accountDisabled
      ? "cursor-not-allowed bg-[#F3F4F6] opacity-60 grayscale"
      : "cursor-pointer",
    !accountDisabled &&
      (selected
        ? "bg-[#F0F7F9] border-[#0A7EA4]"
        : "bg-white border-transparent hover:bg-[#F9FAFB]")
  );
}

export function resolveChatPartnerAccountStatus(
  input?: Partial<ChatPartnerAccountStatus> | null
): ChatPartnerAccountStatus {
  if (!input) {
    return {
      isSuspended: false,
      isDeleted: false,
      accountDisabled: false,
      statusLabel: "active",
    };
  }
  const isDeleted = Boolean(input.isDeleted);
  const isSuspended = Boolean(input.isSuspended);
  const accountDisabled = Boolean(input.accountDisabled ?? (isDeleted || isSuspended));
  let statusLabel: ChatPartnerAccountStatusLabel = "active";
  if (input.statusLabel && input.statusLabel !== "active") {
    statusLabel = input.statusLabel;
  } else if (isDeleted) {
    statusLabel = "deleted";
  } else if (isSuspended) {
    statusLabel = "suspended";
  }
  return {
    isSuspended,
    isDeleted,
    accountDisabled,
    statusLabel,
    displayName: input.displayName,
  };
}
