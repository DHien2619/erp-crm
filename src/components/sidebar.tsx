"use client";

import {
  Bell,
  Home,
  FileText,
  BarChart3,
  TrendingUp,
  Users,
  Building2,
  Wallet,
  LayoutGrid,
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
  { icon: Building2, label: "Nhà cung cấp", href: "/suppliers" },
  { icon: Wallet, label: "Công nợ", href: "/debts" },
  { icon: BarChart3, label: "Báo cáo", href: "/reports" },
  { icon: TrendingUp, label: "Dự báo", href: "/forecast" },
  { icon: LayoutGrid, label: "Nghiệp vụ", href: "/modules" },
  { icon: Settings, label: "Cài đặt", href: "/settings" },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname.startsWith(href.split("/").slice(0, 3).join("/"));
}

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="card-primary flex flex-col items-center py-6 w-[78px] mx-3 my-3 rounded-[28px] shrink-0">
      <div className="flex flex-col gap-3 flex-1">
        {navItems.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              className={cn(
                "w-11 h-11 rounded-2xl flex items-center justify-center transition-all",
                active
                  ? "bg-white text-[var(--primary)] shadow-md"
                  : "text-white/70 hover:text-white hover:bg-white/10"
              )}
            >
              <item.icon className="w-5 h-5" strokeWidth={2} />
            </Link>
          );
        })}
      </div>
      <button
        title="Đăng xuất"
        className="w-11 h-11 rounded-2xl flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-all"
      >
        <LogOut className="w-5 h-5" strokeWidth={2} />
      </button>
    </aside>
  );
}
