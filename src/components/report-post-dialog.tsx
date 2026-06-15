"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { isSelfChatPartner } from "@/lib/linkedin-messaging";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { openAuthModal } from "@/store/uiSlice";
import {
  useReportUserMutation,
} from "@/store/endpoints/members";
import { FiFlag, FiLoader } from "react-icons/fi";
import { useState } from "react";
import { toast } from "sonner";

export type ReportPostTarget = {
  postAuthorUserId: string;
  postContent: string;
  postUserName: string;
};

type ReportPostDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  target: ReportPostTarget | null;
};

export function ReportPostDialog({
  open,
  onOpenChange,
  target,
}: ReportPostDialogProps) {
  const dispatch = useAppDispatch();
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const [reason, setReason] = useState("");
  const [reportUser, { isLoading: isSubmitting }] = useReportUserMutation();

  const handleOpenChange = (next: boolean) => {
    if (!next) setReason("");
    onOpenChange(next);
  };

  const handleSubmit = async () => {
    if (!isAuthenticated || !user?._id) {
      dispatch(openAuthModal());
      return;
    }
    if (!target) return;

    if (isSelfChatPartner(user._id, target.postAuthorUserId)) {
      toast.error("You cannot report yourself");
      return;
    }

    const trimmed = reason.trim();
    if (!trimmed) {
      toast.error("Please enter a reason for your report");
      return;
    }

    try {
      await reportUser({
        reporterId: String(user._id),
        reportedId: String(target.postAuthorUserId),
        reason: trimmed,
        postContent: target.postContent || "",
      }).unwrap();

      toast.success("Post reported to admin.");
      handleOpenChange(false);
    } catch (err: unknown) {
      const message =
        (err as { data?: { message?: string } })?.data?.message ||
        "Failed to report post. Please try again.";
      toast.error(message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[420px] bg-white rounded-2xl border border-[#E2E8F0]">
        <DialogHeader className="text-center sm:text-center">
          <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-[#FEF2F2]">
            <FiFlag className="h-7 w-7 text-[#EF4444]" />
          </div>
          <DialogTitle className="text-[20px] font-bold text-[#1A1A2E]">
            Reason to Report
          </DialogTitle>
          <DialogDescription className="text-[13px] text-[#64748B]">
            Tell us why you are reporting this post. Admin will be notified.
          </DialogDescription>
        </DialogHeader>

        <div className="pt-2 space-y-4">
          <Input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Enter your reason here"
            className="h-11 rounded-xl border-[#E2E8F0] bg-white text-[#1A1A2E]"
            disabled={isSubmitting}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void handleSubmit();
              }
            }}
          />

          <Button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={isSubmitting || !reason.trim()}
            className="w-full h-11 rounded-xl bg-[#1A1A2E] hover:bg-[#2A2A3E] text-white font-bold"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <FiLoader className="w-4 h-4 animate-spin" />
                Reporting…
              </span>
            ) : (
              "Report Post"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
