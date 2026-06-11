import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** SePay payload (https://docs.sepay.vn/tich-hop-webhooks.html) */
type SePayPayload = {
  id?: number;
  gateway?: string;
  transactionDate?: string;
  accountNumber?: string;
  subAccount?: string | null;
  code?: string | null;
  content?: string;
  transferType?: "in" | "out";
  transferAmount?: number;
  accumulated?: number;
  referenceCode?: string;
  description?: string;
};

/** "2023-03-25 14:02:37" (giờ VN) -> ISO. */
function toISO(s?: string): string | null {
  if (!s) return null;
  const d = new Date(s.replace(" ", "T") + "+07:00");
  return isNaN(d.getTime()) ? null : d.toISOString();
}

/** POST /api/sepay/webhook — nhận biến động số dư từ SePay, ghi vào bank_transactions.
 *  Xác thực: SePay gửi header `Authorization: Apikey <SEPAY_WEBHOOK_APIKEY>`. */
export async function POST(req: Request) {
  const key = process.env.SEPAY_WEBHOOK_APIKEY?.trim();
  if (key) {
    const auth = req.headers.get("authorization") || "";
    if (auth !== `Apikey ${key}` && auth !== `Bearer ${key}`) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
  }

  let p: SePayPayload;
  try {
    p = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "Bad JSON" }, { status: 400 });
  }

  const content = (p.content || p.description || "").trim() || null;
  const row = {
    sepay_id: p.id ?? null,
    gateway: p.gateway ?? null,
    account_number: p.accountNumber ?? null,
    sub_account: p.subAccount ?? null,
    txn_date: toISO(p.transactionDate),
    amount: Number(p.transferAmount) || 0,
    direction: (p.transferType === "out" ? "out" : "in") as "in" | "out",
    content,
    counterparty: null as string | null, // để dành: parse/AI enrich sau
    accumulated: p.accumulated != null ? Number(p.accumulated) : null,
    reference_code: p.referenceCode ?? null,
    code: p.code ?? null,
    raw: p as Record<string, unknown>,
  };

  try {
    const supabase = await createClient();
    // upsert theo sepay_id để chống trùng khi SePay retry.
    const { error } = await supabase
      .from("bank_transactions")
      .upsert(row, { onConflict: "sepay_id", ignoreDuplicates: true });
    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ success: false, error: (e as Error).message }, { status: 500 });
  }
}
