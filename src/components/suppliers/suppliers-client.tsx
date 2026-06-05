"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Pencil,
  FileText,
  Building2,
  Receipt,
  AlertCircle,
  Loader2,
  Sparkles,
  Mail,
  AlertTriangle,
} from "lucide-react";
import { Topbar } from "@/components/topbar";
import { Modal } from "@/components/ui/modal";
import { RowActions } from "@/components/ui/row-actions";
import { CustomSelect, type SelectOption } from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";
import type { SupplierStat } from "@/lib/analytics";
import type { Supplier } from "@/lib/database.types";
import { categoryLabel, type InvoiceCategory, type InvoiceIn } from "@/lib/mock-data";
import { cn, formatVND } from "@/lib/utils";

const easeConfig: Record<
  SupplierStat["easeToCollect"],
  { label: string; cls: string; icon: React.ReactNode }
> = {
  easy: { label: "Tự động", cls: "bg-emerald-50 text-emerald-600 border-emerald-200", icon: <Sparkles className="w-3 h-3" /> },
  medium: { label: "Liên hệ NCC", cls: "bg-amber-50 text-amber-600 border-amber-200", icon: <Mail className="w-3 h-3" /> },
  hard: { label: "Khó (cá nhân)", cls: "bg-rose-50 text-rose-600 border-rose-200", icon: <AlertTriangle className="w-3 h-3" /> },
};

const categoryFormOptions: SelectOption[] = Object.entries(categoryLabel).map(
  ([k, label]) => ({ value: k, label })
);
const easeOptions: SelectOption[] = [
  { value: "easy", label: "Tự động (dễ xin HĐ)", dot: "#10b981" },
  { value: "medium", label: "Liên hệ NCC", dot: "#f59e0b" },
  { value: "hard", label: "Khó (cá nhân)", dot: "#f43f5e" },
];

type VendorDraft = {
  id?: string;
  name: string;
  tax_code: string;
  category: string;
  ease_to_collect: string;
  phone: string;
  email: string;
  bank_name: string;
  bank_account: string;
};

const emptyVendor: VendorDraft = {
  name: "",
  tax_code: "",
  category: "other",
  ease_to_collect: "medium",
  phone: "",
  email: "",
  bank_name: "",
  bank_account: "",
};

