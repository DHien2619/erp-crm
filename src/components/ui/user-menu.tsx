"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Settings, LogOut, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useCurrentUser } from "@/components/role-provider";
import { roleLabel } from "@/lib/roles";

function initials(name: string) {
  const p = name.trim().split(/\s+/).filter(Boolean);
  if (p.length === 0) return "?";
  if (p.length === 1) return p[0].slice(0, 2).toUpperCase();
  return (p[0][0] + p[p.length - 1][0]).toUpperCase();
}

export function UserMenu() {
  const router = useRouter();
  const current = useCurrentUser();
  const user = current ? { name: current.fullName, email: current.email, role: current.role } : null;
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, [open]);

  async function logout() {
    setLoggingOut(true);
    await createClient().auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  const name = user?.name ?? "...";

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Tài khoản"
        className="w-11 h-11 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--primary-deep)] flex items-center justify-center text-white text-sm font-bold shadow-md shrink-0 hover:ring-2 hover:ring-[var(--primary)]/30 transition-all"
      >
        {initials(name)}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-60 bg-white rounded-2xl shadow-xl border border-[var(--border)] p-2 z-40">
          <div className="px-3 py-2 border-b border-[var(--border)] mb-1">
            <p className="text-sm font-bold text-[var(--foreground)] truncate">{name}</p>
            <p className="text-[11px] text-[var(--muted)] truncate">{user?.email}</p>
            {user && (
              <span className="inline-block mt-1.5 text-[10px] font-semibold bg-[var(--primary-soft)] text-[var(--primary)] px-2 py-0.5 rounded-full">
                {roleLabel[user.role] ?? user.role}
              </span>
            )}
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
            onClick={logout}
            disabled={loggingOut}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-60"
          >
            {loggingOut ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
            Đăng xuất
          </button>
        </div>
      )}
    </div>
  );
}
