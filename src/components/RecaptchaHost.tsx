"use client";

import { RECAPTCHA_CONTAINER_ID } from "@/lib/firebase";

/** Stable DOM mount for Firebase Phone Auth invisible reCAPTCHA (must exist before RecaptchaVerifier). */
export function RecaptchaHost() {
  return (
    <div
      id={RECAPTCHA_CONTAINER_ID}
      aria-hidden="true"
      suppressHydrationWarning
      style={{
        position: "fixed",
        left: -9999,
        top: 0,
        width: 1,
        height: 1,
        overflow: "hidden",
        pointerEvents: "none",
      }}
    />
  );
}
