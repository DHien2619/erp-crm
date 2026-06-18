import * as Sentry from "@sentry/nextjs";
import { createClient } from "@/lib/supabase/client";

/**
 * Ghi lỗi production vào bảng error_logs (best-effort).
 * Không bao giờ throw — lỗi khi ghi log cũng bị nuốt để không vỡ thêm.
 * Cần bảng error_logs (xem supabase/migration_perf.sql). Nếu bảng chưa có thì bỏ qua.
 */
export async function logError(err: unknown, context: Record<string, unknown> = {}) {
  try {
    const e = err as { message?: string; stack?: string };
    const payload = {
      message: e?.message ? String(e.message).slice(0, 1000) : String(err).slice(0, 1000),
      stack: e?.stack ? String(e.stack).slice(0, 4000) : null,
      context,
      url: typeof window !== "undefined" ? window.location.href : null,
      user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
    };
    // ghi console để xem nhanh trong Vercel logs / devtools
    if (typeof console !== "undefined") console.error("[ERP error]", payload.message, context);
    // gửi Sentry (no-op nếu chưa cấu hình DSN)
    Sentry.captureException(err, { extra: context });
    await createClient().from("error_logs").insert(payload);
  } catch {
    // nuốt — không để việc ghi log gây lỗi tiếp
  }
}
