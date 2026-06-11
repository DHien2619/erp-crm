import { NextResponse } from "next/server";
import {
  getReportData,
  buildPlainText,
  normalizePeriod,
} from "@/lib/reports/report-data";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

/** POST /api/reports/gdoc?period=month|quarter|year
 *  Dựng nội dung báo cáo rồi gọi webhook n8n (n8n tạo Google Doc qua tài khoản Google
 *  đã kết nối 1-click) và trả về { ok, url }.
 *  Bấm nút trong app (same-origin) được phép; gọi ngoài cần header x-sync-secret. */
export async function POST(req: Request) {
  const secret = process.env.SYNC_SECRET;
  if (secret) {
    const provided = req.headers.get("x-sync-secret");
    const sameOrigin = req.headers.get("sec-fetch-site") === "same-origin";
    if (provided !== secret && !sameOrigin) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
  }

  // Cắt từ "http" để bỏ BOM/whitespace rác có thể dính khi set env qua CLI.
  const rawHook = process.env.N8N_REPORT_WEBHOOK_URL ?? "";
  const i = rawHook.indexOf("http");
  const webhook = i >= 0 ? rawHook.slice(i).trim() : "";
  if (!webhook) {
    return NextResponse.json(
      { ok: false, error: "Chưa cấu hình N8N_REPORT_WEBHOOK_URL." },
      { status: 503 }
    );
  }

  try {
    const url = new URL(req.url);
    const period = normalizePeriod(url.searchParams.get("period"));
    const data = await getReportData(period);
    const content = buildPlainText(data);

    const res = await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: data.title, content }),
    });
    const raw = (await res.text()).trim();
    if (!res.ok) {
      return NextResponse.json(
        { ok: false, error: `n8n trả về lỗi HTTP ${res.status}: ${raw.slice(0, 200)}` },
        { status: 502 }
      );
    }

    // n8n có thể trả: JSON {url|id}, một URL, một docId thuần, hoặc object có id.
    const docUrl = (id: string) => `https://docs.google.com/document/d/${id}/edit`;
    let docLink = "";
    if (raw.startsWith("{") || raw.startsWith("[")) {
      try {
        const j = JSON.parse(raw);
        const o = Array.isArray(j) ? j[0] ?? {} : j;
        docLink = o.url || (o.id ? docUrl(o.id) : o.documentId ? docUrl(o.documentId) : "");
      } catch {
        /* ignore */
      }
    } else if (raw.startsWith("http")) {
      docLink = raw;
    } else if (raw) {
      docLink = docUrl(raw);
    }

    if (!docLink) {
      return NextResponse.json(
        { ok: false, error: `n8n không trả về id/url (body: "${raw.slice(0, 120)}")` },
        { status: 502 }
      );
    }
    return NextResponse.json({ ok: true, url: docLink, title: data.title });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: (e as Error).message },
      { status: 500 }
    );
  }
}
