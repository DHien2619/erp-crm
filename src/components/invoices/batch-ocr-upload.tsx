"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Upload, Loader2, Sparkles, X, Check, AlertCircle, Plus } from "lucide-react";
import { categoryLabel } from "@/lib/mock-data";
import { createClient } from "@/lib/supabase/client";
import type { InvoiceCategoryDb, InvoiceStatus } from "@/lib/database.types";
import { CustomSelect, type SelectOption } from "@/components/ui/select";
import { cn } from "@/lib/utils";

const categoryOptions: SelectOption[] = Object.entries(categoryLabel).map(
  ([value, label]) => ({ value, label })
);
const vatOptions: SelectOption[] = [
  { value: "0", label: "0%" },
  { value: "5", label: "5%" },
  { value: "8", label: "8%" },
  { value: "10", label: "10%" },
];
const statusOptions: SelectOption[] = [
  { value: "matched", label: "Đã khớp", dot: "#10b981" },
  { value: "pending", label: "Chờ duyệt", dot: "#f59e0b" },
  { value: "missing", label: "Thiếu HĐ", dot: "#f43f5e" },
];

function mediaOf(file: File): string {
  const t = (file.type || "").toLowerCase();
  if (t) return t === "image/jpg" ? "image/jpeg" : t;
  const ext = file.name.split(".").pop()?.toLowerCase() || "";
  const map: Record<string, string> = {
    jpg: "image/jpeg", jpeg: "image/jpeg", jfif: "image/jpeg", png: "image/png",
    webp: "image/webp", gif: "image/gif", heic: "image/heic", heif: "image/heif",
    pdf: "application/pdf",
  };
  return map[ext] || "";
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const s = String(reader.result);
      resolve(s.slice(s.indexOf(",") + 1));
    };
    reader.onerror = () => reject(new Error("Không đọc được file."));
    reader.readAsDataURL(file);
  });
}

type Draft = {
  key: string;
  fileName: string;
  status: "ocr" | "done" | "error";
  error?: string;
  supplier: string;
  code: string;
  date: string;
  amount: string;
  vatRate: string;
  category: string;
  invStatus: string;
};

let counter = 0;
const input =
  "w-full h-10 px-3 rounded-xl border border-[var(--border)] bg-white text-sm text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/15";

