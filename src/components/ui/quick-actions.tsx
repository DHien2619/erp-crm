"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  X,
  FileText,
  Receipt,
  RefreshCw,
  BarChart3,
  Target,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { openQuickModal } from "@/lib/ui-events";

export function QuickActions() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [synced, setSynced] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, [open]);

  async function sync() {
    setSyncing(true);
    setSynced(false);
    try {
      const r = await fetch("/api/lark/sync", { method: "POST" });
      if (r.ok) {
        setSynced(true);
        router.refresh();
        setTimeout(() => setSynced(false), 2500);
      }
    } finally {
      setSyncing(false);
    }
  }

  // run() thực thi NGAY (mở form / điều hướng), không bắt bấm 2 lần
  const actions = [
    { label: "Thêm hoá đơn", icon: FileText, tone: "violet", run: () => openQuickModal("invoice") },
    { label: "Ghi doanh thu", icon: Receipt, tone: "violet", run: () => openQuickModal("revenue") },
    { label: "Báo cáo Gap", icon: BarChart3, tone: "violet", run: () => router.push("/reports") },
    { label: "Đề xuất chiến lược", icon: Target, tone: "violet", run: () => router.push("/strategy") },
  ];

  return (
    <div ref={ref} className="fixed bottom-5 right-5 z-40 flex flex-col items-end gap-3">
      {open && (
        <div className="flex flex-col items-end gap-2 mb-1">
          {actions.map((a) => (
            <button
              key={a.label}
              onClick={() => {
                setOpen(false);
                a.run();
              }}
              className="flex items-center gap-2.5 bg-white rounded-full shadow-lg border border-[var(--border)] pl-4 pr-3 py-2.5 text-sm font-semibold text-[var(--foreground)] hover:bg-[var(--primary-soft)]/60 transition-colors"
            >
              {a.label}
              <span className="w-8 h-8 rounded-full bg-[var(--primary-soft)] text-[var(--primary)] flex items-center justify-center">
                <a.icon className="w-4 h-4" />
              </span>
            </button>
          ))}
          <button
            onClick={sync}
            disabled={syncing}
            className="flex items-center gap-2.5 bg-white rounded-full shadow-lg border border-[var(--border)] pl-4 pr-3 py-2.5 text-sm font-semibold text-[var(--foreground)] hover:bg-[var(--primary-soft)]/60 transition-colors disabled:opacity-60"
          >
            {synced ? "Đã đồng bộ!" : syncing ? "Đang đồng bộ..." : "Đồng bộ Lark"}
            <span className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
              {synced ? <Check className="w-4 h-4" /> : <RefreshCw className={cn("w-4 h-4", syncing && "animate-spin")} />}
            </span>
          </button>
        </div>
      )}

      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Thao tác nhanh"
        className={cn(
          "w-14 h-14 rounded-full shadow-xl flex items-center justify-center text-white transition-all",
          open
            ? "bg-[var(--primary-deep)] rotate-45"
            : "bg-gradient-to-br from-[var(--primary)] to-[var(--primary-deep)] hover:scale-105"
        )}
      >
        {open ? <X className="w-6 h-6 -rotate-45" /> : <Plus className="w-6 h-6" />}
      </button>
    </div>
  );
}
