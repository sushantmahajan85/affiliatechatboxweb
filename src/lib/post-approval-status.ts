export type PostApprovalStatus = "pending" | "approved" | "disapproved";

export function getPostApprovalStatus(post: {
  underApproval?: boolean;
  isApproved?: boolean;
}): PostApprovalStatus {
  if (post.underApproval) return "pending";
  if (post.isApproved) return "approved";
  return "disapproved";
}

const STATUS_STYLES: Record<
  PostApprovalStatus,
  { label: string; className: string }
> = {
  pending: {
    label: "Pending",
    className:
      "bg-[#FEF3C7] text-[#92400E] border-[#FDE68A]",
  },
  approved: {
    label: "Approved",
    className:
      "bg-[#D1FAE5] text-[#065F46] border-[#A7F3D0]",
  },
  disapproved: {
    label: "Disapproved",
    className:
      "bg-[#FEE2E2] text-[#991B1B] border-[#FECACA]",
  },
};

export function getPostApprovalBadge(post: {
  underApproval?: boolean;
  isApproved?: boolean;
}) {
  const status = getPostApprovalStatus(post);
  return STATUS_STYLES[status];
}
