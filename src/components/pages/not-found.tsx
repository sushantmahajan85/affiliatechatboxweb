"use client";
export function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center min-h-[400px]">
      <div className="w-16 h-16 bg-[#F5F7FB] rounded-full flex items-center justify-center mb-4">
        <span className="text-[24px]">🔍</span>
      </div>
      <h3 className="text-[20px] font-bold text-[#1A1A2E] mb-2">Page not found</h3>
      <p className="text-[#757575] max-w-[300px]">
        The page you are looking for doesn't exist or has been moved.
      </p>
    </div>
  );
}

