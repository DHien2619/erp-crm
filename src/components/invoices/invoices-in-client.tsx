"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Topbar } from "@/components/topbar";
import { InvoicesInStats } from "@/components/invoices/in-stats";
import { InvoicesInToolbar, type StatusFilter, type AdvFilter } from "@/components/invoices/in-toolbar";
import { InvoicesInTable } from "@/components/invoices/in-table";
import { AddInvoiceModal } from "@/components/invoices/add-invoice-modal";
import { createClient } from "@/lib/supabase/client";
import { type InvoiceIn, type InvoiceCategory } from "@/lib/mock-data";
import type { InvoicesInPage, InvoicesInStats as Stats, InvoicesInQuery } from "@/lib/data";

export function InvoicesInClient({
  data,
  stats,
  initial,
}: {
  data: InvoicesInPage;
  stats: Stats;
  initial: InvoicesInQuery;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [query, setQuery] = useState(initial.q ?? "");
  const [status, setStatus] = useState<StatusFilter>((initial.status as StatusFilter) ?? "all");
  const [category, setCategory] = useState<InvoiceCategory | "all">(
    (initial.category as InvoiceCategory | "all") ?? "all"
  );
  const [adv, setAdv] = useState<AdvFilter>({
    from: initial.from ?? "",
    to: initial.to ?? "",
    min: initial.min ?? "",
    max: initial.max ?? "",
  });
  const [modal, setModal] = useState<{ editing?: InvoiceIn } | null>(null);

  // Tạo URL từ state hiện tại (đổi bộ lọc -> luôn về trang 1)
  function buildUrl(page = 1) {
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (status !== "all") params.set("status", status);
    if (category !== "all") params.set("category", category);
    if (adv.from) params.set("from", adv.from);
    if (adv.to) params.set("to", adv.to);
    if (adv.min) params.set("min", adv.min);
    if (adv.max) params.set("max", adv.max);
    if (page > 1) params.set("page", String(page));
    const qs = params.toString();
    return `/invoices/in${qs ? `?${qs}` : ""}`;
  }

  // Đổi bộ lọc -> điều hướng server (debounce gộp gõ phím + đổi nhanh)
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const t = setTimeout(() => startTransition(() => router.replace(buildUrl(1))), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, status, category, adv]);

  async function handleDelete(r: InvoiceIn) {
    if (!confirm(`Xoá hoá đơn của "${r.supplier}"?`)) return;
    await createClient().from("invoices_in").delete().eq("id", r.id);
    router.refresh();
  }

  async function handleToggle(r: InvoiceIn) {
    const next = r.status === "matched" ? "missing" : "matched";
    await createClient().from("invoices_in").update({ status: next }).eq("id", r.id);
    router.refresh();
  }

  const totalPages = Math.max(1, Math.ceil(data.total / data.pageSize));

  return (
    <>
      <Topbar title="Hoá đơn đầu vào" subtitle="Quản lý chi phí" />

      <InvoicesInStats stats={stats} />

      <InvoicesInToolbar
        query={query}
        onQuery={setQuery}
        status={status}
        onStatus={setStatus}
        category={category}
        onCategory={setCategory}
        onAdd={() => setModal({})}
        adv={adv}
        onAdv={setAdv}
      />

      <div className={isPending ? "opacity-50 transition-opacity pointer-events-none" : "transition-opacity"}>
        <InvoicesInTable
          rows={data.rows}
          total={data.total}
          page={data.page}
          totalPages={totalPages}
          onPage={(p) => startTransition(() => router.push(buildUrl(p)))}
          onEdit={(r) => setModal({ editing: r })}
          onDelete={handleDelete}
          onToggleStatus={handleToggle}
        />
      </div>

      {modal && (
        <AddInvoiceModal open editing={modal.editing} onClose={() => setModal(null)} />
      )}
    </>
  );
}
