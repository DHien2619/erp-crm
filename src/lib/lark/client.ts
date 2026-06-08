// Lark (larksuite quốc tế) — đọc Bitable trực tiếp, CHẠY SERVER-SIDE.
// App Secret chỉ nằm trong env server, KHÔNG bao giờ ra client.

const LARK_HOST = "https://open.larksuite.com";

type LarkRecord = { record_id: string; fields: Record<string, unknown> };

let cached: { token: string; exp: number } | null = null;

export async function getLarkToken(): Promise<string> {
  if (cached && cached.exp > Date.now() + 60_000) return cached.token;
  const res = await fetch(
    `${LARK_HOST}/open-apis/auth/v3/tenant_access_token/internal`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        app_id: process.env.LARK_APP_ID,
        app_secret: process.env.LARK_APP_SECRET,
      }),
      cache: "no-store",
    }
  );
  const data = await res.json();
  if (data.code !== 0) throw new Error(`Lark token error ${data.code}: ${data.msg}`);
  cached = {
    token: data.tenant_access_token,
    exp: Date.now() + (data.expire - 120) * 1000,
  };
  return cached.token;
}

async function larkGet<T>(path: string): Promise<T> {
  const token = await getLarkToken();
  const res = await fetch(`${LARK_HOST}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  const data = await res.json();
  if (data.code !== 0) throw new Error(`Lark API ${data.code}: ${data.msg}`);
  return data.data as T;
}

/** Liệt kê các bảng (table) trong Base */
export async function larkListTables(): Promise<{ table_id: string; name: string }[]> {
  const app = process.env.LARK_BASE_TOKEN;
  const data = await larkGet<{ items: { table_id: string; name: string }[] }>(
    `/open-apis/bitable/v1/apps/${app}/tables?page_size=100`
  );
  return data.items ?? [];
}

/** Liệt kê field (cột) của 1 bảng */
export async function larkListFields(
  tableId: string
): Promise<{ field_name: string; type: number }[]> {
  const app = process.env.LARK_BASE_TOKEN;
  const data = await larkGet<{ items: { field_name: string; type: number }[] }>(
    `/open-apis/bitable/v1/apps/${app}/tables/${tableId}/fields?page_size=200`
  );
  return data.items ?? [];
}

/** Lấy toàn bộ record của 1 bảng (tự phân trang) */
export async function larkListRecords(tableId: string): Promise<LarkRecord[]> {
  const app = process.env.LARK_BASE_TOKEN;
  const out: LarkRecord[] = [];
  let pageToken: string | undefined;
  do {
    const qs = new URLSearchParams({ page_size: "500" });
    if (pageToken) qs.set("page_token", pageToken);
    const data = await larkGet<{
      items: LarkRecord[];
      has_more: boolean;
      page_token?: string;
    }>(`/open-apis/bitable/v1/apps/${app}/tables/${tableId}/records?${qs}`);
    out.push(...(data.items ?? []));
    pageToken = data.has_more ? data.page_token : undefined;
  } while (pageToken);
  return out;
}
