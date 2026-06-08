"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, CheckCircle2, AlertTriangle, Database } from "lucide-react";
import { cn } from "@/lib/utils";

type State =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "done"; counts: Record<string, number> }
  | { kind: "error"; msg: string };

const LABELS: Record<string, string> = {
  invoices_in: "Hoá đơn đầu vào",
  invoices_out: "Doanh thu",
  expenses: "Chi phí",
  suppliers: "Nhà cung cấp",
  companies: "Khách hàng",
  cost_centers: "Trung tâm chi phí",
  bank_accounts: "Tài khoản NH",
  advances: "Tạm ứng",
};

export function LarkSyncCard() {
  const router = useRouter();
  const [state, setState] = useState<State>({ kind: "idle" });

  async function sync() {
    setState({ kind: "loading" });
    try {
      const res = await fetch("/api/lark/sync", { method: "POST" });
      const data = await res.json();
      if (!data.ok) {
        setState({ kind: "error", msg: data.error || "Lỗi không xác định" });
        return;
      }
      setState({ kind: "done", counts: data.counts ?? {} });
      router.refresh();
    } catch (e) {
      setState({ kind: "error", msg: (e as Error).message });
    }
  }

  return (
    <div className="card-soft p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-[var(--primary)]" />
          <h3 className="font-bold text-[var(--foreground)]">Đồng bộ từ Lark</h3>
        </div>
        <button
          onClick={sync}
          disabled={state.kind === "loading"}
          className="h-10 px-4 rounded-2xl bg-[var(--primary)] text-white font-semibold text-sm flex items-center gap-2 hover:bg-[var(--primary-deep)] transition-colors disabled:opacity-60"
        >
          <RefreshCw className={cn("w-4 h-4", state.kind === "loading" && "animate-spin")} />
          {state.kind === "loading" ? "Đang đồng bộ..." : "Đồng bộ ngay"}
        </button>
      </div>

      <p className="text-xs text-[var(--muted)] leading-relaxed mb-4">
        Kéo dữ liệu mới nhất từ Lark Base "Quản trị tài chính" về (1 chiều: Lark → web).
        Toàn bộ số liệu trên web sẽ được cập nhật khớp Lark. Nhập liệu vẫn làm ở Lark.
      </p>

      {state.kind === "done" && (
        <div className="flex items-start gap-3 p-3 rounded-2xl bg-emerald-50">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
          <div className="text-xs">
            <p className="font-semibold text-emerald-700 mb-1">Đồng bộ xong</p>
            <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-[var(--muted)]">
              {Object.entries(state.counts).map(([k, v]) => (
                <span key={k}>
                  {LABELS[k]}: <b className="text-[var(--foreground)]">{v}</b>
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {state.kind === "error" && (
        <div className="flex items-start gap-3 p-3 rounded-2xl bg-rose-50">
          <AlertTriangle className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
          <div className="text-xs">
            <p className="font-semibold text-rose-600 mb-0.5">Chưa đồng bộ được</p>
            <p className="text-[var(--muted)] break-words">{state.msg}</p>
            <p className="text-[var(--muted-soft)] mt-1">
              (Thường do scope Lark chưa được admin duyệt — duyệt xong thử lại.)
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
