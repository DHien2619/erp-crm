import { NextResponse } from "next/server";
import Groq from "groq-sdk";
import { createClient } from "@/lib/supabase/server";
import type { ActivityLog } from "@/lib/database.types";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const MODEL = "llama-3.3-70b-versatile";

export async function POST() {
  const key = process.env.GROQ_API_KEY?.replace(/[^\x21-\x7e]/g, "");
  if (!key) {
    return NextResponse.json({ type: "error", content: "Chưa cấu hình GROQ_API_KEY." });
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("activity_log")
    .select("question, answer, tools, user_email, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  const rows = (data ?? []) as Partial<ActivityLog>[];
  if (rows.length === 0) {
    return NextResponse.json({ type: "message", content: "Chưa có hoạt động nào để tổng hợp. Hãy hỏi Trợ lý AI vài câu trước." });
  }

  const log = rows
    .map((r, i) => `${i + 1}. [${r.created_at?.slice(0, 16).replace("T", " ")}] ${r.user_email ?? "?"} hỏi: "${r.question}" → ${r.answer}`)
    .join("\n");

  const groq = new Groq({ apiKey: key });
  try {
    const res = await groq.chat.completions.create({
      model: MODEL,
      temperature: 0.4,
      max_tokens: 900,
      messages: [
        {
          role: "system",
          content:
            "Bạn là trợ lý phân tích. Dưới đây là NHẬT KÝ các câu nhân viên hỏi Trợ lý AI trong phần mềm ERP. Hãy viết BÁO CÁO TỔNG HỢP ngắn gọn bằng tiếng Việt gồm: (1) Tổng số lượt & khoảng thời gian, (2) Các CHỦ ĐỀ chính được quan tâm (gom nhóm), (3) Nhu cầu/vấn đề nổi bật, (4) Gợi ý cho quản lý. Dùng gạch đầu dòng, có số liệu, không bịa.",
        },
        { role: "user", content: log },
      ],
    });
    return NextResponse.json({
      type: "message",
      content: res.choices[0]?.message?.content ?? "Không tạo được báo cáo.",
      count: rows.length,
    });
  } catch (e) {
    return NextResponse.json({ type: "error", content: "Lỗi tạo báo cáo: " + (e as Error).message });
  }
}
