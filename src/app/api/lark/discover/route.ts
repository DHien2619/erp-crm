import { NextResponse } from "next/server";
import { larkListTables, larkListFields, larkListRecords } from "@/lib/lark/client";

export const dynamic = "force-dynamic";

/**
 * GET /api/lark/discover            -> liệt kê tất cả bảng trong Base
 * GET /api/lark/discover?table=tblX -> field + 1 record mẫu của bảng đó
 * Dùng để map Bitable -> shape website. Xoá route này sau khi map xong.
 */
export async function GET(req: Request) {
  try {
    const table = new URL(req.url).searchParams.get("table");
    if (!table) {
      const tables = await larkListTables();
      return NextResponse.json({ ok: true, count: tables.length, tables });
    }
    const [fields, records] = await Promise.all([
      larkListFields(table),
      larkListRecords(table),
    ]);
    return NextResponse.json({
      ok: true,
      table,
      fieldCount: fields.length,
      fields: fields.map((f) => f.field_name),
      recordCount: records.length,
      sample: records[0]?.fields ?? null,
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: (e as Error).message },
      { status: 500 }
    );
  }
}
