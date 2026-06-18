"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/**
 * Lắng nghe mọi thay đổi (INSERT/UPDATE/DELETE) trên schema public của Supabase
 * và tự gọi router.refresh() — dữ liệu cập nhật realtime, không cần F5.
 * Gộp nhiều sự kiện gần nhau (debounce) để 1 lần sync ghi nhiều dòng chỉ refresh 1 lần.
 * Yêu cầu: đã chạy supabase/realtime.sql để thêm bảng vào publication.
 */
export function RealtimeRefresh() {
  const router = useRouter();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const supabase = createClient();

    const schedule = () => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => router.refresh(), 300);
    };

    const channel = supabase
      .channel("erp-realtime")
      .on("postgres_changes", { event: "*", schema: "public" }, schedule)
      .subscribe();

    return () => {
      if (timer.current) clearTimeout(timer.current);
      supabase.removeChannel(channel);
    };
  }, [router]);

  return null;
}
