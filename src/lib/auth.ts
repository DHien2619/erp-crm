import { createClient } from "@/lib/supabase/server";

export type CurrentUser = {
  id: string;
  email: string;
  fullName: string;
  role: string;
} | null;

/** Lấy người dùng + vai trò ở SERVER (đọc từ cookie phiên). null nếu chưa đăng nhập. */
export async function getCurrentUser(): Promise<CurrentUser> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, role")
      .eq("id", user.id)
      .maybeSingle();
    return {
      id: user.id,
      email: user.email ?? "",
      fullName: (profile?.full_name as string) || user.email || "Người dùng",
      role: (profile?.role as string) || "staff",
    };
  } catch {
    return null;
  }
}
