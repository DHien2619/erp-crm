"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Pencil,
  Plus,
  CircleDollarSign,
  CheckCircle2,
  Clock,
  Wallet,
  Trash2,
} from "lucide-react";
import { Topbar } from "@/components/topbar";
import { CostDonut, type DonutSlice } from "@/components/projects/cost-donut";
import {
  ProjectModal,
  PaymentModal,
  CostModal,
} from "@/components/projects/project-modals";
import { costCategoryMeta, projectStatusMeta } from "@/lib/projects";
import { createClient } from "@/lib/supabase/client";
import { formatFullVND, cn } from "@/lib/utils";
import type { ProjectDetail } from "@/lib/data";
import type {
  ProjectCostCategory,
  ProjectPayment,
  ProjectCost,
} from "@/lib/database.types";

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

export function ProjectDetailClient({ detail }: { detail: ProjectDetail }) {
  const router = useRouter();
  const { project, payments, costs } = detail;
  const [editing, setEditing] = useState(false);
  const [addPay, setAddPay] = useState(false);
  const [addCost, setAddCost] = useState(false);
  const [editPay, setEditPay] = useState<ProjectPayment | null>(null);
  const [editCost, setEditCost] = useState<ProjectCost | null>(null);

  const value = Number(project.contract_value);
  const totalPaid = payments.reduce((s, p) => s + Number(p.amount), 0);
  const totalCost = costs.reduce((s, c) => s + Number(c.amount), 0);
  const unpaid = Math.max(0, value - totalPaid);
  const paidPct = value ? Math.round((totalPaid / value) * 100) : 0;
  const unpaidPct = value ? Math.max(0, 100 - paidPct) : 0;
  const profit = totalPaid - totalCost;
  const costPct = value ? Math.round((totalCost / value) * 100) : 0; // chi phí so với giá trị DA

  // cơ cấu chi phí theo hạng mục
  const byCategory = useMemo(() => {
    const m = new Map<ProjectCostCategory, number>();
    for (const c of costs) m.set(c.category, (m.get(c.category) ?? 0) + Number(c.amount));
    return [...m.entries()]
      .map(([cat, amount]) => ({
        cat,
        amount,
        label: costCategoryMeta[cat]?.label ?? cat,
        color: costCategoryMeta[cat]?.color ?? "#C9C5E8",
        pct: totalCost ? Math.round((amount / totalCost) * 100) : 0,
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [costs, totalCost]);

  const donut: DonutSlice[] = byCategory.map((c) => ({
    name: c.label,
    value: c.amount,
    color: c.color,
  }));

  const st = projectStatusMeta[project.status] ?? projectStatusMeta.active;

  async function removePayment(id: string) {
    if (!confirm("Xoá đợt thanh toán này?")) return;
    await createClient().from("project_payments").delete().eq("id", id);
    router.refresh();
  }
  async function removeCost(id: string) {
    if (!confirm("Xoá khoản chi phí này?")) return;
    await createClient().from("project_costs").delete().eq("id", id);
    router.refresh();
  }

  return (
    <>
      <Topbar
        title={project.name}
        subtitle={`${project.code ? project.code + " · " : ""}${project.client_name ?? "Chưa có khách hàng"}`}
        action={
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-white border border-[var(--border)] text-[var(--muted)] text-xs font-semibold hover:text-[var(--primary)] transition-colors"
          >
            <Pencil className="w-4 h-4" /> Sửa
          </button>
        }
      />

      <Link
        href="/projects"
        className="inline-flex items-center gap-1.5 text-sm text-[var(--muted)] hover:text-[var(--primary)] mb-4"
      >
        <ArrowLeft className="w-4 h-4" /> Tất cả dự án
        <span className={cn("ml-2 text-[11px] font-semibold px-2 py-0.5 rounded-lg", st.cls)}>{st.label}</span>
      </Link>

      {/* 4 card tài chính */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <FinCard icon={<CircleDollarSign className="w-4 h-4" />} label="Giá trị dự án" value={formatFullVND(value)} tone="primary" />
        <FinCard
          icon={<CheckCircle2 className="w-4 h-4" />}
          label="Đã thanh toán"
          value={formatFullVND(totalPaid)}
          sub={`${paidPct}% dự án`}
          tone="success"
        />
        <FinCard
          icon={<Clock className="w-4 h-4" />}
          label="Chưa thanh toán"
          value={formatFullVND(unpaid)}
          sub={`${unpaidPct}% còn lại`}
          tone="accent"
        />
        <FinCard
          icon={<Wallet className="w-4 h-4" />}
          label="Tổng chi phí"
          value={formatFullVND(totalCost)}
          sub={`${costPct}% giá trị · ${profit >= 0 ? "Lãi" : "Lỗ"} ${formatFullVND(Math.abs(profit))}`}
          tone="default"
        />
      </div>

      {/* Tiến độ thu tiền */}
      <div className="card-soft p-5 mb-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-bold text-[var(--foreground)] text-sm">Tiến độ thanh toán</h3>
          <span className="text-xs text-[var(--muted)]">
            {formatFullVND(totalPaid)} / {formatFullVND(value)}
          </span>
        </div>
        <div className="h-3.5 rounded-full bg-[var(--primary-soft)] overflow-hidden flex">
          <div className="h-full bg-[var(--primary)]" style={{ width: `${Math.min(100, paidPct)}%` }} />
        </div>
        <div className="flex justify-between mt-2 text-xs">
          <span className="flex items-center gap-1.5 text-[var(--muted)]">
            <span className="w-2.5 h-2.5 rounded-full bg-[var(--primary)]" /> Đã thu {paidPct}%
          </span>
          <span className="flex items-center gap-1.5 text-[var(--muted)]">
            <span className="w-2.5 h-2.5 rounded-full bg-[var(--primary-soft)] border border-[var(--border)]" />
            Còn lại {unpaidPct}%
          </span>
        </div>
      </div>

      {/* Cơ cấu chi phí: list + donut */}
      <div className="card-soft p-5 sm:p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-[var(--foreground)]">Cơ cấu chi phí theo hạng mục</h3>
          <button
            onClick={() => setAddCost(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[var(--primary)] text-white text-xs font-semibold hover:bg-[var(--primary-deep)]"
          >
            <Plus className="w-4 h-4" /> Thêm chi phí
          </button>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
          <div className="flex flex-col gap-3">
            {byCategory.length === 0 && (
              <p className="text-sm text-[var(--muted)]">Chưa có chi phí. Bấm “Thêm chi phí”.</p>
            )}
            {byCategory.map((c) => (
              <div key={c.cat}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="flex items-center gap-2 text-[var(--foreground)]">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.color }} />
                    {c.label}
                  </span>
                  <span className="tabular-nums">
                    <b>{formatFullVND(c.amount)}</b>{" "}
                    <span className="text-[var(--muted)]">· {c.pct}%</span>
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-[var(--primary-soft)] overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${c.pct}%`, backgroundColor: c.color }} />
                </div>
              </div>
            ))}
          </div>
          <CostDonut data={donut} />
        </div>
      </div>

      <div className="lg:grid lg:grid-cols-2 gap-6">
        {/* Đợt thanh toán */}
        <ListCard
          title="Các đợt thanh toán"
          onAdd={() => setAddPay(true)}
          empty={payments.length === 0 ? "Chưa ghi nhận thanh toán nào." : null}
        >
          {payments.map((p) => (
            <Row
              key={p.id}
              left={p.label || "Thanh toán"}
              date={fmtDate(p.paid_at)}
              amount={formatFullVND(Number(p.amount))}
              pct={value ? Math.round((Number(p.amount) / value) * 100) : 0}
              onEdit={() => setEditPay(p)}
              onDelete={() => removePayment(p.id)}
            />
          ))}
        </ListCard>

        {/* Chi phí chi tiết */}
        <ListCard
          title="Chi phí chi tiết"
          onAdd={() => setAddCost(true)}
          empty={costs.length === 0 ? "Chưa có chi phí nào." : null}
        >
          {costs.map((c) => (
            <Row
              key={c.id}
              left={c.name || costCategoryMeta[c.category]?.label || "Chi phí"}
              tag={costCategoryMeta[c.category]?.label}
              tagColor={costCategoryMeta[c.category]?.color}
              date={fmtDate(c.spent_at)}
              amount={formatFullVND(Number(c.amount))}
              pct={value ? Math.round((Number(c.amount) / value) * 100) : 0}
              onEdit={() => setEditCost(c)}
              onDelete={() => removeCost(c.id)}
            />
          ))}
        </ListCard>
      </div>

      {editing && (
        <ProjectModal editing={project} onClose={() => setEditing(false)} onSaved={() => setEditing(false)} />
      )}
      {addPay && <PaymentModal projectId={project.id} onClose={() => setAddPay(false)} onSaved={() => setAddPay(false)} />}
      {addCost && <CostModal projectId={project.id} onClose={() => setAddCost(false)} onSaved={() => setAddCost(false)} />}
      {editPay && (
        <PaymentModal
          projectId={project.id}
          editing={editPay}
          onClose={() => setEditPay(null)}
          onSaved={() => setEditPay(null)}
        />
      )}
      {editCost && (
        <CostModal
          projectId={project.id}
          editing={editCost}
          onClose={() => setEditCost(null)}
          onSaved={() => setEditCost(null)}
        />
      )}
    </>
  );
}

function ListCard({
  title,
  onAdd,
  empty,
  children,
}: {
  title: string;
  onAdd: () => void;
  empty: string | null;
  children: React.ReactNode;
}) {
  return (
    <div className="card-soft p-5 mb-6 lg:mb-0">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-[var(--foreground)] text-sm">{title}</h3>
        <button
          onClick={onAdd}
          className="flex items-center gap-1 text-xs font-semibold text-[var(--primary)] hover:text-[var(--primary-deep)]"
        >
          <Plus className="w-4 h-4" /> Thêm
        </button>
      </div>
      {empty ? (
        <p className="text-sm text-[var(--muted)] py-4 text-center">{empty}</p>
      ) : (
        <div className="flex flex-col divide-y divide-[var(--border)]/60">{children}</div>
      )}
    </div>
  );
}

function Row({
  left,
  tag,
  tagColor,
  date,
  amount,
  pct,
  onEdit,
  onDelete,
}: {
  left: string;
  tag?: string;
  tagColor?: string;
  date: string;
  amount: string;
  pct?: number;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-2.5 group">
      <div className="min-w-0">
        <p className="text-sm font-medium text-[var(--foreground)] truncate flex items-center gap-2">
          {tag && tagColor && (
            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: tagColor }} />
          )}
          {left}
        </p>
        <p className="text-xs text-[var(--muted)]">{date}</p>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <div className="text-right">
          <span className="text-sm font-semibold tabular-nums block">{amount}</span>
          {pct !== undefined && (
            <span className="text-[11px] font-semibold text-[var(--primary)]">{pct}% dự án</span>
          )}
        </div>
        <button
          onClick={onEdit}
          aria-label="Sửa"
          className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--muted-soft)] opacity-0 group-hover:opacity-100 hover:bg-[var(--primary-soft)] hover:text-[var(--primary)] transition"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={onDelete}
          aria-label="Xoá"
          className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--muted-soft)] opacity-0 group-hover:opacity-100 hover:bg-rose-50 hover:text-rose-500 transition"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

function FinCard({
  icon,
  label,
  value,
  sub,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  tone: "default" | "primary" | "accent" | "success";
}) {
  const styles = {
    default: "card-soft border border-[var(--border)] text-[var(--foreground)]",
    primary: "card-primary text-white",
    accent: "card-accent text-white",
    success: "bg-emerald-500 text-white rounded-[24px] shadow-[0_10px_30px_-8px_rgba(16,185,129,0.35)]",
  };
  const iconWrap = {
    default: "bg-[var(--primary-soft)] text-[var(--primary)]",
    primary: "bg-white/15 text-white",
    accent: "bg-white/20 text-white",
    success: "bg-white/20 text-white",
  };
  const labelStyle = {
    default: "text-[var(--muted)]",
    primary: "text-white/70",
    accent: "text-white/80",
    success: "text-white/85",
  };
  return (
    <div className={cn("p-4", styles[tone])}>
      <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center mb-2", iconWrap[tone])}>{icon}</div>
      <p className={cn("text-[10px] uppercase tracking-wider font-semibold", labelStyle[tone])}>{label}</p>
      <p className="text-lg font-bold mt-0.5 tabular-nums">{value}</p>
      {sub && <p className={cn("text-[11px] mt-0.5", labelStyle[tone])}>{sub}</p>}
    </div>
  );
}
