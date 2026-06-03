"use client";

import { Pencil, Trash2, CheckCircle2 } from "lucide-react";
import {
  categoryLabel,
  type InvoiceIn,
} from "@/lib/mock-data";
import { RowActions } from "@/components/ui/row-actions";
import { cn, formatVND } from "@/lib/utils";

const statusStyles = {
  matched: "bg-emerald-50 text-emerald-600 border-emerald-200",
  pending: "bg-amber-50 text-amber-600 border-amber-200",
  missing: "bg-rose-50 text-rose-600 border-rose-200",
};

const statusLabel = {
  matched: "Đã khớp",
  pending: "Chờ duyệt",
  missing: "Thiếu HĐ",
};

const categoryColor: Record<string, string> = {
  saas: "bg-violet-50 text-violet-600",
  marketing: "bg-pink-50 text-pink-600",
  travel: "bg-blue-50 text-blue-600",
  office: "bg-amber-50 text-amber-600",
  fnb: "bg-orange-50 text-orange-600",
  logistics: "bg-cyan-50 text-cyan-600",
  freelancer: "bg-fuchsia-50 text-fuchsia-600",
  other: "bg-slate-50 text-slate-600",
};

function formatDate(iso: string) {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, "0")}/${String(
    d.getMonth() + 1
  ).padStart(2, "0")}/${d.getFullYear()}`;
}

export function InvoicesInTable({
  rows,
  onEdit,
  onDelete,
  onToggleStatus,
  page = 1,
  totalPages = 1,
  total,
  onPage,
}: {
  rows: InvoiceIn[];
  onEdit: (r: InvoiceIn) => void;
  onDelete: (r: InvoiceIn) => void;
  onToggleStatus: (r: InvoiceIn) => void;
  page?: number;
  totalPages?: number;
  total?: number;
  onPage?: (p: number) => void;
}) {
  if (rows.length === 0) {
    return (
      <div className="card-soft p-16 text-center">
        <p className="text-[var(--muted)] font-medium">
          Không tìm thấy hoá đơn phù hợp
        </p>
        <p className="text-xs text-[var(--muted-soft)] mt-1">
          Thử bỏ bớt bộ lọc
        </p>
      </div>
    );
  }

  return (
    <div className="card-soft overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[var(--primary-soft)]/50 text-[var(--muted)] text-[11px] uppercase tracking-wider font-semibold">
              <th className="text-left py-3.5 pl-6 pr-3">Nhà cung cấp</th>
              <th className="text-left py-3.5 px-3">Số HĐ</th>
              <th className="text-left py-3.5 px-3">Ngày</th>
              <th className="text-left py-3.5 px-3 whitespace-nowrap">Hạng mục</th>
              <th className="text-right py-3.5 px-3">Giá trị</th>
              <th className="text-right py-3.5 px-3">VAT</th>
              <th className="text-center py-3.5 px-3 whitespace-nowrap">
                Trạng thái
              </th>
              <th className="w-12 py-3.5 pr-4"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr
                key={r.id}
                className="border-t border-[var(--border)] hover:bg-[var(--primary-soft)]/30 transition-colors group"
              >
                <td className="py-3 pl-6 pr-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--primary-deep)] flex items-center justify-center text-white text-[11px] font-bold shrink-0">
                      {r.initials}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-[var(--foreground)] truncate">
                        {r.supplier}
                      </p>
                      {r.note && (
                        <p className="text-[11px] text-[var(--muted-soft)] truncate">
                          {r.note}
                        </p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="py-3 px-3 font-mono text-xs text-[var(--muted)]">
                  #{r.code}
                </td>
                <td className="py-3 px-3 text-[var(--muted)]">
                  {formatDate(r.date)}
                </td>
                <td className="py-3 px-3">
                  <span
                    className={cn(
                      "inline-block text-[11px] font-semibold px-2.5 py-1 rounded-full whitespace-nowrap",
                      categoryColor[r.category]
                    )}
                  >
                    {categoryLabel[r.category]}
                  </span>
                </td>
                <td className="py-3 px-3 text-right font-semibold text-[var(--foreground)]">
                  {formatVND(r.amount)}
                </td>
                <td className="py-3 px-3 text-right text-[var(--muted)]">
                  {r.vatRate}%
                </td>
                <td className="py-3 px-3 text-center">
                  <span
                    className={cn(
                      "inline-block text-[11px] font-semibold px-2.5 py-1 rounded-full border whitespace-nowrap",
                      statusStyles[r.status]
                    )}
                  >
                    {statusLabel[r.status]}
                  </span>
                </td>
                <td className="py-3 pr-4">
                  <RowActions
                    actions={[
                      {
                        label: r.status === "matched" ? "Đánh dấu thiếu HĐ" : "Đánh dấu đã có HĐ",
                        icon: <CheckCircle2 className="w-4 h-4" />,
                        onClick: () => onToggleStatus(r),
                      },
                      { label: "Sửa", icon: <Pencil className="w-4 h-4" />, onClick: () => onEdit(r) },
                      { label: "Xoá", icon: <Trash2 className="w-4 h-4" />, danger: true, onClick: () => onDelete(r) },
                    ]}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between px-6 py-4 border-t border-[var(--border)] text-xs text-[var(--muted)]">
        <span>
          Hiện <b className="text-[var(--foreground)]">{rows.length}</b>
          {typeof total === "number" ? ` / ${total}` : ""} hoá đơn
        </span>
        <div className="flex items-center gap-1">
          <button
            disabled={page <= 1}
            onClick={() => onPage?.(page - 1)}
            className="px-3 py-1.5 rounded-lg hover:bg-[var(--primary-soft)] font-medium disabled:opacity-40 disabled:hover:bg-transparent"
          >
            ← Trước
          </button>
          <span className="px-3 py-1.5 font-semibold text-[var(--primary)]">
            {page} / {totalPages}
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => onPage?.(page + 1)}
            className="px-3 py-1.5 rounded-lg hover:bg-[var(--primary-soft)] font-medium disabled:opacity-40 disabled:hover:bg-transparent"
          >
            Sau →
          </button>
        </div>
      </div>
    </div>
  );
}
