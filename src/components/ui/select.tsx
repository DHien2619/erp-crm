"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export type SelectOption = {
  value: string;
  label: string;
  /** màu chấm tròn bên trái (tuỳ chọn) */
  dot?: string;
};

export function CustomSelect({
  value,
  onChange,
  options,
  className,
  menuClassName,
}: {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  className?: string;
  menuClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = options.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className={cn("relative", className)} ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "w-full flex items-center justify-between gap-2 bg-white border h-11 pl-4 pr-3 rounded-2xl text-sm font-medium text-[var(--foreground)] transition-colors",
          open
            ? "border-[var(--primary)] ring-2 ring-[var(--primary)]/30"
            : "border-[var(--border)] hover:border-[var(--primary)]/50"
        )}
      >
        <span className="flex items-center gap-2 min-w-0">
          {current?.dot && (
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: current.dot }}
            />
          )}
          <span className="truncate">{current?.label ?? "Chọn..."}</span>
        </span>
        <ChevronDown
          className={cn(
            "w-4 h-4 text-[var(--muted-soft)] shrink-0 transition-transform",
            open && "rotate-180"
          )}
        />
      </button>

      {open && (
        <div
          className={cn(
            "absolute left-0 mt-2 min-w-full w-max max-w-[280px] bg-white rounded-2xl shadow-xl border border-[var(--border)] p-1.5 z-30 max-h-72 overflow-y-auto",
            menuClassName
          )}
        >
          {options.map((o) => {
            const active = o.value === value;
            return (
              <button
                key={o.value}
                type="button"
                onClick={() => {
                  onChange(o.value);
                  setOpen(false);
                }}
                className={cn(
                  "w-full flex items-center justify-between gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors text-left",
                  active
                    ? "bg-[var(--primary-soft)] text-[var(--primary)]"
                    : "text-[var(--foreground)] hover:bg-[var(--primary-soft)]/50"
                )}
              >
                <span className="flex items-center gap-2 min-w-0">
                  {o.dot && (
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: o.dot }}
                    />
                  )}
                  <span className="truncate">{o.label}</span>
                </span>
                {active && <Check className="w-4 h-4 shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
