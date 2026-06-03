"use client";

import { useEffect, useRef, useState } from "react";
import { MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

export type RowAction = {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
};

export function RowActions({ actions }: { actions: RowAction[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, [open]);

  return (
    <div className="relative inline-block" ref={ref}>
      <button
        aria-label="Thao tác"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center transition-all",
          open
            ? "bg-[var(--primary-soft)] text-[var(--primary)]"
            : "text-[var(--muted)] hover:bg-[var(--primary-soft)]"
        )}
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>

      {open && (
        <div className="absolute right-0 mt-1 w-44 bg-white rounded-2xl shadow-xl border border-[var(--border)] p-1.5 z-30">
          {actions.map((a) => (
            <button
              key={a.label}
              onClick={() => {
                setOpen(false);
                a.onClick();
              }}
              className={cn(
                "w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors text-left",
                a.danger
                  ? "text-rose-500 hover:bg-rose-50"
                  : "text-[var(--foreground)] hover:bg-[var(--primary-soft)]/60"
              )}
            >
              {a.icon}
              {a.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
