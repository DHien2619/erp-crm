"use client";

import { useState } from "react";
import Link from "next/link";
import {
  FolderKanban,
  Wallet,
  CircleDollarSign,
  TrendingUp,
  Plus,
} from "lucide-react";
import { Topbar } from "@/components/topbar";
import { ProjectModal } from "@/components/projects/project-modals";
import { projectStatusMeta } from "@/lib/projects";
import { formatFullVND, cn } from "@/lib/utils";
import type { ProjectWithStats } from "@/lib/data";

export function ProjectsClient({ projects }: { projects: ProjectWithStats[] }) {
  const [adding, setAdding] = useState(false);

  const totalValue = projects.reduce((s, p) => s + Number(p.contract_value), 0);
  const totalPaid = projects.reduce((s, p) => s + p.totalPaid, 0);
  const totalCost = projects.reduce((s, p) => s + p.totalCost, 0);

  return (
    <>
      <Topbar
        title="Dự án"
        subtitle={`${projects.length} dự án · tổng giá trị ${formatFullVND(totalValue)}`}
        action={
          <button
            onClick={() => setAdding(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-[var(--primary)] text-white text-xs font-semibold hover:bg-[var(--primary-deep)] transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Thêm dự án
          </button>
        }
      />

      {/* Tổng quan */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <Stat icon={<FolderKanban className="w-4 h-4" />} label="Số dự án" value={String(projects.length)} tone="primary" />
        <Stat icon={<CircleDollarSign className="w-4 h-4" />} label="Tổng giá trị" value={formatFullVND(totalValue)} tone="default" />
        <Stat icon={<Wallet className="w-4 h-4" />} label="Đã thu" value={formatFullVND(totalPaid)} tone="default" />
        <Stat icon={<TrendingUp className="w-4 h-4" />} label="Tổng chi phí" value={formatFullVND(totalCost)} tone="accent" />
      </div>

      {projects.length === 0 ? (
        <div className="card-soft p-10 text-center">
          <p className="text-[var(--muted)] mb-4">
            Chưa có dự án nào. Hãy chạy migration <code className="text-xs">migration_projects.sql</code> trong
            Supabase rồi bấm “Thêm dự án”.
          </p>
          <button
            onClick={() => setAdding(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-[var(--primary)] text-white text-sm font-semibold"
          >
            <Plus className="w-4 h-4" /> Thêm dự án
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((p) => {
            const value = Number(p.contract_value);
            const paidPct = value ? Math.round((p.totalPaid / value) * 100) : 0;
            const profit = p.totalPaid - p.totalCost;
            const st = projectStatusMeta[p.status] ?? projectStatusMeta.active;
            return (
              <Link
                key={p.id}
                href={`/projects/${p.id}`}
                className="card-soft p-5 hover:shadow-lg transition-shadow group"
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-wider text-[var(--muted)] font-semibold">
                      {p.code || "—"}
                    </p>
                    <h3 className="font-bold text-[var(--foreground)] leading-snug group-hover:text-[var(--primary)] transition-colors line-clamp-2">
                      {p.name}
                    </h3>
                    {p.client_name && (
                      <p className="text-xs text-[var(--muted)] mt-0.5 truncate">{p.client_name}</p>
                    )}
                  </div>
                  <span className={cn("text-[11px] font-semibold px-2 py-1 rounded-lg shrink-0", st.cls)}>
                    {st.label}
                  </span>
                </div>

                <p className="text-xl font-bold text-[var(--foreground)] tabular-nums">
                  {formatFullVND(value)}
                </p>

                {/* progress thu tiền */}
                <div className="mt-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-[var(--muted)]">Đã thu</span>
                    <span className="font-semibold text-[var(--primary)]">{paidPct}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-[var(--primary-soft)] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[var(--primary)]"
                      style={{ width: `${Math.min(100, paidPct)}%` }}
                    />
                  </div>
                </div>

                <div className="flex justify-between mt-3 text-xs">
                  <span className="text-[var(--muted)]">
                    Chi phí: <b className="text-[var(--foreground)]">{formatFullVND(p.totalCost)}</b>
                  </span>
                  <span className={cn("font-semibold", profit >= 0 ? "text-emerald-600" : "text-rose-500")}>
                    {profit >= 0 ? "Lãi" : "Lỗ"} {formatFullVND(Math.abs(profit))}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {adding && <ProjectModal onClose={() => setAdding(false)} onSaved={() => setAdding(false)} />}
    </>
  );
}

function Stat({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone: "default" | "primary" | "accent";
}) {
  const styles = {
    default: "card-soft border border-[var(--border)] text-[var(--foreground)]",
    primary: "card-primary text-white",
    accent: "card-accent text-white",
  };
  const iconWrap = {
    default: "bg-[var(--primary-soft)] text-[var(--primary)]",
    primary: "bg-white/15 text-white",
    accent: "bg-white/20 text-white",
  };
  const labelStyle = {
    default: "text-[var(--muted)]",
    primary: "text-white/70",
    accent: "text-white/80",
  };
  return (
    <div className={cn("p-4", styles[tone])}>
      <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center mb-2", iconWrap[tone])}>
        {icon}
      </div>
      <p className={cn("text-[10px] uppercase tracking-wider font-semibold", labelStyle[tone])}>{label}</p>
      <p className="text-lg font-bold mt-0.5 tabular-nums">{value}</p>
    </div>
  );
}
