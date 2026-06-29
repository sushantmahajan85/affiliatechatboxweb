"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        <div className="flex min-h-screen flex-col items-center justify-center p-12 text-center">
          <h2 className="mb-2 text-[20px] font-bold text-[#1A1A2E]">Something went wrong</h2>
          <p className="mb-6 max-w-[320px] text-[#757575]">
            An unexpected error occurred. Please refresh the page.
          </p>
          <button
            type="button"
            onClick={reset}
            className="rounded-lg bg-[#0A7EA4] px-5 py-2.5 text-sm font-semibold text-white"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
