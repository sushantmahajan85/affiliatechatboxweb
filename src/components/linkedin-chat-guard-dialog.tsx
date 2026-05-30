"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { LinkedinChatBlockReason } from "@/lib/linkedin-messaging";
import { useRouter } from "next/navigation";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reason?: LinkedinChatBlockReason | null;
};

export function LinkedinChatGuardDialog({
  open,
  onOpenChange,
  reason = "recipient_not_verified",
}: Props) {
  const router = useRouter();
  const isSender = reason === "sender_not_verified";

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-white border border-[#E0E0E0] text-black">
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isSender ? "LinkedIn verification required" : "Member is not LinkedIn verified"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isSender
              ? "Messaging is only available for LinkedIn-verified members. Complete LinkedIn verification on your profile to send and receive messages."
              : "Messaging is only available between LinkedIn-verified members. This person has not completed LinkedIn verification, so you cannot chat with them here."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className={isSender ? "flex-col sm:flex-row gap-2" : undefined}>
          {isSender && (
            <AlertDialogAction
              className="bg-[#0A7EA4] text-white hover:bg-[#086a8a]"
              onClick={() => {
                onOpenChange(false);
                router.push("/profile");
              }}
            >
              Go to profile
            </AlertDialogAction>
          )}
          <AlertDialogAction
            className="bg-black text-white hover:bg-black/80"
            onClick={() => onOpenChange(false)}
          >
            OK
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/** @deprecated Use LinkedinChatGuardDialog with reason="recipient_not_verified" */
export function LinkedinRecipientNotVerifiedDialog({
  open,
  onOpenChange,
}: Omit<Props, "reason">) {
  return (
    <LinkedinChatGuardDialog
      open={open}
      onOpenChange={onOpenChange}
      reason="recipient_not_verified"
    />
  );
}
