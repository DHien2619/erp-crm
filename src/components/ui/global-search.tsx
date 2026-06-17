"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, FileText, Users, Building2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatVND, cn } from "@/lib/utils";

type Result = {
  kind: "invoice" | "customer" | "supplier";
  title: string;
  sub: string;
  href: string;
};

export function GlobalSearch() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<Result[]>([]);
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, [open]);

  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) {
      setResults([]);
      return;
    }
    let cancelled = false;
    const t = setTimeout(async () => {
      const supabase = createClient();
      const like = `%${term}%`;
      const [inv, cus, sup] = await Promise.all([
        supabase.from("invoices_in").select("id, supplier_name, code, amount").or(`supplier_name.ilike.${like},code.ilike.${like}`).limit(5),
        supabase.from("companies").select("id, name, tax_code").ilike("name", like).limit(4),
        supabase.from("suppliers").select("id, name").ilike("name", like).limit(4),
      ]);
      if (cancelled) return;
      const out: Result[] = [];
      for (const r of inv.data ?? [])
        out.push({ kind: "invoice", title: r.supplier_name, sub: `HĐ #${r.code || "—"} · ${formatVND(Number(r.amount))}`, href: "/invoices/in" });
      for (const r of cus.data ?? [])
        out.push({ kind: "customer", title: r.name, sub: `Khách hàng · MST ${r.tax_code || "—"}`, href: "/customers" });
      for (const r of sup.data ?? [])
        out.push({ kind: "supplier", title: r.name, sub: "Nhà cung cấp", href: "/suppliers" });
      setResults(out);
      setOpen(true);
    }, 200);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [q]);

  const icon = {
    invoice: <FileText className="w-4 h-4" />,
    customer: <Users className="w-4 h-4" />,
    supplier: <Building2 className="w-4 h-4" />,
  };

  return (
    <div className="relative" ref={ref}>
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-soft)]" />
      <input
        ref={inputRef}
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onFocus={() => results.length && setOpen(true)}
        placeholder="Tìm hoá đơn, khách, NCC...  (Ctrl+K)"
        className="bg-white pl-11 pr-4 h-11 w-72 rounded-2xl text-sm border border-[var(--border)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 placeholder:text-[var(--muted-soft)]"
      />

      {open && q.trim().length >= 2 && (
        <div className="absolute left-0 mt-2 w-96 max-w-[90vw] bg-white rounded-2xl shadow-xl border border-[var(--border)] p-1.5 z-40 max-h-96 overflow-y-auto">
          {results.length === 0 && (
            <p className="text-sm text-[var(--muted)] text-center py-6">Không tìm thấy “{q}”.</p>
          )}
          {results.map((r, i) => (
            <button
              key={i}
              onClick={() => {
                setOpen(false);
                setQ("");
                router.push(r.href);
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[var(--primary-soft)]/50 transition-colors text-left"
            >
              <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-[var(--primary-soft)] text-[var(--primary)]")}>
                {icon[r.kind]}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[var(--foreground)] truncate">{r.title}</p>
                <p className="text-[11px] text-[var(--muted)] truncate">{r.sub}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
