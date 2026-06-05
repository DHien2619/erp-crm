"use client";

import { GlobalSearch } from "@/components/ui/global-search";
import { NotificationsBell } from "@/components/ui/notifications-bell";
import { UserMenu } from "@/components/ui/user-menu";

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
        <UserMenu />
      </div>
    </header>
  );
}
