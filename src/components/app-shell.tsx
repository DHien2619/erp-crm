"use client";

import { useEffect, useState } from "react";
import { PanelLeft, Menu } from "lucide-react";
import { Sidebar } from "./sidebar";

export function AppShell({
  children,
  rightRail,
}: {
  children: React.ReactNode;
  rightRail?: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false); // desktop
  const [mobileOpen, setMobileOpen] = useState(false); // mobile drawer

  useEffect(() => {
    setCollapsed(localStorage.getItem("erp-sidebar-collapsed") === "1");
  }, []);

  function toggle() {
    setCollapsed((v) => {
      const next = !v;
      localStorage.setItem("erp-sidebar-collapsed", next ? "1" : "0");
      return next;
    });
  }

  return (
    <div className="min-h-screen lg:flex">
      {/* Sidebar desktop (lg+) */}
      {!collapsed && (
        <div className="hidden lg:block">
          <Sidebar onToggle={toggle} />
        </div>
      )}

      {/* Drawer mobile */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-[var(--foreground)]/40 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative z-10">
            <Sidebar
              onToggle={() => setMobileOpen(false)}
              onNavigate={() => setMobileOpen(false)}
            />
          </div>
        </div>
      )}

      <div className={`flex-1 lg:flex gap-4 p-3 lg:py-4 lg:pr-4 min-w-0 ${collapsed ? "lg:pl-4" : ""}`}>
        <main className="flex-1 card-soft p-4 lg:p-6 min-w-0 relative">
          {/* Hamburger mobile */}
          <button
            onClick={() => setMobileOpen(true)}
            aria-label="Mở menu"
            className="lg:hidden absolute left-4 top-4 z-20 w-9 h-9 rounded-xl bg-[var(--primary-soft)] text-[var(--primary)] flex items-center justify-center"
          >
            <Menu className="w-4 h-4" />
          </button>

          {/* Nút mở lại sidebar (desktop khi đã thu gọn) */}
          {collapsed && (
            <button
              onClick={toggle}
              aria-label="Mở sidebar"
              title="Mở sidebar"
              className="hidden lg:flex absolute left-4 top-4 z-20 w-9 h-9 rounded-xl bg-[var(--primary-soft)] text-[var(--primary)] items-center justify-center hover:bg-[var(--primary)] hover:text-white transition-colors"
            >
              <PanelLeft className="w-4 h-4" />
            </button>
          )}

          <div className={`pl-12 lg:pl-0 ${collapsed ? "lg:pl-14" : ""}`}>{children}</div>
        </main>
        {rightRail}
      </div>
    </div>
  );
}
