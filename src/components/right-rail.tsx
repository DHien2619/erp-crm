"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight, Calendar } from "lucide-react";
import { type RecentInvoice } from "@/lib/mock-data";
import { getUpcomingTaxDeadlines } from "@/lib/tax-calendar";
import { formatVND, cn } from "@/lib/utils";

const statusStyles = {
  matched: "bg-emerald-50 text-emerald-600",
  pending: "bg-amber-50 text-amber-600",
  missing: "bg-rose-50 text-rose-600",
};
const statusLabel = { matched: "Đã khớp", pending: "Chờ", missing: "Thiếu HĐ" };

export function RightRail({
  recentIn,
  recentOut,
}: {
  recentIn: RecentInvoice[];
  recentOut: RecentInvoice[];
}) {
  const [tab, setTab] = useState<"in" | "out">("in");
  const list = tab === "in" ? recentIn : recentOut;
  const deadlines = getUpcomingTaxDeadlines(new Date(), 3);

  return (
    <aside className="card-soft py-6 px-5 flex flex-col gap-5 w-full lg:w-[300px] mt-4 lg:mt-0 shrink-0">
      <div>
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-bold text-[var(--foreground)]">Hoá đơn gần đây</h3>
          <Link
            href={tab === "in" ? "/invoices/in" : "/customers"}
            className="text-xs text-[var(--primary)] font-semibold hover:underline"
          >
            Xem tất cả
          </Link>
        </div>
        <p className="text-[11px] text-[var(--muted)] mb-3">5 giao dịch mới nhất</p>

        <div className="bg-[var(--primary-soft)] rounded-2xl p-1 flex gap-1 mb-4 text-xs font-semibold">
          <button
            onClick={() => setTab("in")}
            className={cn(
              "flex-1 py-2 px-3 rounded-xl transition-colors",
              tab === "in" ? "bg-white text-[var(--primary)] shadow-sm" : "text-[var(--muted)]"
            )}
          >
            Đầu vào
          </button>
          <button
            onClick={() => setTab("out")}
            className={cn(
              "flex-1 py-2 px-3 rounded-xl transition-colors",
              tab === "out" ? "bg-white text-[var(--primary)] shadow-sm" : "text-[var(--muted)]"
            )}
          >
            Đầu ra
          </button>
        </div>

        <ul className="flex flex-col gap-3">
          {list.map((inv) => (
            <li key={inv.id} className="flex items-center gap-3 group cursor-pointer">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--primary-deep)] flex items-center justify-center text-white text-xs font-bold shrink-0">
                {inv.initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[var(--foreground)] truncate">{inv.supplier}</p>
                <p className="text-[11px] text-[var(--muted)]">{formatVND(inv.amount)} · {inv.date}</p>
              </div>
              <span className={cn("text-[10px] font-semibold px-2 py-1 rounded-full whitespace-nowrap", statusStyles[inv.status])}>
                {statusLabel[inv.status]}
              </span>
            </li>
          ))}
          {list.length === 0 && (
            <li className="text-xs text-[var(--muted)] text-center py-4">Chưa có giao dịch.</li>
          )}
        </ul>
      </div>

      <div className="border-t border-[var(--border)] pt-5">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[var(--primary)]" />
            <h3 className="font-bold text-[var(--foreground)]">Lịch thuế</h3>
          </div>
          <Link href="/reports" className="text-xs text-[var(--primary)] font-semibold hover:underline">
            Mở
          </Link>
        </div>

        <ul className="flex flex-col gap-2 mt-3">
          {deadlines.map((d) => (
            <li
              key={d.label}
              className={cn(
                "flex items-center gap-3 p-3 rounded-2xl",
                d.urgent ? "bg-rose-50 border border-rose-100" : "bg-[var(--primary-soft)]"
              )}
            >
              <div
                className={cn(
                  "w-10 h-10 rounded-xl flex flex-col items-center justify-center text-[10px] font-bold leading-tight shrink-0",
                  d.urgent ? "bg-rose-500 text-white" : "bg-white text-[var(--primary)]"
                )}
              >
                <span>{d.date.split("/")[0]}</span>
                <span className="text-[8px] font-medium opacity-80">T{d.date.split("/")[1]}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-[var(--foreground)] truncate">{d.label}</p>
                <p className={cn("text-[10px] font-medium", d.urgent ? "text-rose-600" : "text-[var(--muted)]")}>
                  Còn {d.daysLeft} ngày
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-[var(--muted-soft)]" />
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
