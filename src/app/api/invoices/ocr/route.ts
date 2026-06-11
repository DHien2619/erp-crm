import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

const CATEGORIES = [
  "saas",
  "marketing",
  "travel",
  "office",
  "fnb",
  "logistics",
  "freelancer",
  "other",
];

const MEDIA = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
]);

// Gemini responseSchema (OpenAPI subset: type chữ HOA).
const SCHEMA = {
  type: "OBJECT",
  properties: {
    supplier_name: { type: "STRING", description: "Tên nhà cung cấp / người bán" },
    code: { type: "STRING", description: "Số/ký hiệu hoá đơn, rỗng nếu không có" },
    invoice_date: { type: "STRING", description: "Ngày phát hành YYYY-MM-DD, rỗng nếu không rõ" },
    amount: { type: "NUMBER", description: "Giá trị TRƯỚC VAT, đơn vị VND, chỉ số" },
    vat_rate: { type: "INTEGER", description: "Thuế suất VAT %: 0, 5, 8 hoặc 10. Không thấy thì 10." },
    category: {
      type: "STRING",
      enum: CATEGORIES,
      description:
        "saas=phần mềm, marketing=quảng cáo, travel=đi lại, office=văn phòng, fnb=ăn uống, logistics=vận chuyển, freelancer=thuê ngoài, other=khác",
    },
    confidence: { type: "NUMBER", description: "Độ tự tin 0..1" },
  },
  required: ["supplier_name", "amount", "vat_rate", "category"],
};

const PROMPT =
  "Đây là một hoá đơn (Việt Nam hoặc nước ngoài). Bóc tách các trường theo schema JSON. " +
  "amount là giá TRƯỚC thuế VAT, quy về số VND (bỏ dấu phẩy/chấm ngăn cách). " +
  "Nếu là ngoại tệ thì giữ nguyên con số gốc. Chỉ trả về JSON đúng schema.";

/** POST /api/invoices/ocr — bóc tách hoá đơn từ ảnh/PDF bằng Google Gemini (free tier).
 *  Body JSON: { media_type, data (base64) }. Same-origin (nút app) hoặc header x-sync-secret. */
export async function POST(req: Request) {
  const secret = process.env.SYNC_SECRET;
  if (secret) {
    const provided = req.headers.get("x-sync-secret");
    const sameOrigin = req.headers.get("sec-fetch-site") === "same-origin";
    if (provided !== secret && !sameOrigin) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
  }

  const apiKey = process.env.GEMINI_API_KEY?.trim().replace(/[^\x21-\x7e]/g, "");
  if (!apiKey) {
    return NextResponse.json(
      { ok: false, error: "Chưa cấu hình GEMINI_API_KEY." },
      { status: 503 }
    );
  }

  let body: { media_type?: string; data?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Body không hợp lệ." }, { status: 400 });
  }
  const mediaType = body.media_type ?? "";
  const data = body.data ?? "";
  if (!data || !MEDIA.has(mediaType)) {
    return NextResponse.json(
      { ok: false, error: "Thiếu ảnh hoặc định dạng không hỗ trợ (JPG/PNG/WebP/PDF)." },
      { status: 400 }
    );
  }

  const model =
    (process.env.GEMINI_MODEL || "gemini-2.5-flash").trim().replace(/[^\x21-\x7e]/g, "");
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { inline_data: { mime_type: mediaType, data } },
              { text: PROMPT },
            ],
          },
        ],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: SCHEMA,
        },
      }),
    });

    const json = (await res.json().catch(() => ({}))) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
      error?: { message?: string };
    };
    if (!res.ok) {
      return NextResponse.json(
        { ok: false, error: `Gemini ${res.status}: ${json.error?.message ?? res.statusText}` },
        { status: 502 }
      );
    }

    const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      return NextResponse.json({ ok: false, error: "AI không trả về dữ liệu." }, { status: 502 });
    }
    const fields = JSON.parse(text);
    return NextResponse.json({ ok: true, fields });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: (e as Error).message },
      { status: 500 }
    );
  }
}
