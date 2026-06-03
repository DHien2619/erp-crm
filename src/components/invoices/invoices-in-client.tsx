"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Topbar } from "@/components/topbar";
import { InvoicesInStats } from "@/components/invoices/in-stats";
import { InvoicesInToolbar, type StatusFilter, type AdvFilter, emptyAdv } from "@/components/invoices/in-toolbar";
import { InvoicesInTable } from "@/components/invoices/in-table";
import { AddInvoiceModal } from "@/components/invoices/add-invoice-modal";
import { createClient } from "@/lib/supabase/client";
import { type InvoiceIn, type InvoiceCategory } from "@/lib/mock-data";

const PAGE_SIZE = 12;

export function InvoicesInClient({ invoices }: { invoices: InvoiceIn[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [category, setCategory] = useState<InvoiceCategory | "all">("all");
  const [adv, setAdv] = useState<AdvFilter>(emptyAdv);
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState<{ editing?: InvoiceIn } | null>(null);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const min = adv.min ? Number(adv.min) : null;
    const max = adv.max ? Number(adv.max) : null;
    return invoices.filter((i) => {
      if (status !== "all" && i.status !== status) return false;
      if (category !== "all" && i.category !== category) return false;
      if (q && !i.supplier.toLowerCase().includes(q) && !i.code.toLowerCase().includes(q)) return false;
      if (adv.from && (!i.date || i.date < adv.from)) return false;
      if (adv.to && (!i.date || i.date > adv.to)) return false;
      if (min !== null && i.amount < min) return false;
      if (max !== null && i.amount > max) return false;
      return true;
    });
  }, [invoices, query, status, category, adv]);

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pagedRows = rows.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  // reset về trang 1 khi đổi bộ lọc
  function resetPage<T>(setter: (v: T) => void) {
    return (v: T) => {
      setter(v);
      setPage(1);
    };
  }

  async function handleDelete(r: InvoiceIn) {
    if (!confirm(`Xoá hoá đơn của "${r.supplier}"?`)) return;
    const supabase = createClient();
    await supabase.from("invoices_in").delete().eq("id", r.id);
    router.refresh();
  }

  async function handleToggle(r: InvoiceIn) {
    const next = r.status === "matched" ? "missing" : "matched";
    const supabase = createClient();
    await supabase.from("invoices_in").update({ status: next }).eq("id", r.id);
    router.refresh();
  }

  return (
    <>
      <Topbar title="Hoá đơn đầu vào" subtitle="Quản lý chi phí" />

      <InvoicesInStats invoices={invoices} />

      <InvoicesInToolbar
        query={query}
        onQuery={resetPage(setQuery)}
        status={status}
        onStatus={resetPage(setStatus)}
        category={category}
        onCategory={resetPage(setCategory)}
        onAdd={() => setModal({})}
        adv={adv}
        onAdv={resetPage(setAdv)}
      />

      <InvoicesInTable
        rows={pagedRows}
        total={rows.length}
        page={safePage}
        totalPages={totalPages}
        onPage={setPage}
        onEdit={(r) => setModal({ editing: r })}
        onDelete={handleDelete}
        onToggleStatus={handleToggle}
      />

      {modal && (
        <AddInvoiceModal
          open
          editing={modal.editing}
          onClose={() => setModal(null)}
        />
      )}
    </>
  );
}
