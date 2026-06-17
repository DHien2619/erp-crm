"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, AlertCircle, FileWarning, CalendarClock } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getUpcomingTaxDeadlines } from "@/lib/tax-calendar";
import { formatVND, cn } from "@/lib/utils";

type Alert = {
  icon: React.ReactNode;
  title: string;
  desc: string;
  href: string;
  tone: "rose" | "amber" | "violet";
};

export function NotificationsBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const list: Alert[] = [];

      const { data: ar } = await supabase.from("receivables").select("*");
      const arOut = (ar ?? []).reduce((s, r) => s + Number(r.outstanding), 0);
      if (arOut > 0) {
        list.push({
          icon: <AlertCircle className="w-4 h-4" />,
          title: "Công nợ phải thu",
          desc: `${ar!.length} khách còn nợ ${formatVND(arOut)}`,
          href: "/debts",
          tone: "rose",
        });
      }

      const { data: missing } = await supabase
        .from("invoices_in")
        .select("amount")
        .eq("status", "missing");
      if (missing && missing.length > 0) {
        const sum = missing.reduce((s, m) => s + Number(m.amount), 0);
        list.push({
          icon: <FileWarning className="w-4 h-4" />,
          title: "Hoá đơn còn thiếu",
          desc: `${missing.length} HĐ chưa có chứng từ · ${formatVND(sum)}`,
          href: "/invoices/in",
          tone: "amber",
        });
      }

      const tax = getUpcomingTaxDeadlines(new Date(), 1)[0];
      if (tax) {
        list.push({
          icon: <CalendarClock className="w-4 h-4" />,
          title: tax.label,
          desc: `Hạn ${tax.date} · còn ${tax.daysLeft} ngày`,
          href: "/reports",
          tone: "violet",
        });
      }

      setAlerts(list);
    })();
  }, []);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, [open]);

  const toneCls = {
    rose: "bg-rose-50 text-rose-500",
    amber: "bg-amber-50 text-amber-500",
    violet: "bg-[var(--primary-soft)] text-[var(--primary)]",
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Thông báo"
        className="relative w-11 h-11 rounded-2xl bg-white border border-[var(--border)] flex items-center justify-center text-[var(--muted)] hover:text-[var(--primary)] transition-colors"
      >
        <Bell className="w-5 h-5" />
        {alerts.length > 0 && (
          <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-[var(--accent)] ring-2 ring-white" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-[var(--border)] p-2 z-40">
          <div className="px-3 py-2 flex items-center justify-between">
            <span className="font-bold text-sm text-[var(--foreground)]">Thông báo</span>
            <span className="text-[11px] text-[var(--muted)]">{alerts.length} mục cần chú ý</span>
          </div>
          {alerts.length === 0 && (
            <p className="text-sm text-[var(--muted)] text-center py-6">Không có cảnh báo. 🎉</p>
          )}
          {alerts.map((a, i) => (
            <button
              key={i}
              onClick={() => {
                setOpen(false);
                router.push(a.href);
              }}
              className="w-full flex items-start gap-3 px-3 py-2.5 rounded-xl hover:bg-[var(--primary-soft)]/50 transition-colors text-left"
            >
              <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0", toneCls[a.tone])}>
                {a.icon}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[var(--foreground)]">{a.title}</p>
                <p className="text-[11px] text-[var(--muted)]">{a.desc}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
