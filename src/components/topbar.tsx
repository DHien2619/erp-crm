"use client";

import { GlobalSearch } from "@/components/ui/global-search";
import { NotificationsBell } from "@/components/ui/notifications-bell";

export function Topbar({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-center justify-between mb-6 gap-3">
      <div className="min-w-0">
        {subtitle && (
          <p className="text-sm text-[var(--muted)] font-medium">{subtitle}</p>
        )}
        <h1 className="text-xl sm:text-2xl font-bold text-[var(--foreground)] tracking-tight">
          {title}
        </h1>
      </div>
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <span className="hidden md:block">
          <GlobalSearch />
        </span>
        {action}
        <NotificationsBell />
        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--primary-deep)] flex items-center justify-center text-white text-sm font-bold shadow-md shrink-0">
          DH
        </div>
      </div>
    </header>
  );
}
