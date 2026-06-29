"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center p-12 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#F5F7FB]">
        <span className="text-[24px]">⚠️</span>
      </div>
      <h2 className="mb-2 text-[20px] font-bold text-[#1A1A2E]">Something went wrong</h2>
      <p className="mb-6 max-w-[320px] text-[#757575]">
        We could not load this page. Please try again.
      </p>
      <button
        type="button"
        onClick={reset}
        className="rounded-lg bg-[#0A7EA4] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#086688]"
      >
        Try again
      </button>
    </div>
  );
}
