"use client";

import {
  Home,
  FileText,
  BarChart3,
  Gauge,
  TrendingUp,
  Users,
  Building2,
  Wallet,
  LayoutGrid,
  Target,
  Landmark,
  FolderKanban,
  Settings,
  LogOut,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navItems = [
  { icon: Home, label: "Dashboard", href: "/" },
  { icon: FileText, label: "Hoá đơn", href: "/invoices/in" },
  { icon: Users, label: "Khách hàng", href: "/customers" },
  { icon: FolderKanban, label: "Dự án", href: "/projects" },
  { icon: Building2, label: "Nhà cung cấp", href: "/suppliers" },
  { icon: Wallet, label: "Công nợ", href: "/debts" },
  { icon: BarChart3, label: "Báo cáo", href: "/reports" },
  { icon: Gauge, label: "KPI nâng cao", href: "/kpi" },
  { icon: Landmark, label: "Thuế", href: "/tax" },
  { icon: TrendingUp, label: "Dự báo", href: "/forecast" },
  { icon: Target, label: "Chiến lược", href: "/strategy" },
  { icon: LayoutGrid, label: "Nghiệp vụ", href: "/modules" },
  { icon: Settings, label: "Cài đặt", href: "/settings" },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname.startsWith(href.split("/").slice(0, 3).join("/"));
}

export function Sidebar({
  onNavigate,
  expanded = false,
}: {
  onNavigate?: () => void;
  expanded?: boolean;
}) {
  const pathname = usePathname();

  const label = (text: string) =>
    cn(
      "whitespace-nowrap text-sm font-medium transition-opacity duration-150",
      expanded ? "opacity-100" : "opacity-0 group-hover/sb:opacity-100"
    );

  return (
    <aside
      className={cn(
        "group/sb card-primary rounded-[28px] h-full flex flex-col py-6 px-3.5 overflow-hidden transition-[width] duration-200 ease-out shadow-xl",
        expanded ? "w-[228px]" : "w-[78px] hover:w-[228px]"
      )}
    >
      {/* Brand */}
      <div className="flex items-center gap-3 h-11 px-2 mb-4 shrink-0">
        <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center text-white font-extrabold shrink-0">
          E
        </div>
        <span className={cn(label(""), "font-bold text-white text-base")}>
          ERP-CRM
        </span>
      </div>

      <nav className="flex flex-col gap-1.5 flex-1">
        {navItems.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 h-11 rounded-2xl px-2.5 transition-colors",
                active
                  ? "bg-white text-[var(--primary)] shadow-md"
                  : "text-white/70 hover:text-white hover:bg-white/10"
              )}
            >
              <item.icon className="w-5 h-5 shrink-0" strokeWidth={2} />
              <span className={label(item.label)}>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <button
        title="Đăng xuất"
        className="flex items-center gap-3 h-11 rounded-2xl px-2.5 text-white/70 hover:text-white hover:bg-white/10 transition-colors shrink-0"
      >
        <LogOut className="w-5 h-5 shrink-0" strokeWidth={2} />
        <span className={label("Đăng xuất")}>Đăng xuất</span>
      </button>
    </aside>
  );
}
