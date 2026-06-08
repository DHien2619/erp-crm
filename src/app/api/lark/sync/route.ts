import { NextResponse } from "next/server";
import { syncFromLark } from "@/lib/lark/sync";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** POST /api/lark/sync — kéo dữ liệu Lark Base về Supabase (1 chiều).
 *  Bảo vệ: nếu có SYNC_SECRET → caller ngoài (n8n) phải gửi header
 *  `x-sync-secret`. Nút trên web (same-origin) được miễn. */
export async function POST(req: Request) {
  const secret = process.env.SYNC_SECRET;
  if (secret) {
    const provided = req.headers.get("x-sync-secret");
    const sameOrigin = req.headers.get("sec-fetch-site") === "same-origin";
    if (provided !== secret && !sameOrigin) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
  }
  try {
    const result = await syncFromLark();
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: (e as Error).message },
      { status: 500 }
    );
  }
}
