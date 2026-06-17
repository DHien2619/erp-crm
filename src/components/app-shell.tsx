"use client";

import { useEffect, useState } from "react";
import { Menu } from "lucide-react";
import { Sidebar } from "./sidebar";
import { QuickActions } from "@/components/ui/quick-actions";
import { AddInvoiceModal } from "@/components/invoices/add-invoice-modal";
import { RevenueModal } from "@/components/customers/revenue-modal";
import { onQuickModal, type QuickModal } from "@/lib/ui-events";

export function AppShell({
  children,
  rightRail,
}: {
  children: React.ReactNode;
  rightRail?: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [quick, setQuick] = useState<QuickModal | null>(null);

  useEffect(() => onQuickModal(setQuick), []);

  return (
    <div className="min-h-screen lg:flex">
      {/* Sidebar desktop — rail thu gọn, hover sẽ kéo dãn (overlay, không đẩy nội dung) */}
      <div className="hidden lg:block relative w-[102px] shrink-0">
        <div className="absolute inset-y-3 left-3 z-40">
          <Sidebar />
        </div>
      </div>

      {/* Drawer mobile */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-[var(--foreground)]/50"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative z-10 p-3 h-full">
            <Sidebar expanded onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex-1 lg:flex gap-4 p-3 lg:py-4 lg:pr-4 lg:pl-0 min-w-0">
        <main className="flex-1 card-soft p-4 lg:p-6 min-w-0 relative">
          {/* Hamburger mobile */}
          <button
            onClick={() => setMobileOpen(true)}
            aria-label="Mở menu"
            className="lg:hidden absolute left-4 top-4 z-20 w-9 h-9 rounded-xl bg-[var(--primary-soft)] text-[var(--primary)] flex items-center justify-center"
          >
            <Menu className="w-4 h-4" />
          </button>

          <div className="pl-12 lg:pl-0">{children}</div>
        </main>
        {rightRail}
      </div>

      <QuickActions />

      {quick === "invoice" && (
        <AddInvoiceModal open onClose={() => setQuick(null)} />
      )}
      {quick === "revenue" && (
        <RevenueModal onClose={() => setQuick(null)} onSaved={() => setQuick(null)} />
      )}
    </div>
  );
}
