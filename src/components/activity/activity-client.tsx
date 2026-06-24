"use client";

import { useState } from "react";
import {
  MessageSquare, CalendarDays, Sparkles, Loader2, FileText, Bot,
  TrendingUp, Wallet, PiggyBank, AlertTriangle, Users, FolderKanban, Lightbulb, Target,
} from "lucide-react";
import { Topbar } from "@/components/topbar";
import { cn, formatFullVND } from "@/lib/utils";
import type { ActivityLog } from "@/lib/database.types";

type Report = {
  role: string;
  finance: { revenue: number; expense: number; net: number; gap: number } | null;
  overdue: { total: number; count: number };
  topCustomers: { name: string; amount: number }[];
  projects: { name: string; profit: number; paidPct: number }[];
  activity: { total: number; today: number; week: number };
  insights: string[];
  recommendations: string[];
};

export function ActivityClient({ logs }: { logs: ActivityLog[] }) {
  const [report, setReport] = useState<Report | null>(null);
  const [reportErr, setReportErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const today = logs.filter((l) => l.created_at?.slice(0, 10) === todayStr).length;
  const week = logs.filter((l) => {
    const d = new Date(l.created_at);
    return now.getTime() - d.getTime() < 7 * 86400000;
  }).length;

  async function makeReport() {
    setLoading(true);
    setReport(null);
    setReportErr(null);
    try {
      const r = await fetch("/api/agent/report", { method: "POST" });
      const data = await r.json();
      if (data.type === "report") setReport(data as Report);
      else setReportErr(data.content || "Không tạo được báo cáo.");
    } catch (e) {
      setReportErr("Lỗi: " + (e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  function fmt(iso: string) {
    const d = new Date(iso);
    return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  }

  return (
    <>
      <Topbar
        title="Nhật ký & Báo cáo AI"
        subtitle="Mọi lần hỏi Trợ lý AI đều được lưu lại"
        action={
          <button
            onClick={makeReport}
            disabled={loading}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-[var(--primary)] text-white text-xs font-semibold hover:bg-[var(--primary-deep)] shadow-sm disabled:opacity-60"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {loading ? "Đang tổng hợp..." : "Tạo báo cáo tổng hợp"}
          </button>
        }
      />

      <div className="grid grid-cols-3 gap-3 mb-6">
        <Stat icon={<MessageSquare className="w-4 h-4" />} label="Tổng lượt hỏi" value={String(logs.length)} tone="primary" />
        <Stat icon={<CalendarDays className="w-4 h-4" />} label="Hôm nay" value={String(today)} tone="default" />
        <Stat icon={<CalendarDays className="w-4 h-4" />} label="7 ngày qua" value={String(week)} tone="default" />
      </div>

      {reportErr && (
        <div className="card-soft p-4 mb-6 text-sm text-[var(--muted)]">{reportErr}</div>
      )}

      {report && (
        <div className="card-soft overflow-hidden mb-6 border border-[var(--border)]">
          {/* Header */}
          <div className="bg-gradient-to-r from-[var(--primary)] to-[var(--primary-deep)] text-white px-5 py-4 flex items-center gap-2.5">
            <FileText className="w-5 h-5" />
            <div>
              <h3 className="font-bold leading-tight">Báo cáo tổng hợp</h3>
              <p className="text-[11px] text-white/80">Tự sinh từ số liệu thật · AI phân tích</p>
            </div>
          </div>

          <div className="p-5 sm:p-6 space-y-5">
            {/* Tài chính (chỉ admin/kế toán) */}
            {report.finance ? (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <Mini icon={<TrendingUp className="w-4 h-4" />} label="Doanh thu" value={formatFullVND(report.finance.revenue)} />
                <Mini icon={<Wallet className="w-4 h-4" />} label="Chi phí" value={formatFullVND(report.finance.expense)} />
                <Mini icon={<PiggyBank className="w-4 h-4" />} label="LN ròng (ước tính)" value={formatFullVND(report.finance.net)} good />
                <Mini icon={<AlertTriangle className="w-4 h-4" />} label="Gap hoá đơn" value={formatFullVND(report.finance.gap)} warn />
              </div>
            ) : (
              <p className="text-xs text-[var(--muted)] italic">
                * Số liệu tài chính được ẩn với vai trò hiện tại (chỉ admin/kế toán mới thấy).
              </p>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Công nợ + hoạt động */}
              <Block icon={<AlertTriangle className="w-4 h-4" />} title="Công nợ quá hạn">
                <p className="text-sm">
                  <b className="text-rose-500">{formatFullVND(report.overdue.total)}</b>{" "}
                  <span className="text-[var(--muted)]">· {report.overdue.count} khoản</span>
                </p>
              </Block>
              <Block icon={<MessageSquare className="w-4 h-4" />} title="Hoạt động AI">
                <p className="text-sm text-[var(--muted)]">
                  Tổng <b className="text-[var(--foreground)]">{report.activity.total}</b> lượt · hôm nay {report.activity.today} · 7 ngày {report.activity.week}
                </p>
              </Block>

              {/* Top khách hàng */}
              <Block icon={<Users className="w-4 h-4" />} title="Top khách hàng">
                {report.topCustomers.length === 0 ? (
                  <p className="text-sm text-[var(--muted)]">—</p>
                ) : (
                  <ul className="text-sm space-y-1">
                    {report.topCustomers.map((c) => (
                      <li key={c.name} className="flex justify-between gap-2">
                        <span className="truncate">{c.name}</span>
                        <b className="tabular-nums shrink-0">{formatFullVND(c.amount)}</b>
                      </li>
                    ))}
                  </ul>
                )}
              </Block>

              {/* Dự án */}
              <Block icon={<FolderKanban className="w-4 h-4" />} title="Dự án">
                {report.projects.length === 0 ? (
                  <p className="text-sm text-[var(--muted)]">—</p>
                ) : (
                  <ul className="text-sm space-y-1">
                    {report.projects.map((p) => (
                      <li key={p.name} className="flex justify-between gap-2">
                        <span className="truncate">{p.name} <span className="text-[var(--muted)]">· thu {p.paidPct}%</span></span>
                        <b className={cn("tabular-nums shrink-0", p.profit >= 0 ? "text-emerald-600" : "text-rose-500")}>
                          {p.profit >= 0 ? "Lãi " : "Lỗ "}{formatFullVND(Math.abs(p.profit))}
                        </b>
                      </li>
                    ))}
                  </ul>
                )}
              </Block>
            </div>

            {/* Nhận định */}
            {report.insights.length > 0 && (
              <Block icon={<Lightbulb className="w-4 h-4" />} title="Nhận định nổi bật">
                <ul className="space-y-1.5">
                  {report.insights.map((s, i) => (
                    <li key={i} className="text-sm flex gap-2">
                      <span className="text-[var(--primary)] mt-1.5 w-1.5 h-1.5 rounded-full bg-[var(--primary)] shrink-0" />
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </Block>
            )}

            {/* Khuyến nghị */}
            {report.recommendations.length > 0 && (
              <div className="rounded-2xl bg-emerald-50/60 border border-emerald-200 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-4 h-4 text-emerald-600" />
                  <h4 className="font-bold text-emerald-800 text-sm">Khuyến nghị cho quản lý</h4>
                </div>
                <ul className="space-y-1.5">
                  {report.recommendations.map((s, i) => (
                    <li key={i} className="text-sm text-emerald-900 flex gap-2">
                      <span className="text-emerald-600 shrink-0">✓</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="card-soft p-5 sm:p-6">
        <h3 className="font-bold text-[var(--foreground)] mb-4">Nhật ký hỏi đáp</h3>
        {logs.length === 0 ? (
          <p className="text-sm text-[var(--muted)] py-6 text-center">
            Chưa có hoạt động. Bấm nút 🤖 góc phải để hỏi Trợ lý AI — mỗi lần hỏi sẽ được lưu vào đây.
          </p>
        ) : (
          <div className="flex flex-col divide-y divide-[var(--border)]/60">
            {logs.map((l) => (
              <div key={l.id} className="py-3">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-xs text-[var(--muted)]">
                    {l.user_email ?? "Ẩn danh"} · {fmt(l.created_at)}
                  </span>
                  {l.tools && l.tools.length > 0 && (
                    <span className="text-[10px] text-[var(--muted-soft)] truncate max-w-[40%]">
                      {l.tools.join(", ")}
                    </span>
                  )}
                </div>
                <p className="text-sm font-medium text-[var(--foreground)]">{l.question}</p>
                <p className="text-sm text-[var(--muted)] mt-0.5 flex items-start gap-1.5">
                  <Bot className="w-3.5 h-3.5 mt-0.5 shrink-0 text-[var(--primary)]" />
                  <span className="line-clamp-3">{l.answer}</span>
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

function Mini({ icon, label, value, good, warn }: { icon: React.ReactNode; label: string; value: string; good?: boolean; warn?: boolean }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] p-3">
      <div className="flex items-center gap-1.5 text-[var(--muted)] mb-1">
        <span className={cn("w-6 h-6 rounded-lg flex items-center justify-center", good ? "bg-emerald-50 text-emerald-600" : warn ? "bg-amber-50 text-amber-600" : "bg-[var(--primary-soft)] text-[var(--primary)]")}>
          {icon}
        </span>
        <span className="text-[10px] uppercase tracking-wider font-semibold">{label}</span>
      </div>
      <p className={cn("text-base font-bold tabular-nums", good && "text-emerald-600", warn && "text-amber-600")}>{value}</p>
    </div>
  );
}

function Block({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <span className="w-6 h-6 rounded-lg bg-[var(--primary-soft)] text-[var(--primary)] flex items-center justify-center">{icon}</span>
        <h4 className="font-semibold text-[var(--foreground)] text-sm">{title}</h4>
      </div>
      {children}
    </div>
  );
}

function Stat({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: string; tone: "default" | "primary" }) {
  const styles = {
    default: "card-soft border border-[var(--border)] text-[var(--foreground)]",
    primary: "card-primary text-white",
  };
  const iconWrap = { default: "bg-[var(--primary-soft)] text-[var(--primary)]", primary: "bg-white/15 text-white" };
  const labelStyle = { default: "text-[var(--muted)]", primary: "text-white/70" };
  return (
    <div className={cn("p-4", styles[tone])}>
      <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center mb-2", iconWrap[tone])}>{icon}</div>
      <p className={cn("text-[10px] uppercase tracking-wider font-semibold", labelStyle[tone])}>{label}</p>
      <p className="text-xl font-bold mt-0.5">{value}</p>
    </div>
  );
}
