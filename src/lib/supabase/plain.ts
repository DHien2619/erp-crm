import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

/**
 * Client Supabase THUẦN (không đọc cookie) — dùng được bên trong unstable_cache.
 * App chưa có Auth nên anon key + không cookie là đủ cho truy vấn đọc.
 */
export function createPlainClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } }
  );
}