export function SuppliersClient({
  stats,
  masters,
  invoices,
}: {
  stats: SupplierStat[];
  masters: Supplier[];
  invoices: InvoiceIn[];
}) {
  const router = useRouter();
  const [vendor, setVendor] = useState<VendorDraft | null>(null);
  const [detail, setDetail] = useState<string | null>(null);

  const totalSuppliers = stats.length;
  const totalOutstanding = stats.reduce((s, x) => s + x.outstandingAmount, 0);
  const totalVat = stats.reduce((s, x) => s + x.vatRecoverable, 0);

  function editVendor(name: string) {
    const m = masters.find((x) => x.name.trim() === name.trim());
    setVendor(
      m
        ? {
            id: m.id,
            name: m.name,
            tax_code: m.tax_code ?? "",
            category: m.category ?? "other",
            ease_to_collect: m.ease_to_collect ?? "medium",
            phone: m.phone ?? "",
            email: m.email ?? "",
            bank_name: m.bank_name ?? "",
            bank_account: m.bank_account ?? "",
          }
        : { ...emptyVendor, name }
    );
  }

  const detailInvoices = detail
    ? invoices.filter((i) => i.supplier === detail)
    : [];

  return (
    <>
      <Topbar
        title="Nhà cung cấp"
        subtitle="Gợi ý thu hồi hoá đơn đầu vào"
        action={
          <button
            onClick={() => setVendor(emptyVendor)}
            className="h-11 px-5 rounded-2xl bg-[var(--primary)] text-white font-semibold text-sm flex items-center gap-2 hover:bg-[var(--primary-deep)] transition-colors shadow-md shadow-[var(--primary)]/25"
          >
            <Plus className="w-4 h-4" />
            Thêm NCC
          </button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <MiniStat tone="primary" icon={<Building2 className="w-5 h-5" />} label="Tổng NCC" value={`${totalSuppliers}`} hint="có phát sinh chi phí" />
        <MiniStat tone="default" icon={<Receipt className="w-5 h-5" />} label="VAT có thể thu hồi" value={formatVND(totalVat)} hint="nếu thu đủ HĐ" />
        <MiniStat tone="accent" icon={<AlertCircle className="w-5 h-5" />} label="Chi phí thiếu HĐ" value={formatVND(totalOutstanding)} hint="cần thu hồi" />
      </div>

      <div className="card-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[var(--primary-soft)]/50 text-[var(--muted)] text-[11px] uppercase tracking-wider font-semibold">
                <th className="text-left py-3.5 pl-6 pr-3">Nhà cung cấp</th>
                <th className="text-center py-3.5 px-3">Số HĐ</th>
                <th className="text-right py-3.5 px-3">Tổng chi</th>
                <th className="text-left py-3.5 px-3 w-40">Đã có HĐ</th>
                <th className="text-right py-3.5 px-3 whitespace-nowrap">Còn thiếu</th>
                <th className="text-center py-3.5 px-3 whitespace-nowrap">Khả năng xin</th>
                <th className="w-12 py-3.5 pr-4"></th>
              </tr>
            </thead>
            <tbody>
              {stats.map((s) => {
                const ease = easeConfig[s.easeToCollect];
                return (
                  <tr key={s.name} className="border-t border-[var(--border)] hover:bg-[var(--primary-soft)]/30 transition-colors">
                    <td className="py-3 pl-6 pr-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--primary-deep)] flex items-center justify-center text-white text-[11px] font-bold shrink-0">
                          {s.initials}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-[var(--foreground)] truncate max-w-[260px]">{s.name}</p>
                          <p className="text-[11px] text-[var(--muted-soft)]">{s.categoryText}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center text-[var(--muted)] font-medium">{s.invoiceCount}</td>
                    <td className="py-3 px-3 text-right font-semibold text-[var(--foreground)]">{formatVND(s.totalAmount)}</td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-[var(--border)] rounded-full overflow-hidden">
                          <div className={cn("h-full rounded-full", s.collectedPct >= 80 ? "bg-emerald-400" : s.collectedPct >= 40 ? "bg-amber-400" : "bg-rose-400")} style={{ width: `${s.collectedPct}%` }} />
                        </div>
                        <span className="text-[11px] font-bold text-[var(--foreground)] w-9 text-right">{s.collectedPct}%</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right">
                      {s.outstandingAmount > 0 ? (
                        <span className="font-semibold text-rose-500">{formatVND(s.outstandingAmount)}</span>
                      ) : (
                        <span className="text-emerald-500 font-medium">Đủ</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className={cn("inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full border whitespace-nowrap", ease.cls)}>
                        {ease.icon}
                        {ease.label}
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      <RowActions
                        actions={[
                          { label: "Xem hoá đơn", icon: <FileText className="w-4 h-4" />, onClick: () => setDetail(s.name) },
                          { label: "Sửa thông tin NCC", icon: <Pencil className="w-4 h-4" />, onClick: () => editVendor(s.name) },
                        ]}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-4 border-t border-[var(--border)] text-xs text-[var(--muted)]">
          <b className="text-[var(--foreground)]">{stats.length}</b> nhà cung cấp · sắp xếp theo số tiền thiếu hoá đơn
        </div>
      </div>

      {/* Vendor add/edit */}
      {vendor && (
        <VendorModal
          draft={vendor}
          onClose={() => setVendor(null)}
          onSaved={() => {
            setVendor(null);
            router.refresh();
          }}
        />
      )}

      {/* Detail: invoices of a supplier */}
      <Modal
        open={detail !== null}
        onClose={() => setDetail(null)}
        title={detail ?? ""}
        subtitle={`${detailInvoices.length} hoá đơn`}
        maxWidth="max-w-2xl"
      >
        <div className="flex flex-col gap-2">
          {detailInvoices.map((i) => (
            <div key={i.id} className="flex items-center justify-between p-3 rounded-2xl bg-[var(--primary-soft)]/40">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[var(--foreground)]">#{i.code || "—"}</p>
                <p className="text-[11px] text-[var(--muted)]">{i.date} · {categoryLabel[i.category]}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-[var(--foreground)]">{formatVND(i.amount)}</p>
                <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full", i.status === "matched" ? "bg-emerald-50 text-emerald-600" : i.status === "pending" ? "bg-amber-50 text-amber-600" : "bg-rose-50 text-rose-600")}>
                  {i.status === "matched" ? "Đã khớp" : i.status === "pending" ? "Chờ" : "Thiếu HĐ"}
                </span>
              </div>
            </div>
          ))}
          {detailInvoices.length === 0 && (
            <p className="text-sm text-[var(--muted)] text-center py-6">Chưa có hoá đơn.</p>
          )}
        </div>
      </Modal>
    </>
  );
}

function VendorModal({
  draft,
  onClose,
  onSaved,
}: {
  draft: VendorDraft;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState(draft.category);
  const [ease, setEase] = useState(draft.ease_to_collect);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    const payload = {
      name: String(fd.get("name") || "").trim(),
      tax_code: String(fd.get("tax_code") || "").trim() || null,
      category: category as InvoiceCategory,
      ease_to_collect: ease,
      phone: String(fd.get("phone") || "").trim() || null,
      email: String(fd.get("email") || "").trim() || null,
      bank_name: String(fd.get("bank_name") || "").trim() || null,
      bank_account: String(fd.get("bank_account") || "").trim() || null,
    };
    const supabase = createClient();
    const res = draft.id
      ? await supabase.from("suppliers").update(payload).eq("id", draft.id)
      : await supabase.from("suppliers").insert(payload);
    setSaving(false);
    if (res.error) {
      setError(res.error.message);
      return;
    }
    onSaved();
  }

  return (
    <Modal open onClose={onClose} title={draft.id ? "Sửa nhà cung cấp" : "Thêm nhà cung cấp"} subtitle="Thông tin & tài khoản nhận tiền">
      <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Tên NCC" className="col-span-2">
          <input name="name" defaultValue={draft.name} required className="erp-input" />
        </Field>
        <Field label="Mã số thuế">
          <input name="tax_code" defaultValue={draft.tax_code} className="erp-input" />
        </Field>
        <Field label="Hạng mục">
          <CustomSelect value={category} onChange={setCategory} options={categoryFormOptions} />
        </Field>
        <Field label="Khả năng xin HĐ" className="col-span-2">
          <CustomSelect value={ease} onChange={setEase} options={easeOptions} />
        </Field>
        <Field label="Điện thoại">
          <input name="phone" defaultValue={draft.phone} className="erp-input" />
        </Field>
        <Field label="Email">
          <input name="email" type="email" defaultValue={draft.email} className="erp-input" />
        </Field>
        <Field label="Ngân hàng">
          <input name="bank_name" defaultValue={draft.bank_name} placeholder="VD: VPBank" className="erp-input" />
        </Field>
        <Field label="Số tài khoản">
          <input name="bank_account" defaultValue={draft.bank_account} className="erp-input" />
        </Field>

        {error && <p className="col-span-2 text-xs text-rose-500 bg-rose-50 rounded-xl px-4 py-2.5">Lỗi: {error}</p>}

        <div className="col-span-2 flex justify-end gap-3 mt-1">
          <button type="button" onClick={onClose} className="h-11 px-5 rounded-2xl border border-[var(--border)] text-sm font-semibold text-[var(--muted)] hover:bg-[var(--primary-soft)]">Huỷ</button>
          <button type="submit" disabled={saving} className="h-11 px-6 rounded-2xl bg-[var(--primary)] text-white text-sm font-semibold hover:bg-[var(--primary-deep)] shadow-md shadow-[var(--primary)]/25 disabled:opacity-60 flex items-center gap-2">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {saving ? "Đang lưu..." : "Lưu"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function MiniStat({ icon, label, value, hint, tone }: { icon: React.ReactNode; label: string; value: string; hint: string; tone: "primary" | "default" | "accent" }) {
  const styles = { primary: "card-primary text-white", default: "card-soft border border-[var(--border)]", accent: "card-accent text-white" };
  const iconWrap = { primary: "bg-white/15 text-white", default: "bg-[var(--primary-soft)] text-[var(--primary)]", accent: "bg-white/20 text-white" };
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

function Field({ label, className, children }: { label: string; className?: string; children: React.ReactNode }) {
  return (
    <label className={`flex flex-col gap-1.5 ${className ?? ""}`}>
      <span className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">{label}</span>
      {children}
    </label>
  );
}
