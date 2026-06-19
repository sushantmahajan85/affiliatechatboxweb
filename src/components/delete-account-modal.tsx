"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import {
  useConfirmDeleteAccountMutation,
  useRequestDeleteAccountOtpMutation,
} from "@/store/endpoints/auth";
import { logout } from "@/store/authSlice";
import { useAppDispatch } from "@/store/hooks";
import { AnimatePresence, motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  FiAlertTriangle,
  FiLoader,
  FiMail,
  FiMessageCircle,
  FiShield,
  FiTrash2,
  FiUser,
} from "react-icons/fi";
import { toast } from "sonner";

type DeleteAccountModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userEmail?: string;
};

type Step = "warning" | "otp";

const CONSEQUENCES = [
  {
    icon: FiUser,
    text: "Your public profile and member directory listing will be removed.",
  },
  {
    icon: FiMessageCircle,
    text: "All your posts and chat conversations will be permanently deleted.",
  },
  {
    icon: FiShield,
    text: "For security, a 6-digit code will be emailed before deletion.",
  },
] as const;

export function DeleteAccountModal({
  open,
  onOpenChange,
  userEmail,
}: DeleteAccountModalProps) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const [step, setStep] = useState<Step>("warning");
  const [otp, setOtp] = useState("");
  const [maskedEmail, setMaskedEmail] = useState<string | null>(null);
  const [devCode, setDevCode] = useState<string | null>(null);

  const [requestOtp, { isLoading: isSending }] = useRequestDeleteAccountOtpMutation();
  const [confirmDelete, { isLoading: isDeleting }] = useConfirmDeleteAccountMutation();

  const hasEmail = Boolean(userEmail && userEmail !== "No email");
  const displayEmail = maskedEmail || userEmail || "your email";

  useEffect(() => {
    if (!open) {
      setStep("warning");
      setOtp("");
      setMaskedEmail(null);
      setDevCode(null);
    }
  }, [open]);

  const handleSendCode = async () => {
    if (!hasEmail) {
      toast.error("Add an email address to your profile before deleting your account.");
      return;
    }
    try {
      const res = await requestOtp().unwrap();
      setMaskedEmail(res.maskedEmail || null);
      setDevCode(res._devCode || null);
      setStep("otp");
      toast.success(res.message || "Verification code sent to your email.");
      if (res._devCode) {
        toast.info(`Development code: ${res._devCode}`, { duration: 120_000 });
      }
    } catch (err: unknown) {
      const e = err as { data?: { message?: string } };
      toast.error(e?.data?.message || "Failed to send verification code.");
    }
  };

  const handleConfirmDelete = async () => {
    if (otp.length !== 6) return;
    try {
      const res = await confirmDelete({ code: otp }).unwrap();
      toast.success(res.message || "Account deleted.");
      dispatch(logout());
      onOpenChange(false);
      router.push("/login");
    } catch (err: unknown) {
      const e = err as { data?: { message?: string } };
      toast.error(e?.data?.message || "Failed to delete account.");
    }
  };

  const handleResend = async () => {
    setOtp("");
    await handleSendCode();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 overflow-hidden rounded-[24px] border border-[#E2E8F0] bg-white p-0 shadow-[0_8px_32px_rgba(0,0,0,0.08)] sm:max-w-[440px]">
        <AnimatePresence mode="wait" initial={false}>
          {step === "warning" ? (
            <motion.div
              key="warning"
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 12 }}
              transition={{ duration: 0.2 }}
            >
              <DialogHeader className="border-b border-[#F1F5F9] px-6 pb-5 pt-6 text-left">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-50 ring-1 ring-red-100">
                    <FiAlertTriangle className="h-5 w-5 text-red-600" />
                  </div>
                  <span className="rounded-full bg-[#F1F5F9] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#64748B]">
                    Step 1 of 2
                  </span>
                </div>
                <DialogTitle className="text-[18px] font-bold text-[#1A1A2E]">
                  Delete your account?
                </DialogTitle>
                <DialogDescription className="text-[13px] leading-relaxed text-[#64748B]">
                  This permanently removes your profile, posts, chat history, and
                  connections. This action cannot be undone.
                </DialogDescription>
              </DialogHeader>

              <div className="px-6 py-5">
                <div className="rounded-2xl border border-[#F1F5F9] bg-[#F8FAFC] p-4">
                  <p className="mb-3 text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
                    What will be removed
                  </p>
                  <ul className="space-y-3">
                    {CONSEQUENCES.map(({ icon: Icon, text }) => (
                      <li key={text} className="flex items-start gap-3">
                        <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)] ring-1 ring-[#E2E8F0]">
                          <Icon className="h-3.5 w-3.5 text-[#64748B]" />
                        </span>
                        <span className="text-[13px] leading-relaxed text-[#475569]">
                          {text}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                {hasEmail ? (
                  <div className="mt-4 flex items-center gap-3 rounded-xl border border-[#E0F2F7] bg-[#0A7EA4]/5 px-4 py-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white shadow-sm">
                      <FiMail className="h-4 w-4 text-[#0A7EA4]" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
                        Verification email
                      </p>
                      <p className="truncate text-[13px] font-semibold text-[#1A1A2E]">
                        {userEmail}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                    <p className="text-[13px] leading-relaxed text-amber-900">
                      Add an email address in{" "}
                      <span className="font-semibold">Account Information</span>{" "}
                      before you can delete your account.
                    </p>
                  </div>
                )}
              </div>

              <div className="flex flex-col-reverse gap-2 border-t border-[#F1F5F9] bg-[#FAFBFC] px-6 py-4 sm:flex-row">
                <button
                  type="button"
                  onClick={() => onOpenChange(false)}
                  disabled={isSending}
                  className="flex-1 rounded-xl border border-[#E2E8F0] bg-white px-4 py-3 text-sm font-bold text-[#64748B] transition hover:bg-[#F8FAFC] disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => void handleSendCode()}
                  disabled={isSending || !hasEmail}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-sm font-bold text-white shadow-[0_4px_12px_rgba(220,38,38,0.25)] transition hover:bg-red-700 disabled:opacity-50"
                >
                  {isSending ? (
                    <>
                      <FiLoader className="h-4 w-4 animate-spin" />
                      Sending code...
                    </>
                  ) : (
                    <>
                      <FiMail className="h-4 w-4" />
                      Send verification code
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="otp"
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.2 }}
            >
              <DialogHeader className="border-b border-[#F1F5F9] px-6 pb-5 pt-6 text-left">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#0A7EA4]/10">
                    <FiMail className="h-5 w-5 text-[#0A7EA4]" />
                  </div>
                  <span className="rounded-full bg-[#F1F5F9] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#64748B]">
                    Step 2 of 2
                  </span>
                </div>
                <DialogTitle className="text-[18px] font-bold text-[#1A1A2E]">
                  Enter verification code
                </DialogTitle>
                <DialogDescription className="text-[13px] leading-relaxed text-[#64748B]">
                  We sent a 6-digit code to{" "}
                  <span className="font-semibold text-[#1A1A2E]">{displayEmail}</span>.
                  Check your inbox, spam, and promotions folders, then enter the code below.
                </DialogDescription>
              </DialogHeader>

              <div className="px-6 py-5">
                {devCode && (
                  <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-amber-800">
                      Development mode
                    </p>
                    <p className="mt-1 text-[13px] text-amber-900">
                      Email may be delayed. Use this code:{" "}
                      <span className="font-mono text-base font-bold tracking-widest">
                        {devCode}
                      </span>
                    </p>
                  </div>
                )}
                <div className="flex flex-col items-center gap-4">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#64748B]">
                    One-time code
                  </label>
                  <InputOTP
                    maxLength={6}
                    value={otp}
                    onChange={setOtp}
                    disabled={isDeleting}
                    containerClassName="justify-center"
                  >
                    <InputOTPGroup className="gap-1.5 sm:gap-2">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <InputOTPSlot
                          key={i}
                          index={i}
                          className="h-12 w-10 rounded-xl border-[#E2E8F0] bg-white text-base font-bold text-[#1A1A2E] shadow-sm first:rounded-xl last:rounded-xl data-[active=true]:border-[#0A7EA4] data-[active=true]:ring-2 data-[active=true]:ring-[#0A7EA4]/20 sm:w-11"
                        />
                      ))}
                    </InputOTPGroup>
                  </InputOTP>
                  <p className="text-center text-xs text-[#94A3B8]">
                    Enter the 6-digit code from your email
                  </p>
                </div>

                <p className="mt-4 text-center text-xs text-[#94A3B8]">
                  Didn&apos;t receive it?{" "}
                  <button
                    type="button"
                    onClick={() => void handleResend()}
                    disabled={isSending || isDeleting}
                    className="font-semibold text-[#0A7EA4] transition hover:text-[#086a8a] disabled:opacity-50"
                  >
                    {isSending ? "Sending..." : "Resend code"}
                  </button>
                </p>
              </div>

              <div className="flex flex-col-reverse gap-2 border-t border-[#F1F5F9] bg-[#FAFBFC] px-6 py-4 sm:flex-row">
                <button
                  type="button"
                  onClick={() => {
                    setStep("warning");
                    setOtp("");
                  }}
                  disabled={isDeleting}
                  className="flex-1 rounded-xl border border-[#E2E8F0] bg-white px-4 py-3 text-sm font-bold text-[#64748B] transition hover:bg-[#F8FAFC] disabled:opacity-50"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => void handleConfirmDelete()}
                  disabled={isDeleting || otp.length !== 6}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-sm font-bold text-white shadow-[0_4px_12px_rgba(220,38,38,0.25)] transition hover:bg-red-700 disabled:opacity-50"
                >
                  {isDeleting ? (
                    <>
                      <FiLoader className="h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <FiTrash2 className="h-4 w-4" />
                      Delete permanently
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
