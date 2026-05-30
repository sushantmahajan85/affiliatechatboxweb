"use client";

import { useCallback, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { openAuthModal } from "@/store/uiSlice";
import {
  getLinkedinChatBlockReason,
  isSelfChatPartner,
  type LinkedinChatBlockReason,
} from "@/lib/linkedin-messaging";
import { toast } from "sonner";

export function useLinkedinChatGuard() {
  const dispatch = useAppDispatch();
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const [guardOpen, setGuardOpen] = useState(false);
  const [guardReason, setGuardReason] = useState<LinkedinChatBlockReason | null>(null);

  const assertCanChat = useCallback(
    (
      partnerId: string,
      recipientLinkedinVerified?: boolean,
      recipientIsAdmin?: boolean
    ): boolean => {
      if (!isAuthenticated || !user) {
        dispatch(openAuthModal());
        return false;
      }

      if (isSelfChatPartner(user._id, partnerId)) {
        toast.error("You cannot chat with yourself");
        return false;
      }

      const reason = getLinkedinChatBlockReason(
        user.isLinkedinVerified,
        recipientLinkedinVerified,
        user.role === "admin",
        recipientIsAdmin
      );

      if (reason) {
        setGuardReason(reason);
        setGuardOpen(true);
        return false;
      }

      return true;
    },
    [dispatch, isAuthenticated, user]
  );

  return {
    assertCanChat,
    guardOpen,
    guardReason,
    setGuardOpen,
    user,
    isAuthenticated,
  };
}
