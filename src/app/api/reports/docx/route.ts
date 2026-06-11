import { getReportData, normalizePeriod } from "@/lib/reports/report-data";
import { buildReportDocxBuffer } from "@/lib/reports/docx-builder";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

/** GET /api/reports/docx?period=month|quarter|year — xuất báo cáo tài chính ra file Word.
 *  Bấm nút trong app (same-origin) được phép; gọi ngoài cần header x-sync-secret. */
export async function GET(req: Request) {
  const secret = process.env.SYNC_SECRET;
  if (secret) {
    const provided = req.headers.get("x-sync-secret");
    const sameOrigin = req.headers.get("sec-fetch-site") === "same-origin";
    if (provided !== secret && !sameOrigin) {
      return new Response(JSON.stringify({ ok: false, error: "Unauthorized" }), {
        status: 401,
        headers: { "content-type": "application/json" },
      });
    }
  }

  const url = new URL(req.url);
  const period = normalizePeriod(url.searchParams.get("period"));
  const data = await getReportData(period);
  const buffer = await buildReportDocxBuffer(data);
  const fileName = `Bao-cao-tai-chinh-AIECOS-${period}-${data.dateStr.replace(/\//g, "-")}.docx`;

  return new Response(new Blob([buffer]), {
    status: 200,
    headers: {
      "content-type":
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "content-disposition": `attachment; filename="${fileName}"`,
      "cache-control": "no-store",
    },
  });
}
