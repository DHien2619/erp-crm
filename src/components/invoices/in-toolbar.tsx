"use client";

import { useState } from "react";
import { Search, Plus, SlidersHorizontal, X } from "lucide-react";
import { categoryLabel, type InvoiceCategory } from "@/lib/mock-data";
import { CustomSelect, type SelectOption } from "@/components/ui/select";
import { cn } from "@/lib/utils";

export type AdvFilter = {
  from: string;
  to: string;
  min: string;
  max: string;
};
export const emptyAdv: AdvFilter = { from: "", to: "", min: "", max: "" };

export type StatusFilter = "all" | "matched" | "pending" | "missing";

const statusOptions: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "Tất cả" },
  { value: "matched", label: "Đã khớp" },
  { value: "pending", label: "Chờ duyệt" },
  { value: "missing", label: "Thiếu HĐ" },
];

const categoryDot: Record<InvoiceCategory, string> = {
  saas: "#8b5cf6",
  marketing: "#ec4899",
  travel: "#3b82f6",
  office: "#f59e0b",
  fnb: "#f97316",
  logistics: "#06b6d4",
  freelancer: "#d946ef",
  other: "#64748b",
};

const categoryOptions: SelectOption[] = [
  { value: "all", label: "Mọi hạng mục" },
  ...Object.entries(categoryLabel).map(([k, label]) => ({
    value: k,
    label,
    dot: categoryDot[k as InvoiceCategory],
  })),
];

export function InvoicesInToolbar({
  query,
  onQuery,
  status,
  onStatus,
  category,
  onCategory,
  onAdd,
  adv,
  onAdv,
}: {
  query: string;
  onQuery: (v: string) => void;
  status: StatusFilter;
  onStatus: (v: StatusFilter) => void;
  category: InvoiceCategory | "all";
  onCategory: (v: InvoiceCategory | "all") => void;
  onAdd: () => void;
  adv: AdvFilter;
  onAdv: (v: AdvFilter) => void;
}) {
  const [showAdv, setShowAdv] = useState(false);
  const advActive = adv.from || adv.to || adv.min || adv.max;

  return (
    <div className="flex flex-col gap-3 mb-5">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-soft)]" />
          <input
            type="text"
            value={query}
            onChange={(e) => onQuery(e.target.value)}
            placeholder="Tìm theo NCC, số hoá đơn..."
            className="bg-white border border-[var(--border)] pl-11 pr-4 h-11 w-full rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 placeholder:text-[var(--muted-soft)]"
          />
        </div>

        <CustomSelect
          value={category}
          onChange={(v) => onCategory(v as InvoiceCategory | "all")}
          options={categoryOptions}
          className="w-44"
        />

        <button
          onClick={() => setShowAdv((v) => !v)}
          className={cn(
            "relative h-11 w-11 rounded-2xl bg-white border flex items-center justify-center transition-colors",
            showAdv || advActive
              ? "border-[var(--primary)] text-[var(--primary)]"
              : "border-[var(--border)] text-[var(--muted)] hover:text-[var(--primary)] hover:border-[var(--primary)]"
          )}
        >
          <SlidersHorizontal className="w-4 h-4" />
          {advActive ? <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[var(--accent)]" /> : null}
        </button>

        <div className="flex-1" />

        <button
          onClick={onAdd}
          className="h-11 px-5 rounded-2xl bg-[var(--primary)] text-white font-semibold text-sm flex items-center gap-2 hover:bg-[var(--primary-deep)] transition-colors shadow-md shadow-[var(--primary)]/25"
        >
          <Plus className="w-4 h-4" />
          Thêm hoá đơn
        </button>
      </div>

      <div className="bg-[var(--primary-soft)] rounded-2xl p-1 flex gap-1 text-xs font-semibold w-fit">
        {statusOptions.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onStatus(opt.value)}
            className={cn(
              "py-2 px-4 rounded-xl transition-colors",
              status === opt.value
                ? "bg-white text-[var(--primary)] shadow-sm"
                : "text-[var(--muted)] hover:text-[var(--primary-deep)]"
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {showAdv && (
        <div className="card-soft border border-[var(--border)] p-4 flex flex-wrap items-end gap-4">
          <AdvField label="Từ ngày">
            <input type="date" value={adv.from} onChange={(e) => onAdv({ ...adv, from: e.target.value })} className="erp-input h-10 w-40" />
          </AdvField>
          <AdvField label="Đến ngày">
            <input type="date" value={adv.to} onChange={(e) => onAdv({ ...adv, to: e.target.value })} className="erp-input h-10 w-40" />
          </AdvField>
          <AdvField label="Số tiền từ (₫)">
            <input type="number" value={adv.min} onChange={(e) => onAdv({ ...adv, min: e.target.value })} placeholder="0" className="erp-input h-10 w-36" />
          </AdvField>
          <AdvField label="Đến (₫)">
            <input type="number" value={adv.max} onChange={(e) => onAdv({ ...adv, max: e.target.value })} placeholder="∞" className="erp-input h-10 w-36" />
          </AdvField>
          {advActive ? (
            <button
              onClick={() => onAdv(emptyAdv)}
              className="h-10 px-4 rounded-xl border border-[var(--border)] text-sm font-semibold text-[var(--muted)] hover:bg-[var(--primary-soft)] flex items-center gap-1.5"
            >
              <X className="w-3.5 h-3.5" />
              Xoá lọc
            </button>
          ) : null}
        </div>
      )}
    </div>
  );
}

function AdvField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[11px] font-semibold text-[var(--muted)]">{label}</span>
      {children}
    </label>
  );
}
