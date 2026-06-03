import { AppShell } from "@/components/app-shell";
import { Topbar } from "@/components/topbar";
import { DataTable, type Column } from "@/components/ui/data-table";
import { getPaymentRequests } from "@/lib/data";
import type { PaymentRequest } from "@/lib/database.types";
import { formatVND } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function PaymentRequestsPage() {
  const rows = await getPaymentRequests();
  const cols: Column<PaymentRequest>[] = [
    { key: "code", label: "Mã", render: (r) => <span className="font-mono text-xs text-[var(--muted)]">{r.code || "—"}</span> },
    { key: "date", label: "Ngày", render: (r) => <span className="text-[var(--muted)]">{r.request_date || "—"}</span> },
    { key: "requester", label: "Người yêu cầu", render: (r) => <span className="font-semibold text-[var(--foreground)]">{r.requester || "—"}</span> },
    { key: "supplier", label: "NCC", render: (r) => <span className="text-[var(--muted)]">{r.supplier_name || "—"}</span> },
    { key: "amount", label: "Số tiền", align: "right", render: (r) => <span className="font-semibold">{formatVND(Number(r.amount))}</span> },
    { key: "status", label: "Trạng thái", align: "center", render: (r) => <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-600 whitespace-nowrap">{r.status}</span> },
  ];
  return (
    <AppShell>
      <Topbar title="Yêu cầu thanh toán" subtitle="Đề nghị chi & duyệt" />
      <DataTable columns={cols} rows={rows} empty="Chưa có yêu cầu thanh toán." />
    </AppShell>
  );
}