export function BatchOcrUpload({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [saving, setSaving] = useState(false);
  const [topError, setTopError] = useState<string | null>(null);

  const patch = (key: string, p: Partial<Draft>) =>
    setDrafts((ds) => ds.map((d) => (d.key === key ? { ...d, ...p } : d)));

  async function addFiles(files: FileList | null) {
    if (!files || !files.length) return;
    setTopError(null);
    const arr = Array.from(files);
    const created: Draft[] = arr.map((f) => {
      const media = mediaOf(f);
      const tooBig = f.size > 10 * 1024 * 1024;
      return {
        key: `d${++counter}`,
        fileName: f.name,
        status: !media || tooBig ? "error" : "ocr",
        error: !media ? "Định dạng không hỗ trợ" : tooBig ? "File > 10MB" : undefined,
        supplier: "", code: "", date: "", amount: "", vatRate: "10",
        category: "other", invStatus: "pending",
      };
    });
    setDrafts((ds) => [...ds, ...created]);

    const todo = created.filter((d) => d.status === "ocr");
    setProcessing(true);
    setProgress({ done: 0, total: todo.length });
    let done = 0;
    for (let i = 0; i < arr.length; i++) {
      const d = created[i];
      if (d.status !== "ocr") continue;
      try {
        const data = await fileToBase64(arr[i]);
        const res = await fetch("/api/invoices/ocr", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ media_type: mediaOf(arr[i]), data }),
        });
        const json = await res.json();
        if (!json.ok) {
          patch(d.key, { status: "error", error: json.error || "Bóc tách thất bại" });
        } else {
          const f = json.fields ?? {};
          patch(d.key, {
            status: "done",
            supplier: f.supplier_name ?? "",
            code: f.code ?? "",
            date: f.invoice_date ?? "",
            amount: String(Number(f.amount) || 0),
            vatRate: String(Number(f.vat_rate) || 10),
            category: f.category ?? "other",
          });
        }
      } catch (e) {
        patch(d.key, { status: "error", error: (e as Error).message });
      }
      done += 1;
      setProgress({ done, total: todo.length });
    }
    setProcessing(false);
  }

  async function saveAll() {
    const ready = drafts.filter(
      (d) => d.status === "done" && d.supplier.trim() && Number(d.amount) > 0
    );
    if (!ready.length) {
      setTopError("Chưa có hoá đơn hợp lệ (cần Nhà cung cấp + Số tiền > 0).");
      return;
    }
    setSaving(true);
    setTopError(null);
    const supabase = createClient();
    const rows = ready.map((d) => ({
      supplier_name: d.supplier.trim(),
      code: d.code.trim() || null,
      invoice_date: d.date || null,
      category: d.category as InvoiceCategoryDb,
      vat_rate: Number(d.vatRate),
      amount: Number(d.amount),
      status: d.invStatus as InvoiceStatus,
      note: "Bóc tách AI (upload hàng loạt)",
    }));
    const { error } = await supabase.from("invoices_in").insert(rows);
    setSaving(false);
    if (error) {
      setTopError("Lỗi lưu: " + error.message);
      return;
    }
    router.refresh();
    onClose();
  }

  const readyCount = drafts.filter(
    (d) => d.status === "done" && d.supplier.trim() && Number(d.amount) > 0
  ).length;

  return (
    <div>
      <input
        ref={fileRef}
        type="file"
        multiple
        accept="image/*,application/pdf,.heic,.heif"
        className="hidden"
        onChange={(e) => {
          addFiles(e.target.files);
          e.target.value = "";
        }}
      />

      {drafts.length === 0 ? (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files); }}
          onClick={() => fileRef.current?.click()}
          className={cn(
            "border-2 border-dashed rounded-3xl p-10 text-center cursor-pointer transition-colors",
            dragOver
              ? "border-[var(--primary)] bg-[var(--primary-soft)]"
              : "border-[var(--border)] bg-[var(--primary-soft)]/30"
          )}
        >
          <div className="w-16 h-16 mx-auto rounded-2xl bg-white flex items-center justify-center shadow-sm mb-4">
            <Upload className="w-7 h-7 text-[var(--primary)]" />
          </div>
          <p className="font-semibold text-[var(--foreground)]">
            Kéo thả NHIỀU ảnh/PDF hoá đơn vào đây
          </p>
          <p className="text-xs text-[var(--muted)] mt-1">
            hoặc click để chọn nhiều file. JPG, PNG, HEIC, PDF — tối đa 10MB/file
          </p>
          <button
            type="button"
            className="mt-4 h-10 px-5 rounded-2xl bg-[var(--primary)] text-white text-sm font-semibold hover:bg-[var(--primary-deep)]"
          >
            Chọn nhiều file
          </button>
        </div>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-[var(--foreground)]">
              {drafts.length} hoá đơn{" "}
              {processing && (
                <span className="text-[var(--muted)] font-normal">
                  · đang đọc {progress.done}/{progress.total}…
                </span>
              )}
            </p>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex items-center gap-1 text-xs font-semibold text-[var(--primary)] hover:text-[var(--primary-deep)]"
            >
              <Plus className="w-4 h-4" /> Thêm ảnh
            </button>
          </div>

          <div className="space-y-3 max-h-[46vh] overflow-y-auto pr-1">
            {drafts.map((d) => (
              <DraftCard
                key={d.key}
                d={d}
                onChange={(p) => patch(d.key, p)}
                onRemove={() => setDrafts((ds) => ds.filter((x) => x.key !== d.key))}
              />
            ))}
          </div>

          {topError && (
            <p className="mt-3 text-xs text-rose-500 bg-rose-50 rounded-xl px-4 py-2.5">
              {topError}
            </p>
          )}

          <div className="flex items-center justify-between gap-3 mt-4 pt-4 border-t border-[var(--border)]">
            <p className="text-xs text-[var(--muted)]">
              Sẽ lưu <b className="text-[var(--foreground)]">{readyCount}</b> hoá đơn hợp lệ
              {drafts.length - readyCount > 0 &&
                ` · bỏ qua ${drafts.length - readyCount} (lỗi/thiếu)`}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="h-11 px-5 rounded-2xl border border-[var(--border)] text-sm font-semibold text-[var(--muted)] hover:bg-[var(--primary-soft)]"
              >
                Huỷ
              </button>
              <button
                type="button"
                disabled={saving || processing || readyCount === 0}
                onClick={saveAll}
                className="h-11 px-6 rounded-2xl bg-[var(--primary)] text-white text-sm font-semibold hover:bg-[var(--primary-deep)] shadow-md shadow-[var(--primary)]/25 disabled:opacity-50 flex items-center gap-2"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {saving ? "Đang lưu..." : `Lưu tất cả (${readyCount})`}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mt-4 flex items-start gap-3 p-3 bg-[var(--accent-soft)] rounded-2xl">
        <Sparkles className="w-4 h-4 text-[var(--accent)] mt-0.5 shrink-0" />
        <p className="text-xs text-[var(--muted)]">
          AI bóc tách từng hoá đơn — <b className="text-[var(--foreground)]">kiểm tra & sửa</b> trước khi lưu.
          Hoá đơn mờ có thể sai vài trường.
        </p>
      </div>
    </div>
  );
}

