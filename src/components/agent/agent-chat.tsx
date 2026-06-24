"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bot, X, Send, Loader2, Check, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatFullVND, cn } from "@/lib/utils";

type Action = { name: string; args: Record<string, unknown> };
type Item =
  | { role: "user" | "assistant"; content: string }
  | { role: "confirm"; action: Action; done?: "ok" | "cancel" };

const SUGGESTIONS = [
  "Tháng này lãi bao nhiêu?",
  "Ai đang nợ quá hạn nhiều nhất?",
  "Cần bao nhiêu hoá đơn để cân thuế?",
  "Top khách hàng theo doanh thu",
];

const VALID_CAT = ["saas", "marketing", "travel", "office", "fnb", "logistics", "freelancer", "other"];

export function AgentChat() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Item[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [items, loading]);

  async function send(text: string) {
    const q = text.trim();
    if (!q || loading) return;
    setInput("");
    const next: Item[] = [...items, { role: "user", content: q }];
    setItems(next);
    setLoading(true);
    try {
      const history = next
        .filter((m): m is { role: "user" | "assistant"; content: string } => m.role === "user" || m.role === "assistant")
        .map((m) => ({ role: m.role, content: m.content }));
      const r = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history }),
      });
      const data = await r.json();
      if (data.type === "confirm") {
        setItems((s) => [...s, { role: "confirm", action: data.action }]);
      } else {
        setItems((s) => [...s, { role: "assistant", content: data.content || "(không có nội dung)" }]);
      }
    } catch (e) {
      setItems((s) => [...s, { role: "assistant", content: "Lỗi kết nối: " + (e as Error).message }]);
    } finally {
      setLoading(false);
    }
  }

  async function confirmAction(idx: number, action: Action) {
    const supabase = createClient();
    const a = action.args;
    const today = new Date().toISOString().slice(0, 10);
    let ok = false;
    let label = "";
    try {
      if (action.name === "propose_add_expense") {
        const cat = VALID_CAT.includes(String(a.category)) ? String(a.category) : "other";
        const { error } = await supabase.from("invoices_in").insert({
          supplier_name: String(a.supplier_name || "").trim(),
          amount: Number(a.amount || 0),
          vat_rate: Number(a.vat_rate ?? 10),
          category: cat as never,
          status: "missing",
          invoice_date: today,
          note: a.note ? String(a.note) : null,
        });
        ok = !error;
        label = `chi phí ${formatFullVND(Number(a.amount || 0))} cho ${a.supplier_name}`;
      } else if (action.name === "propose_add_revenue") {
        const { error } = await supabase.from("invoices_out").insert({
          company_name: String(a.company_name || "").trim(),
          amount: Number(a.amount || 0),
          vat_rate: Number(a.vat_rate ?? 10),
          status: "pending",
          invoice_date: today,
          note: a.note ? String(a.note) : null,
        });
        ok = !error;
        label = `doanh thu ${formatFullVND(Number(a.amount || 0))} từ ${a.company_name}`;
      }
    } catch {
      ok = false;
    }
    setItems((s) => s.map((it, i) => (i === idx ? { ...(it as Extract<Item, { role: "confirm" }>), done: ok ? "ok" : "cancel" } : it)));
    setItems((s) => [...s, { role: "assistant", content: ok ? `✅ Đã thêm ${label}.` : "❌ Lưu thất bại, thử lại sau." }]);
    if (ok) router.refresh();
  }

  function cancelAction(idx: number) {
    setItems((s) => s.map((it, i) => (i === idx ? { ...(it as Extract<Item, { role: "confirm" }>), done: "cancel" } : it)));
    setItems((s) => [...s, { role: "assistant", content: "Đã huỷ, không lưu gì." }]);
  }

  return (
    <>
      {/* Launcher */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Trợ lý AI"
        className="fixed bottom-5 right-[88px] z-40 w-14 h-14 rounded-full shadow-xl flex items-center justify-center text-white bg-gradient-to-br from-indigo-500 to-violet-600 hover:scale-105 transition-transform"
      >
        {open ? <X className="w-6 h-6" /> : <Bot className="w-6 h-6" />}
      </button>

      {open && (
        <div className="fixed bottom-24 right-5 z-40 w-[min(92vw,380px)] h-[min(70vh,560px)] bg-white rounded-[24px] shadow-2xl border border-[var(--border)] flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-2.5 px-4 py-3 border-b border-[var(--border)] bg-gradient-to-r from-indigo-500 to-violet-600 text-white">
            <Sparkles className="w-5 h-5" />
            <div className="min-w-0">
              <p className="font-bold text-sm leading-tight">Trợ lý tài chính</p>
              <p className="text-[11px] text-white/80">Hỏi số liệu thật · Groq Llama</p>
            </div>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3">
            {items.length === 0 && (
              <div className="text-center mt-4">
                <Bot className="w-10 h-10 mx-auto text-[var(--primary)] mb-2" />
                <p className="text-sm text-[var(--muted)] mb-3">Hỏi mình về tài chính của bạn:</p>
                <div className="flex flex-col gap-2">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => send(s)}
                      className="text-left text-sm px-3 py-2 rounded-xl bg-[var(--primary-soft)]/60 text-[var(--foreground)] hover:bg-[var(--primary-soft)]"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {items.map((it, i) => {
              if (it.role === "confirm") {
                const a = it.action.args;
                const isExp = it.action.name === "propose_add_expense";
                return (
                  <div key={i} className="rounded-2xl border border-amber-200 bg-amber-50/70 p-3 text-sm">
                    <p className="font-semibold text-amber-800 mb-1">Xác nhận thêm dữ liệu</p>
                    <p className="text-amber-900">
                      {isExp ? "Chi phí" : "Doanh thu"}:{" "}
                      <b>{formatFullVND(Number(a.amount || 0))}</b>{" "}
                      {isExp ? `cho NCC ${a.supplier_name}` : `từ KH ${a.company_name}`}
                      {a.category ? ` · ${a.category}` : ""}
                    </p>
                    {!it.done ? (
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => confirmAction(i, it.action)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[var(--primary)] text-white text-xs font-semibold"
                        >
                          <Check className="w-3.5 h-3.5" /> Xác nhận lưu
                        </button>
                        <button
                          onClick={() => cancelAction(i)}
                          className="px-3 py-1.5 rounded-xl border border-[var(--border)] text-xs font-semibold text-[var(--muted)]"
                        >
                          Huỷ
                        </button>
                      </div>
                    ) : (
                      <p className="text-xs mt-1 text-[var(--muted)]">{it.done === "ok" ? "Đã lưu ✓" : "Đã huỷ"}</p>
                    )}
                  </div>
                );
              }
              return (
                <div key={i} className={cn("flex", it.role === "user" ? "justify-end" : "justify-start")}>
                  <div
                    className={cn(
                      "max-w-[85%] px-3 py-2 rounded-2xl text-sm whitespace-pre-wrap",
                      it.role === "user"
                        ? "bg-[var(--primary)] text-white rounded-br-md"
                        : "bg-[var(--primary-soft)]/60 text-[var(--foreground)] rounded-bl-md"
                    )}
                  >
                    {it.content}
                  </div>
                </div>
              );
            })}

            {loading && (
              <div className="flex justify-start">
                <div className="px-3 py-2 rounded-2xl bg-[var(--primary-soft)]/60 text-[var(--muted)] flex items-center gap-2 text-sm">
                  <Loader2 className="w-4 h-4 animate-spin" /> Đang tra cứu...
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="p-2.5 border-t border-[var(--border)] flex items-center gap-2"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Hỏi về tài chính..."
              className="flex-1 bg-[var(--primary-soft)]/40 rounded-xl px-3 h-10 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="w-10 h-10 rounded-xl bg-[var(--primary)] text-white flex items-center justify-center disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
