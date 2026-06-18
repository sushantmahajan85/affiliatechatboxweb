"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { WALKTHROUGH_STEPS } from "@/lib/app-walkthrough";
import { markWalkthroughCompleted } from "@/lib/walkthrough-preference";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { closeWalkthrough } from "@/store/uiSlice";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, ChevronLeft, Sparkles } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 48 : -48,
    opacity: 0,
    scale: 0.96,
  }),
  center: {
    x: 0,
    opacity: 1,
    scale: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -48 : 48,
    opacity: 0,
    scale: 0.96,
  }),
};

export function AppWalkthrough() {
  const dispatch = useAppDispatch();
  const isOpen = useAppSelector((state) => state.ui.isWalkthroughOpen);
  const userId = useAppSelector((state) => state.auth.userId);
  const [stepIndex, setStepIndex] = useState(0);
  const [direction, setDirection] = useState(1);

  const totalSteps = WALKTHROUGH_STEPS.length;
  const step = WALKTHROUGH_STEPS[stepIndex];
  const isLastStep = stepIndex === totalSteps - 1;
  const progress = ((stepIndex + 1) / totalSteps) * 100;

  useEffect(() => {
    if (isOpen) {
      setStepIndex(0);
      setDirection(1);
    }
  }, [isOpen]);

  const handleClose = useCallback(() => {
    markWalkthroughCompleted(userId);
    dispatch(closeWalkthrough());
    setStepIndex(0);
    setDirection(1);
  }, [dispatch, userId]);

  const handleSkip = () => {
    handleClose();
  };

  const handleNext = () => {
    if (isLastStep) {
      handleClose();
      return;
    }
    setDirection(1);
    setStepIndex((prev) => prev + 1);
  };

  const handleBack = () => {
    if (stepIndex === 0) return;
    setDirection(-1);
    setStepIndex((prev) => prev - 1);
  };

  const Icon = step.icon;
  const isBrandHero = step.heroVariant === "brand";

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) handleClose();
      }}
    >
      <DialogContent
        className="max-h-[min(92vh,720px)] w-[calc(100vw-1.5rem)] max-w-[520px] gap-0 overflow-hidden rounded-[28px] border-none p-0 shadow-2xl sm:rounded-[32px] [&>button]:hidden"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <div className="relative flex flex-col">
          <div className="absolute inset-x-0 top-0 z-10 h-1 bg-[#E8ECF0]">
            <motion.div
              className="h-full bg-gradient-to-r from-[#0A7EA4] to-[#7B61FF]"
              initial={false}
              animate={{ width: `${progress}%` }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            />
          </div>

          <button
            type="button"
            onClick={handleSkip}
            className={`absolute right-4 top-4 z-20 rounded-full border px-3.5 py-1.5 text-[13px] font-bold transition-colors ${
              isBrandHero
                ? "border-white/30 bg-white/15 text-white backdrop-blur-sm hover:bg-white/25"
                : "border-[#E0E0E0] bg-white/90 text-[#757575] shadow-sm hover:border-[#0A7EA4]/30 hover:text-[#1A1A2E]"
            }`}
          >
            Skip tour
          </button>

          <div
            className={`relative overflow-hidden bg-gradient-to-br ${step.gradient} px-6 pb-8 pt-12 sm:px-8 sm:pt-14`}
          >
            <div
              className={`pointer-events-none absolute inset-0 ${
                isBrandHero
                  ? "bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.18),transparent_55%)]"
                  : "bg-[radial-gradient(ellipse_at_top_right,rgba(10,126,164,0.08),transparent_60%)]"
              }`}
            />
            <motion.div
              className={`pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full blur-3xl ${step.glowColor}`}
              animate={{ scale: [1, 1.12, 1], opacity: [0.5, 0.75, 0.5] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              className={`pointer-events-none absolute -bottom-8 -left-8 h-28 w-28 rounded-full blur-2xl ${step.glowColor}`}
              animate={{ scale: [1, 1.18, 1] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
            />

            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={step.id}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ type: "spring", stiffness: 380, damping: 32 }}
                className="relative flex flex-col items-center text-center"
              >
                <motion.div
                  className={`mb-5 flex h-[88px] w-[88px] items-center justify-center rounded-[28px] shadow-lg sm:h-[96px] sm:w-[96px] ${
                    isBrandHero
                      ? `${step.iconBg} shadow-black/10 ring-2 ring-white/40`
                      : `${step.iconBg} shadow-[#0A7EA4]/12 ring-1 ring-[#E0E0E0]/80`
                  }`}
                  initial={{ rotate: -8, scale: 0.8 }}
                  animate={{ rotate: 0, scale: 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                >
                  <Icon className={`h-10 w-10 sm:h-11 sm:w-11 ${step.iconColor}`} strokeWidth={1.85} />
                </motion.div>

                <DialogTitle
                  className={`text-[22px] font-black tracking-tight sm:text-[26px] ${
                    isBrandHero ? "text-white drop-shadow-sm" : "text-[#1A1A2E]"
                  }`}
                >
                  {step.title}
                </DialogTitle>
              </motion.div>
            </AnimatePresence>

            <p
              className={`mt-4 text-center text-[12px] font-black uppercase tracking-[0.2em] ${
                isBrandHero ? "text-white/85" : "text-[#0A7EA4]"
              }`}
            >
              Step {stepIndex + 1} of {totalSteps}
            </p>
          </div>

          <div className="flex flex-1 flex-col bg-white px-6 py-6 sm:px-8 sm:py-7">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={`${step.id}-body`}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ type: "spring", stiffness: 380, damping: 32 }}
                className="flex flex-1 flex-col"
              >
                <DialogDescription className="text-center text-[15px] font-medium leading-relaxed text-[#475569] sm:text-[16px]">
                  {step.description}
                </DialogDescription>

                {step.tip && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="mt-5 flex items-start gap-3 rounded-2xl border border-[#E0E0E0] bg-[#F0F2F5] px-4 py-3.5"
                  >
                    <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[#0A7EA4]" />
                    <p className="text-left text-[13px] font-medium leading-relaxed text-[#1A1A2E]/80 sm:text-[14px]">
                      {step.tip}
                    </p>
                  </motion.div>
                )}
              </motion.div>
            </AnimatePresence>

            <div className="mt-6 flex items-center justify-center gap-1.5">
              {WALKTHROUGH_STEPS.map((s, i) => (
                <motion.button
                  key={s.id}
                  type="button"
                  aria-label={`Go to step ${i + 1}`}
                  onClick={() => {
                    setDirection(i > stepIndex ? 1 : -1);
                    setStepIndex(i);
                  }}
                  className="rounded-full p-1"
                  whileTap={{ scale: 0.9 }}
                >
                  <span
                    className={`block h-2 rounded-full transition-all duration-300 ${
                      i === stepIndex
                        ? "w-6 bg-[#0A7EA4]"
                        : i < stepIndex
                          ? "w-2 bg-[#0A7EA4]/40"
                          : "w-2 bg-[#E2E8F0]"
                    }`}
                  />
                </motion.button>
              ))}
            </div>

            <div className="mt-6 flex gap-3">
              {stepIndex > 0 && (
                <motion.button
                  type="button"
                  onClick={handleBack}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex h-12 flex-1 items-center justify-center gap-1.5 rounded-2xl border-2 border-[#E2E8F0] text-[15px] font-bold text-[#64748B] transition-colors hover:border-[#0A7EA4]/30 hover:bg-[#F8FAFC] hover:text-[#1A1A2E] sm:h-[52px]"
                  whileTap={{ scale: 0.98 }}
                >
                  <ChevronLeft className="h-5 w-5" />
                  Back
                </motion.button>
              )}

              <motion.button
                type="button"
                onClick={handleNext}
                className={`flex h-12 items-center justify-center gap-2 rounded-2xl text-[15px] font-black text-white transition-colors sm:h-[52px] ${
                  stepIndex > 0 ? "flex-1" : "w-full"
                } ${
                  isLastStep
                    ? "bg-[#0A7EA4] hover:bg-[#086d8c]"
                    : "bg-[#1A1A2E] hover:bg-[#2A2A3E]"
                }`}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
              >
                {isLastStep ? (
                  <>
                    Get Started
                    <Sparkles className="h-5 w-5" />
                  </>
                ) : (
                  <>
                    Next
                    <ArrowRight className="h-5 w-5" />
                  </>
                )}
              </motion.button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
