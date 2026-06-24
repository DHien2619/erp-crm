"use client";

import { useState } from "react";
import { MessageSquare, CalendarDays, Sparkles, Loader2, FileText, Bot } from "lucide-react";
import { Topbar } from "@/components/topbar";
import { cn } from "@/lib/utils";
import type { ActivityLog } from "@/lib/database.types";

export function ActivityClient({ logs }: { logs: ActivityLog[] }) {
  const [report, setReport] = useState<string | null>(null);
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
    try {
      const r = await fetch("/api/agent/report", { method: "POST" });
      const data = await r.json();
      setReport(data.content || "Không tạo được báo cáo.");
    } catch (e) {
      setReport("Lỗi: " + (e as Error).message);
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

      {report && (
        <div className="card-soft p-5 sm:p-6 mb-6 border-l-4 border-[var(--primary)]">
          <div className="flex items-center gap-2 mb-3">
            <FileText className="w-4 h-4 text-[var(--primary)]" />
            <h3 className="font-bold text-[var(--foreground)]">Báo cáo tổng hợp (AI)</h3>
          </div>
          <p className="text-sm text-[var(--foreground)] whitespace-pre-wrap leading-relaxed">{report}</p>
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
