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

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function LinkedinRecipientNotVerifiedDialog({ open, onOpenChange }: Props) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-white border border-[#E0E0E0] text-black">
        <AlertDialogHeader>
          <AlertDialogTitle>Member is not LinkedIn verified</AlertDialogTitle>
          <AlertDialogDescription>
            Messaging is only available between LinkedIn-verified members. This person has not completed LinkedIn
            verification, so you cannot chat with them here.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction className="bg-black text-white hover:bg-black/80" onClick={() => onOpenChange(false)}>OK</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
