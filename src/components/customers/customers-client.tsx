"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Pencil,
  Trash2,
  Users,
  TrendingUp,
  AlertCircle,
  Loader2,
  Receipt,
} from "lucide-react";
import { Topbar } from "@/components/topbar";
import { Modal } from "@/components/ui/modal";
import { RowActions } from "@/components/ui/row-actions";
import { RevenueModal } from "@/components/customers/revenue-modal";
import { createClient } from "@/lib/supabase/client";
import type { CompanyWithStats } from "@/lib/data";
import { formatVND } from "@/lib/utils";

type Draft = {
  id?: string;
  name: string;
  tax_code: string;
  phone: string;
  email: string;
  address: string;
  payment_terms: string;
  note: string;
};

const empty: Draft = {
  name: "",
  tax_code: "",
  phone: "",
  email: "",
  address: "",
  payment_terms: "",
  note: "",
};

export function CustomersClient({ rows }: { rows: CompanyWithStats[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Draft>(empty);
  const [revenue, setRevenue] = useState<{ company?: string } | null>(null);

  const totalRevenue = rows.reduce((s, r) => s + r.revenue, 0);
  const totalOutstanding = rows.reduce((s, r) => s + r.outstanding, 0);

  function openAdd() {
    setDraft(empty);
    setOpen(true);
  }
  function openEdit(c: CompanyWithStats) {
    setDraft({
      id: c.id,
      name: c.name ?? "",
      tax_code: c.tax_code ?? "",
      phone: c.phone ?? "",
      email: c.email ?? "",
      address: c.address ?? "",
      payment_terms: c.payment_terms ?? "",
      note: c.note ?? "",
    });
    setOpen(true);
  }
  async function remove(c: CompanyWithStats) {
    if (!confirm(`Xoá khách hàng "${c.name}"?`)) return;
    const supabase = createClient();
    await supabase.from("companies").delete().eq("id", c.id);
    router.refresh();
  }

  return (
    <>
      <Topbar
        title="Khách hàng"
        subtitle="Quản lý khách hàng & công nợ phải thu"
        action={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setRevenue({})}
              className="h-11 px-4 rounded-2xl bg-white border border-[var(--border)] text-[var(--primary)] font-semibold text-sm flex items-center gap-2 hover:border-[var(--primary)] transition-colors"
            >
              <Receipt className="w-4 h-4" />
              Ghi doanh thu
            </button>
            <button
              onClick={openAdd}
              className="h-11 px-5 rounded-2xl bg-[var(--primary)] text-white font-semibold text-sm flex items-center gap-2 hover:bg-[var(--primary-deep)] transition-colors shadow-md shadow-[var(--primary)]/25"
            >
              <Plus className="w-4 h-4" />
              Thêm khách hàng
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-3 gap-4 mb-6">
        <Stat icon={<Users className="w-5 h-5" />} tone="primary" label="Tổng khách hàng" value={`${rows.length}`} hint="đang theo dõi" />
        <Stat icon={<TrendingUp className="w-5 h-5" />} tone="default" label="Tổng doanh thu" value={formatVND(totalRevenue)} hint="đã ghi nhận" />
        <Stat icon={<AlertCircle className="w-5 h-5" />} tone="accent" label="Còn phải thu" value={formatVND(totalOutstanding)} hint="công nợ khách hàng" />
      </div>

      <div className="card-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[var(--primary-soft)]/50 text-[var(--muted)] text-[11px] uppercase tracking-wider font-semibold">
                <th className="text-left py-3.5 pl-6 pr-3">Khách hàng</th>
                <th className="text-left py-3.5 px-3 whitespace-nowrap">MST</th>
                <th className="text-left py-3.5 px-3 whitespace-nowrap">Liên hệ</th>
                <th className="text-center py-3.5 px-3">Số HĐ</th>
                <th className="text-right py-3.5 px-3">Doanh thu</th>
                <th className="text-right py-3.5 px-3 whitespace-nowrap">Còn phải thu</th>
                <th className="w-12 py-3.5 pr-4"></th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[var(--muted)]">
                    Chưa có khách hàng. Bấm “Thêm khách hàng” để bắt đầu.
                  </td>
                </tr>
              )}
              {rows.map((c) => (
                <tr key={c.id} className="border-t border-[var(--border)] hover:bg-[var(--primary-soft)]/30 transition-colors">
                  <td className="py-3 pl-6 pr-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--primary-deep)] flex items-center justify-center text-white text-[11px] font-bold shrink-0">
                        {(c.name || "?").slice(0, 2).toUpperCase()}
                      </div>
                      <p className="font-semibold text-[var(--foreground)]">{c.name}</p>
                    </div>
                  </td>
                  <td className="py-3 px-3 font-mono text-xs text-[var(--muted)]">{c.tax_code || "—"}</td>
                  <td className="py-3 px-3 text-[var(--muted)]">
                    <div className="text-xs">
                      {c.phone && <div>{c.phone}</div>}
                      {c.email && <div className="text-[var(--muted-soft)]">{c.email}</div>}
                      {!c.phone && !c.email && "—"}
                    </div>
                  </td>
                  <td className="py-3 px-3 text-center text-[var(--muted)]">{c.invoiceCount}</td>
                  <td className="py-3 px-3 text-right font-semibold text-[var(--foreground)]">{formatVND(c.revenue)}</td>
                  <td className="py-3 px-3 text-right">
                    {c.outstanding > 0 ? (
                      <span className="font-semibold text-rose-500">{formatVND(c.outstanding)}</span>
                    ) : (
                      <span className="text-emerald-500 font-medium">Đủ</span>
                    )}
                  </td>
                  <td className="py-3 pr-4">
                    <RowActions
                      actions={[
                        { label: "Ghi nhận doanh thu", icon: <Receipt className="w-4 h-4" />, onClick: () => setRevenue({ company: c.name }) },
                        { label: "Sửa", icon: <Pencil className="w-4 h-4" />, onClick: () => openEdit(c) },
                        { label: "Xoá", icon: <Trash2 className="w-4 h-4" />, danger: true, onClick: () => remove(c) },
                      ]}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <CustomerModal
        open={open}
        onClose={() => setOpen(false)}
        draft={draft}
        onSaved={() => {
          setOpen(false);
          router.refresh();
        }}
      />

      {revenue && (
        <RevenueModal
          company={revenue.company}
          onClose={() => setRevenue(null)}
          onSaved={() => setRevenue(null)}
        />
      )}
    </>
  );
}

function CustomerModal({
  open,
  onClose,
  draft,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  draft: Draft;
  onSaved: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    const payload = {
      name: String(fd.get("name") || "").trim(),
      tax_code: String(fd.get("tax_code") || "").trim() || null,
      phone: String(fd.get("phone") || "").trim() || null,
      email: String(fd.get("email") || "").trim() || null,
      address: String(fd.get("address") || "").trim() || null,
      payment_terms: String(fd.get("payment_terms") || "").trim() || null,
      note: String(fd.get("note") || "").trim() || null,
    };
    const supabase = createClient();
    const res = draft.id
      ? await supabase.from("companies").update(payload).eq("id", draft.id)
      : await supabase.from("companies").insert(payload);
    setSaving(false);
    if (res.error) {
      setError(res.error.message);
      return;
    }
    onSaved();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={draft.id ? "Sửa khách hàng" : "Thêm khách hàng"}
      subtitle="Thông tin xuất hoá đơn & liên hệ"
    >
      <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
        <FormField label="Tên khách hàng" className="col-span-2">
          <input name="name" defaultValue={draft.name} required placeholder="Công ty TNHH ..." className="erp-input" />
        </FormField>
        <FormField label="Mã số thuế">
          <input name="tax_code" defaultValue={draft.tax_code} placeholder="0xxxxxxxxx" className="erp-input" />
        </FormField>
        <FormField label="Điều khoản TT">
          <input name="payment_terms" defaultValue={draft.payment_terms} placeholder="VD: 50-30-20" className="erp-input" />
        </FormField>
        <FormField label="Số điện thoại">
          <input name="phone" defaultValue={draft.phone} placeholder="09xxxxxxxx" className="erp-input" />
        </FormField>
        <FormField label="Email nhận HĐ">
          <input name="email" type="email" defaultValue={draft.email} placeholder="ketoan@..." className="erp-input" />
        </FormField>
        <FormField label="Địa chỉ" className="col-span-2">
          <input name="address" defaultValue={draft.address} placeholder="Quận, Thành phố" className="erp-input" />
        </FormField>
        <FormField label="Ghi chú" className="col-span-2">
          <textarea name="note" rows={2} defaultValue={draft.note} className="erp-input resize-none" />
        </FormField>

        {error && (
          <p className="col-span-2 text-xs text-rose-500 bg-rose-50 rounded-xl px-4 py-2.5">Lỗi: {error}</p>
        )}

        <div className="col-span-2 flex justify-end gap-3 mt-1">
          <button type="button" onClick={onClose} className="h-11 px-5 rounded-2xl border border-[var(--border)] text-sm font-semibold text-[var(--muted)] hover:bg-[var(--primary-soft)]">
            Huỷ
          </button>
          <button type="submit" disabled={saving} className="h-11 px-6 rounded-2xl bg-[var(--primary)] text-white text-sm font-semibold hover:bg-[var(--primary-deep)] shadow-md shadow-[var(--primary)]/25 disabled:opacity-60 flex items-center gap-2">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {saving ? "Đang lưu..." : "Lưu"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function Stat({
  icon,
  label,
  value,
  hint,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint: string;
  tone: "primary" | "default" | "accent";
}) {
  const styles = {
    primary: "card-primary text-white",
    default: "card-soft border border-[var(--border)]",
    accent: "card-accent text-white",
  };
  const iconWrap = {
    primary: "bg-white/15 text-white",
    default: "bg-[var(--primary-soft)] text-[var(--primary)]",
    accent: "bg-white/20 text-white",
  };
  const labelStyle = { primary: "text-white/70", default: "text-[var(--muted)]", accent: "text-white/80" };
  const hintStyle = { primary: "text-white/60", default: "text-[var(--muted-soft)]", accent: "text-white/75" };
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

function FormField({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={`flex flex-col gap-1.5 ${className ?? ""}`}>
      <span className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">{label}</span>
      {children}
    </label>
  );
}