function DraftCard({
  d,
  onChange,
  onRemove,
}: {
  d: Draft;
  onChange: (p: Partial<Draft>) => void;
  onRemove: () => void;
}) {
  const invalid = d.status === "done" && (!d.supplier.trim() || !(Number(d.amount) > 0));
  return (
    <div
      className={cn(
        "rounded-2xl border p-3",
        d.status === "error"
          ? "border-rose-200 bg-rose-50/40"
          : invalid
          ? "border-amber-200 bg-amber-50/40"
          : "border-[var(--border)] bg-white"
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 min-w-0">
          {d.status === "ocr" ? (
            <Loader2 className="w-4 h-4 text-[var(--primary)] animate-spin shrink-0" />
          ) : d.status === "error" ? (
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
          ) : (
            <Check className="w-4 h-4 text-emerald-500 shrink-0" />
          )}
          <span className="text-xs text-[var(--muted)] truncate">{d.fileName}</span>
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="w-7 h-7 rounded-lg hover:bg-[var(--primary-soft)] flex items-center justify-center text-[var(--muted)] shrink-0"
          aria-label="Bỏ"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {d.status === "ocr" ? (
        <p className="text-xs text-[var(--muted)] px-1 py-2">AI đang đọc hoá đơn…</p>
      ) : d.status === "error" ? (
        <p className="text-xs text-rose-500 px-1">{d.error}</p>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <input
            className={cn(input, "col-span-2")}
            placeholder="Nhà cung cấp"
            value={d.supplier}
            onChange={(e) => onChange({ supplier: e.target.value })}
          />
          <input
            className={input}
            placeholder="Số HĐ"
            value={d.code}
            onChange={(e) => onChange({ code: e.target.value })}
          />
          <input
            className={input}
            type="date"
            value={d.date}
            onChange={(e) => onChange({ date: e.target.value })}
          />
          <input
            className={input}
            type="number"
            placeholder="Giá trị trước VAT"
            value={d.amount}
            onChange={(e) => onChange({ amount: e.target.value })}
          />
          <CustomSelect
            value={d.vatRate}
            onChange={(v) => onChange({ vatRate: v })}
            options={vatOptions}
          />
          <CustomSelect
            value={d.category}
            onChange={(v) => onChange({ category: v })}
            options={categoryOptions}
          />
          <CustomSelect
            value={d.invStatus}
            onChange={(v) => onChange({ invStatus: v })}
            options={statusOptions}
          />
        </div>
      )}
    </div>
  );
}
