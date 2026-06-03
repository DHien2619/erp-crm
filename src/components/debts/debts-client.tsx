"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowDownLeft, ArrowUpRight, CheckCheck, Scale } from "lucide-react";
import { Topbar } from "@/components/topbar";
import { RowActions } from "@/components/ui/row-actions";
import { createClient } from "@/lib/supabase/client";
import type { Receivable, Payable } from "@/lib/database.types";
import { cn, formatVND } from "@/lib/utils";

type Tab = "ar" | "ap";

function daysOverdue(due: string | null): number | null {
  if (!due) return null;
  const d = new Date(due);
  const diff = Math.floor((Date.now() - d.getTime()) / 86400000);
  return diff > 0 ? diff : null;
}

export function DebtsClient({
  receivables,
  payables,
}: {
  receivables: Receivable[];
  payables: Payable[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("ar");

  const arTotal = receivables.reduce((s, r) => s + Number(r.outstanding), 0);
  const apTotal = payables.reduce((s, r) => s + Number(r.outstanding), 0);
  const net = arTotal - apTotal;

  async function settleAR(name: string) {
    if (!confirm(`Đánh dấu đã thu đủ toàn bộ công nợ của "${name}"?`)) return;
    const supabase = createClient();
    const { data } = await supabase
      .from("invoices_out")
      .select("id, amount")
      .eq("company_name", name);
    for (const row of data ?? []) {
      await supabase
        .from("invoices_out")
        .update({ paid_amount: row.amount, status: "matched" })
        .eq("id", row.id);
    }
    router.refresh();
  }

  async function settleAP(name: string) {
    if (!confirm(`Đánh dấu đã trả đủ toàn bộ công nợ cho "${name}"?`)) return;
    const supabase = createClient();
    const { data } = await supabase
      .from("invoices_in")
      .select("id, amount")
      .eq("supplier_name", name);
    for (const row of data ?? []) {
      await supabase
        .from("invoices_in")
        .update({ paid_amount: row.amount })
        .eq("id", row.id);
    }
    router.refresh();
  }

  return (
    <>
      <Topbar title="Công nợ" subtitle="Phải thu khách hàng & phải trả nhà cung cấp" />

      <div className="grid grid-cols-3 gap-4 mb-6">
        <MiniStat tone="primary" icon={<ArrowDownLeft className="w-5 h-5" />} label="Phải thu (AR)" value={formatVND(arTotal)} hint={`${receivables.length} khách còn nợ`} />
        <MiniStat tone="accent" icon={<ArrowUpRight className="w-5 h-5" />} label="Phải trả (AP)" value={formatVND(apTotal)} hint={`${payables.length} NCC còn nợ`} />
        <MiniStat tone={net >= 0 ? "success" : "default"} icon={<Scale className="w-5 h-5" />} label="Công nợ ròng" value={formatVND(Math.abs(net))} hint={net >= 0 ? "nghiêng phải thu" : "nghiêng phải trả"} />
      </div>

      <div className="bg-[var(--primary-soft)] rounded-2xl p-1 flex gap-1 text-xs font-semibold w-fit mb-5">
        <TabBtn active={tab === "ar"} onClick={() => setTab("ar")}>Phải thu ({receivables.length})</TabBtn>
        <TabBtn active={tab === "ap"} onClick={() => setTab("ap")}>Phải trả ({payables.length})</TabBtn>
      </div>

      <div className="card-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[var(--primary-soft)]/50 text-[var(--muted)] text-[11px] uppercase tracking-wider font-semibold">
                <th className="text-left py-3.5 pl-6 pr-3">{tab === "ar" ? "Khách hàng" : "Nhà cung cấp"}</th>
                <th className="text-center py-3.5 px-3">Số HĐ</th>
                <th className="text-right py-3.5 px-3">Tổng</th>
                <th className="text-right py-3.5 px-3">Đã {tab === "ar" ? "thu" : "trả"}</th>
                <th className="text-right py-3.5 px-3 whitespace-nowrap">Còn lại</th>
                {tab === "ar" && <th className="text-center py-3.5 px-3 whitespace-nowrap">Quá hạn</th>}
                <th className="w-12 py-3.5 pr-4"></th>
              </tr>
            </thead>
            <tbody>
              {tab === "ar" &&
                receivables.map((r) => {
                  const od = daysOverdue(r.last_due);
                  return (
                    <tr key={r.company_name} className="border-t border-[var(--border)] hover:bg-[var(--primary-soft)]/30 transition-colors">
                      <td className="py-3 pl-6 pr-3 font-semibold text-[var(--foreground)]">{r.company_name}</td>
                      <td className="py-3 px-3 text-center text-[var(--muted)]">{r.invoice_count}</td>
                      <td className="py-3 px-3 text-right text-[var(--muted)]">{formatVND(Number(r.total))}</td>
                      <td className="py-3 px-3 text-right text-emerald-600">{formatVND(Number(r.paid))}</td>
                      <td className="py-3 px-3 text-right font-bold text-rose-500">{formatVND(Number(r.outstanding))}</td>
                      <td className="py-3 px-3 text-center">
                        {od ? <span className="text-[11px] font-semibold px-2 py-1 rounded-full bg-rose-50 text-rose-600">{od} ngày</span> : <span className="text-[var(--muted-soft)]">—</span>}
                      </td>
                      <td className="py-3 pr-4">
                        <RowActions actions={[{ label: "Đánh dấu đã thu đủ", icon: <CheckCheck className="w-4 h-4" />, onClick: () => settleAR(r.company_name) }]} />
                      </td>
                    </tr>
                  );
                })}
              {tab === "ap" &&
                payables.map((r) => (
                  <tr key={r.supplier_name} className="border-t border-[var(--border)] hover:bg-[var(--primary-soft)]/30 transition-colors">
                    <td className="py-3 pl-6 pr-3 font-semibold text-[var(--foreground)] max-w-[320px] truncate">{r.supplier_name}</td>
                    <td className="py-3 px-3 text-center text-[var(--muted)]">{r.invoice_count}</td>
                    <td className="py-3 px-3 text-right text-[var(--muted)]">{formatVND(Number(r.total))}</td>
                    <td className="py-3 px-3 text-right text-emerald-600">{formatVND(Number(r.paid))}</td>
                    <td className="py-3 px-3 text-right font-bold text-rose-500">{formatVND(Number(r.outstanding))}</td>
                    <td className="py-3 pr-4">
                      <RowActions actions={[{ label: "Đánh dấu đã trả đủ", icon: <CheckCheck className="w-4 h-4" />, onClick: () => settleAP(r.supplier_name) }]} />
                    </td>
                  </tr>
                ))}
              {((tab === "ar" && receivables.length === 0) || (tab === "ap" && payables.length === 0)) && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[var(--muted)]">Không có công nợ {tab === "ar" ? "phải thu" : "phải trả"}. 🎉</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className={cn("py-2 px-4 rounded-xl transition-colors", active ? "bg-white text-[var(--primary)] shadow-sm" : "text-[var(--muted)] hover:text-[var(--primary-deep)]")}>
      {children}
    </button>
  );
}

function MiniStat({ icon, label, value, hint, tone }: { icon: React.ReactNode; label: string; value: string; hint: string; tone: "primary" | "default" | "accent" | "success" }) {
  const styles = {
    primary: "card-primary text-white",
    default: "card-soft border border-[var(--border)]",
    accent: "card-accent text-white",
    success: "bg-emerald-500 text-white rounded-[24px] shadow-[0_10px_30px_-8px_rgba(16,185,129,0.35)]",
  };
  const iconWrap = { primary: "bg-white/15 text-white", default: "bg-[var(--primary-soft)] text-[var(--primary)]", accent: "bg-white/20 text-white", success: "bg-white/20 text-white" };
  const labelStyle = { primary: "text-white/70", default: "text-[var(--muted)]", accent: "text-white/80", success: "text-white/85" };
  const hintStyle = { primary: "text-white/60", default: "text-[var(--muted-soft)]", accent: "text-white/75", success: "text-white/80" };
  return (
    <div className={`p-5 flex items-center gap-4 ${styles[tone]}`}>
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${iconWrap[tone]}`}>{icon}</div>
      <div className="min-w-0">
        <p className={`text-[11px] uppercase tracking-wider font-semibold ${labelStyle[tone]}`}>{label}</p>
        <p className="text-2xl font-bold mt-0.5">{value}</p>
        <p className={`text-[11px] mt-0.5 ${hintStyle[tone]}`}>{hint}</p>
      </div>
    </div>
  );
}
