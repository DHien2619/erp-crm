"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { logError } from "@/lib/log";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logError(error, { where: "route-error", digest: error.digest });
  }, [error]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6">
      <div className="card-soft p-8 max-w-md text-center">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-7 h-7" />
        </div>
        <h2 className="text-lg font-bold text-[var(--foreground)] mb-1">Đã có lỗi xảy ra</h2>
        <p className="text-sm text-[var(--muted)] mb-5">
          Trang gặp sự cố nhưng dữ liệu của bạn vẫn an toàn. Thử tải lại phần này.
        </p>
        {error.digest && (
          <p className="text-[11px] text-[var(--muted-soft)] mb-4 font-mono">Mã lỗi: {error.digest}</p>
        )}
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 px-5 h-11 rounded-2xl bg-[var(--primary)] text-white text-sm font-semibold hover:bg-[var(--primary-deep)] transition-colors"
        >
          <RotateCcw className="w-4 h-4" /> Thử lại
        </button>
      </div>
    </div>
  );
}
