"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { X, Sparkles, Loader2 } from "lucide-react";
import { categoryLabel, type InvoiceIn } from "@/lib/mock-data";
import { createClient } from "@/lib/supabase/client";
import type { InvoiceCategoryDb, InvoiceStatus } from "@/lib/database.types";
import { CustomSelect, type SelectOption } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { BatchOcrUpload } from "@/components/invoices/batch-ocr-upload";

const categoryFormOptions: SelectOption[] = Object.entries(categoryLabel).map(
  ([k, label]) => ({ value: k, label })
);
const vatOptions: SelectOption[] = [
  { value: "0", label: "0%" },
  { value: "5", label: "5%" },
  { value: "8", label: "8%" },
  { value: "10", label: "10%" },
];
const statusFormOptions: SelectOption[] = [
  { value: "matched", label: "Đã khớp (có HĐ)", dot: "#10b981" },
  { value: "pending", label: "Chờ duyệt", dot: "#f59e0b" },
  { value: "missing", label: "Thiếu HĐ", dot: "#f43f5e" },
];

type Tab = "upload" | "manual";

export function AddInvoiceModal({
  open,
  onClose,
  editing,
}: {
  open: boolean;
  onClose: () => void;
  editing?: InvoiceIn;
}) {
  const [tab, setTab] = useState<Tab>(editing ? "manual" : "upload");

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-[var(--foreground)]/50" />

      <div
        className="relative bg-white rounded-[28px] w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-[var(--border)]">
          <div>
            <h2 className="text-xl font-bold text-[var(--foreground)]">
              {editing ? "Sửa hoá đơn đầu vào" : "Thêm hoá đơn đầu vào"}
            </h2>
            <p className="text-xs text-[var(--muted)] mt-0.5">
              {editing
                ? "Cập nhật thông tin hoá đơn"
                : "Upload ảnh để AI tự bóc tách, hoặc nhập thủ công"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full hover:bg-[var(--primary-soft)] flex items-center justify-center text-[var(--muted)]"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {!editing && (
        <div className="px-6 pt-5">
          <div className="bg-[var(--primary-soft)] rounded-2xl p-1 flex gap-1 text-sm font-semibold w-fit">
            <button
              onClick={() => setTab("upload")}
              className={cn(
                "py-2 px-4 rounded-xl transition-colors flex items-center gap-2",
                tab === "upload"
                  ? "bg-white text-[var(--primary)] shadow-sm"
                  : "text-[var(--muted)]"
              )}
            >
              <Sparkles className="w-4 h-4" />
              Upload ảnh (AI)
            </button>
            <button
              onClick={() => setTab("manual")}
              className={cn(
                "py-2 px-4 rounded-xl transition-colors",
                tab === "manual"
                  ? "bg-white text-[var(--primary)] shadow-sm"
                  : "text-[var(--muted)]"
              )}
            >
              Nhập thủ công
            </button>
          </div>
        </div>
        )}

        <div className="p-6">
          {tab === "upload" && !editing ? (
            <BatchOcrUpload onClose={onClose} />
          ) : (
            <ManualForm onClose={onClose} initial={editing} />
          )}
        </div>
      </div>
    </div>
  );
}

function ManualForm({
  onClose,
  initial,
}: {
  onClose: () => void;
  initial?: InvoiceIn;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState<string>(initial?.category ?? "saas");
  const [vatRate, setVatRate] = useState<string>(
    initial ? String(initial.vatRate) : "10"
  );
  const [status, setStatus] = useState<string>(initial?.status ?? "matched");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    const fd = new FormData(e.currentTarget);
    const payload = {
      supplier_name: String(fd.get("supplier_name") || "").trim(),
      code: String(fd.get("code") || "").trim() || null,
      invoice_date: String(fd.get("invoice_date") || "") || null,
      category: category as InvoiceCategoryDb,
      vat_rate: Number(vatRate),
      amount: Number(fd.get("amount") || 0),
      status: status as InvoiceStatus,
      note: String(fd.get("note") || "").trim() || null,
    };

    const supabase = createClient();
    const { error } = initial?.id
      ? await supabase.from("invoices_in").update(payload).eq("id", initial.id)
      : await supabase.from("invoices_in").insert(payload);

    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.refresh();
    onClose();
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <Field label="Nhà cung cấp" className="col-span-2">
        <input
          name="supplier_name"
          type="text"
          defaultValue={initial?.supplier}
          placeholder="VD: Google Workspace"
          className="form-input"
          required
        />
      </Field>

      <Field label="Số hoá đơn">
        <input
          name="code"
          type="text"
          defaultValue={initial?.code}
          placeholder="0000421"
          className="form-input"
        />
      </Field>

      <Field label="Ngày phát hành">
        <input
          name="invoice_date"
          type="date"
          defaultValue={initial?.date || undefined}
          className="form-input"
          required
        />
      </Field>

      <Field label="Hạng mục">
        <CustomSelect
          value={category}
          onChange={setCategory}
          options={categoryFormOptions}
        />
      </Field>

      <Field label="VAT (%)">
        <CustomSelect value={vatRate} onChange={setVatRate} options={vatOptions} />
      </Field>

      <Field label="Giá trị trước VAT">
        <div className="relative">
          <input
            name="amount"
            type="number"
            defaultValue={initial?.amount}
            placeholder="0"
            className="form-input pr-12"
            required
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-[var(--muted)] font-medium">
            ₫
          </span>
        </div>
      </Field>

      <Field label="Trạng thái">
        <CustomSelect
          value={status}
          onChange={setStatus}
          options={statusFormOptions}
        />
      </Field>

      <Field label="Ghi chú (tuỳ chọn)" className="col-span-2">
        <textarea
          name="note"
          rows={2}
          defaultValue={initial?.note}
          placeholder="VD: Khớp với expense 'Subscription tháng 6'"
          className="form-input resize-none"
        />
      </Field>

      {error && (
        <p className="col-span-2 text-xs text-rose-500 bg-rose-50 rounded-xl px-4 py-2.5">
          Lỗi lưu: {error}
        </p>
      )}

      <div className="col-span-2 flex justify-end gap-3 mt-2">
        <button
          type="button"
          onClick={onClose}
          className="h-11 px-5 rounded-2xl border border-[var(--border)] text-sm font-semibold text-[var(--muted)] hover:bg-[var(--primary-soft)]"
        >
          Huỷ
        </button>
        <button
          type="submit"
          disabled={saving}
          className="h-11 px-6 rounded-2xl bg-[var(--primary)] text-white text-sm font-semibold hover:bg-[var(--primary-deep)] shadow-md shadow-[var(--primary)]/25 disabled:opacity-60 flex items-center gap-2"
        >
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          {saving ? "Đang lưu..." : "Lưu hoá đơn"}
        </button>
      </div>

      <style jsx>{`
        .form-input {
          width: 100%;
          height: 44px;
          padding: 0 16px;
          background: white;
          border: 1px solid var(--border);
          border-radius: 14px;
          font-size: 14px;
          color: var(--foreground);
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        select.form-input {
          appearance: none;
          -webkit-appearance: none;
          cursor: pointer;
          padding-right: 38px;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23a8a7bf' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 14px center;
        }
        textarea.form-input {
          height: auto;
          padding: 12px 16px;
        }
        .form-input:focus {
          outline: none;
          border-color: var(--primary);
          box-shadow: 0 0 0 3px rgba(91, 79, 207, 0.15);
        }
      `}</style>
    </form>
  );
}

function Field({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={cn("flex flex-col gap-1.5", className)}>
      <span className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">
        {label}
      </span>
      {children}
    </label>
  );
}
