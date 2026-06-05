"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Settings, LogOut } from "lucide-react";

export function UserMenu() {
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
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Tài khoản"
        className="w-11 h-11 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--primary-deep)] flex items-center justify-center text-white text-sm font-bold shadow-md shrink-0 hover:ring-2 hover:ring-[var(--primary)]/30 transition-all"
      >
        DH
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-60 bg-white rounded-2xl shadow-xl border border-[var(--border)] p-2 z-40">
          <div className="px-3 py-2 border-b border-[var(--border)] mb-1">
            <p className="text-sm font-bold text-[var(--foreground)]">Duc Hien</p>
            <p className="text-[11px] text-[var(--muted)]">hien.ld.1109@gmail.com</p>
          </div>
          <Link
            href="/settings"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium text-[var(--foreground)] hover:bg-[var(--primary-soft)]/60 transition-colors"
          >
            <Settings className="w-4 h-4" />
            Cài đặt
          </Link>
          <button
            disabled
            title="Cần bật đăng nhập (Auth) trước"
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium text-[var(--muted-soft)] cursor-not-allowed"
          >
            <LogOut className="w-4 h-4" />
            Đăng xuất
            <span className="ml-auto text-[10px] bg-[var(--primary-soft)] text-[var(--primary)] px-2 py-0.5 rounded-full">
              sắp có
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
