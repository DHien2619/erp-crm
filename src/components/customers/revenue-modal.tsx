"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { CustomSelect, type SelectOption } from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";
import type { InvoiceStatus } from "@/lib/database.types";

const vatOptions: SelectOption[] = [
  { value: "0", label: "0%" },
  { value: "5", label: "5%" },
  { value: "8", label: "8%" },
  { value: "10", label: "10%" },
];
const statusOptions: SelectOption[] = [
  { value: "matched", label: "Đã thu đủ", dot: "#10b981" },
  { value: "pending", label: "Thu một phần / đang nợ", dot: "#f59e0b" },
  { value: "missing", label: "Chưa xuất HĐ", dot: "#f43f5e" },
];

export function RevenueModal({
  company,
  onClose,
  onSaved,
}: {
  company?: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [vat, setVat] = useState("10");
  const [status, setStatus] = useState("pending");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    const amount = Number(fd.get("amount") || 0);
    const paid = Number(fd.get("paid_amount") || 0);
    const payload = {
      company_name: String(fd.get("company_name") || "").trim(),
      code: String(fd.get("code") || "").trim() || null,
      invoice_date: String(fd.get("invoice_date") || "") || null,
      due_date: String(fd.get("due_date") || "") || null,
      amount,
      paid_amount: status === "matched" ? amount : paid,
      vat_rate: Number(vat),
      status: status as InvoiceStatus,
    };
    const supabase = createClient();
    const { error } = await supabase.from("invoices_out").insert(payload);
    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.refresh();
    onSaved();
  }

  return (
    <Modal open onClose={onClose} title="Ghi nhận doanh thu" subtitle="Hoá đơn đầu ra cho khách hàng">
      <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
        <Field label="Khách hàng" className="col-span-2">
          <input name="company_name" defaultValue={company} required placeholder="Tên khách hàng" className="erp-input" />
        </Field>
        <Field label="Số hợp đồng / HĐ">
          <input name="code" placeholder="VD: AIECOS-..." className="erp-input" />
        </Field>
        <Field label="Ngày xuất HĐ">
          <input name="invoice_date" type="date" className="erp-input" required />
        </Field>
        <Field label="Hạn thanh toán">
          <input name="due_date" type="date" className="erp-input" />
        </Field>
        <Field label="VAT (%)">
          <CustomSelect value={vat} onChange={setVat} options={vatOptions} />
        </Field>
        <Field label="Tổng tiền (₫)">
          <input name="amount" type="number" placeholder="0" required className="erp-input" />
        </Field>
        <Field label="Đã thu (₫)">
          <input name="paid_amount" type="number" placeholder="0" className="erp-input" />
        </Field>
        <Field label="Trạng thái công nợ" className="col-span-2">
          <CustomSelect value={status} onChange={setStatus} options={statusOptions} />
        </Field>

        {error && <p className="col-span-2 text-xs text-rose-500 bg-rose-50 rounded-xl px-4 py-2.5">Lỗi: {error}</p>}

        <div className="col-span-2 flex justify-end gap-3 mt-1">
          <button type="button" onClick={onClose} className="h-11 px-5 rounded-2xl border border-[var(--border)] text-sm font-semibold text-[var(--muted)] hover:bg-[var(--primary-soft)]">Huỷ</button>
          <button type="submit" disabled={saving} className="h-11 px-6 rounded-2xl bg-[var(--primary)] text-white text-sm font-semibold hover:bg-[var(--primary-deep)] shadow-md shadow-[var(--primary)]/25 disabled:opacity-60 flex items-center gap-2">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {saving ? "Đang lưu..." : "Lưu doanh thu"}
          </button>
        </div>
      </form>
    </Modal>
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
