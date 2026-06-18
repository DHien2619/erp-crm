"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { CustomSelect } from "@/components/ui/select";
import { MoneyField } from "@/components/ui/money-field";
import { createClient } from "@/lib/supabase/client";
import {
  costCategoryOptions,
  projectStatusOptions,
} from "@/lib/projects";
import type { Project, ProjectCostCategory } from "@/lib/database.types";

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
    <label className={`flex flex-col gap-1.5 ${className ?? ""}`}>
      <span className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">
        {label}
      </span>
      {children}
    </label>
  );
}

function Actions({
  saving,
  onClose,
  label,
}: {
  saving: boolean;
  onClose: () => void;
  label: string;
}) {
  return (
    <div className="col-span-2 flex justify-end gap-3 mt-1">
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
        {saving ? "Đang lưu..." : label}
      </button>
    </div>
  );
}

// ---------- Tạo / sửa dự án ----------
export function ProjectModal({
  editing,
  onClose,
  onSaved,
}: {
  editing?: Project;
  onClose: () => void;
  onSaved: (id?: string) => void;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState(editing?.status ?? "active");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    const payload = {
      name: String(fd.get("name") || "").trim(),
      code: String(fd.get("code") || "").trim() || null,
      client_name: String(fd.get("client_name") || "").trim() || null,
      contract_value: Number(fd.get("contract_value") || 0),
      start_date: String(fd.get("start_date") || "") || null,
      note: String(fd.get("note") || "").trim() || null,
      status,
    };
    const supabase = createClient();
    if (editing) {
      const { error } = await supabase.from("projects").update(payload).eq("id", editing.id);
      setSaving(false);
      if (error) return setError(error.message);
      router.refresh();
      onSaved(editing.id);
    } else {
      const { data, error } = await supabase.from("projects").insert(payload).select("id").single();
      setSaving(false);
      if (error) return setError(error.message);
      router.refresh();
      onSaved(data?.id);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={editing ? "Sửa dự án" : "Thêm dự án"}
      subtitle="Thông tin hợp đồng & giá trị dự án"
    >
      <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Tên dự án" className="col-span-2">
          <input name="name" defaultValue={editing?.name} required placeholder="VD: Website + AI Chatbot..." className="erp-input" />
        </Field>
        <Field label="Mã dự án">
          <input name="code" defaultValue={editing?.code ?? ""} placeholder="DA-001" className="erp-input" />
        </Field>
        <Field label="Khách hàng">
          <input name="client_name" defaultValue={editing?.client_name ?? ""} placeholder="Tên khách hàng" className="erp-input" />
        </Field>
        <Field label="Giá trị dự án (₫)">
          <MoneyField name="contract_value" defaultValue={editing?.contract_value} required />
        </Field>
        <Field label="Ngày bắt đầu">
          <input name="start_date" type="date" defaultValue={editing?.start_date ?? ""} className="erp-input" />
        </Field>
        <Field label="Trạng thái" className="col-span-2">
          <CustomSelect value={status} onChange={setStatus} options={projectStatusOptions} />
        </Field>
        <Field label="Ghi chú" className="col-span-2">
          <input name="note" defaultValue={editing?.note ?? ""} placeholder="Mô tả ngắn..." className="erp-input" />
        </Field>

        {error && (
          <p className="col-span-2 text-xs text-rose-500 bg-rose-50 rounded-xl px-4 py-2.5">Lỗi: {error}</p>
        )}
        <Actions saving={saving} onClose={onClose} label={editing ? "Lưu thay đổi" : "Tạo dự án"} />
      </form>
    </Modal>
  );
}

// ---------- Thêm đợt thanh toán ----------
export function PaymentModal({
  projectId,
  onClose,
  onSaved,
}: {
  projectId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    const payload = {
      project_id: projectId,
      label: String(fd.get("label") || "").trim() || null,
      amount: Number(fd.get("amount") || 0),
      paid_at: String(fd.get("paid_at") || "") || null,
      note: String(fd.get("note") || "").trim() || null,
    };
    const supabase = createClient();
    const { error } = await supabase.from("project_payments").insert(payload);
    setSaving(false);
    if (error) return setError(error.message);
    router.refresh();
    onSaved();
  }

  return (
    <Modal open onClose={onClose} title="Ghi nhận thanh toán" subtitle="Khách hàng thanh toán theo đợt">
      <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Tên đợt" className="col-span-2">
          <input name="label" required placeholder="VD: Đợt 1 (tạm ứng 40%)" className="erp-input" />
        </Field>
        <Field label="Số tiền (₫)">
          <MoneyField name="amount" required />
        </Field>
        <Field label="Ngày thanh toán">
          <input name="paid_at" type="date" className="erp-input" />
        </Field>
        <Field label="Ghi chú" className="col-span-2">
          <input name="note" placeholder="..." className="erp-input" />
        </Field>

        {error && (
          <p className="col-span-2 text-xs text-rose-500 bg-rose-50 rounded-xl px-4 py-2.5">Lỗi: {error}</p>
        )}
        <Actions saving={saving} onClose={onClose} label="Lưu thanh toán" />
      </form>
    </Modal>
  );
}

// ---------- Thêm chi phí ----------
export function CostModal({
  projectId,
  onClose,
  onSaved,
}: {
  projectId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState<ProjectCostCategory>("ai_tools");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    const payload = {
      project_id: projectId,
      category,
      name: String(fd.get("name") || "").trim() || null,
      amount: Number(fd.get("amount") || 0),
      spent_at: String(fd.get("spent_at") || "") || null,
      note: String(fd.get("note") || "").trim() || null,
    };
    const supabase = createClient();
    const { error } = await supabase.from("project_costs").insert(payload);
    setSaving(false);
    if (error) return setError(error.message);
    router.refresh();
    onSaved();
  }

  return (
    <Modal open onClose={onClose} title="Thêm chi phí" subtitle="Chi phí thực hiện dự án">
      <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Hạng mục" className="col-span-2">
          <CustomSelect
            value={category}
            onChange={(v) => setCategory(v as ProjectCostCategory)}
            options={costCategoryOptions}
          />
        </Field>
        <Field label="Mô tả" className="col-span-2">
          <input name="name" required placeholder="VD: ChatGPT Team + Claude" className="erp-input" />
        </Field>
        <Field label="Số tiền (₫)">
          <MoneyField name="amount" required />
        </Field>
        <Field label="Ngày chi">
          <input name="spent_at" type="date" className="erp-input" />
        </Field>
        <Field label="Ghi chú" className="col-span-2">
          <input name="note" placeholder="..." className="erp-input" />
        </Field>

        {error && (
          <p className="col-span-2 text-xs text-rose-500 bg-rose-50 rounded-xl px-4 py-2.5">Lỗi: {error}</p>
        )}
        <Actions saving={saving} onClose={onClose} label="Lưu chi phí" />
      </form>
    </Modal>
  );
}
