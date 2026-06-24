import { NextResponse } from "next/server";
import Groq from "groq-sdk";
import { AGENT_TOOLS, WRITE_TOOLS, runReadTool } from "@/lib/agent/tools";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const MODEL = "llama-3.3-70b-versatile";

const SYSTEM = `Bạn là "Trợ lý tài chính" của phần mềm ERP-CRM cho công ty AIECOS.
Nhiệm vụ: trả lời câu hỏi về tài chính, công nợ, dự án, thuế DỰA TRÊN DỮ LIỆU THẬT lấy qua các tool.
Quy tắc:
- Luôn trả lời bằng tiếng Việt, ngắn gọn, có số liệu cụ thể.
- Định dạng tiền theo kiểu Việt Nam (vd 48.000.000đ, hoặc "48 triệu").
- Khi cần số liệu, GỌI TOOL phù hợp thay vì bịa. Có thể gọi nhiều tool.
- Các tool bắt đầu bằng "propose_" là ĐỀ XUẤT THÊM dữ liệu — chỉ gọi khi người dùng yêu cầu ghi/thêm; hệ thống sẽ tự hỏi xác nhận, bạn KHÔNG cần hỏi lại.
- Nếu không đủ dữ liệu, nói rõ thay vì đoán.
- Đây là báo cáo quản trị ước tính, không phải số liệu pháp lý.`;

type Msg = {
  role: "system" | "user" | "assistant" | "tool";
  content: string | null;
  tool_calls?: { id: string; type: "function"; function: { name: string; arguments: string } }[];
  tool_call_id?: string;
};

export async function POST(req: Request) {
  const key = process.env.GROQ_API_KEY;
  if (!key) {
    return NextResponse.json(
      { type: "error", content: "Chưa cấu hình GROQ_API_KEY. Tạo key free tại console.groq.com rồi thêm vào biến môi trường." },
      { status: 200 }
    );
  }

  let body: { messages?: { role: string; content: string }[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ type: "error", content: "Body không hợp lệ." }, { status: 400 });
  }

  const groq = new Groq({ apiKey: key });
  const history: Msg[] = [
    { role: "system", content: SYSTEM },
    ...(body.messages ?? []).map((m): Msg => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: m.content,
    })),
  ];

  try {
    // Vòng lặp agent: gọi model -> chạy tool đọc -> lặp; gặp tool ghi thì dừng để xác nhận.
    for (let step = 0; step < 5; step++) {
      const res = await groq.chat.completions.create({
        model: MODEL,
        messages: history as never,
        tools: AGENT_TOOLS as never,
        tool_choice: "auto",
        temperature: 0.3,
        max_tokens: 1024,
      });

      const msg = res.choices[0]?.message as Msg;
      const calls = msg.tool_calls ?? [];

      if (calls.length === 0) {
        return NextResponse.json({ type: "message", content: msg.content ?? "" });
      }

      history.push({ role: "assistant", content: msg.content ?? "", tool_calls: msg.tool_calls });

      // Tool ghi -> dừng, trả về cho client xác nhận
      const writeCall = calls.find((c) => WRITE_TOOLS.has(c.function.name));
      if (writeCall) {
        let args: Record<string, unknown> = {};
        try {
          args = JSON.parse(writeCall.function.arguments || "{}");
        } catch {}
        return NextResponse.json({
          type: "confirm",
          action: { name: writeCall.function.name, args },
        });
      }

      // Chạy các tool đọc
      for (const c of calls) {
        let args: Record<string, unknown> = {};
        try {
          args = JSON.parse(c.function.arguments || "{}");
        } catch {}
        const result = await runReadTool(c.function.name, args);
        history.push({ role: "tool", tool_call_id: c.id, content: result });
      }
    }

    return NextResponse.json({
      type: "message",
      content: "Mình cần thêm thông tin để trả lời chính xác. Bạn hỏi cụ thể hơn nhé.",
    });
  } catch (e) {
    return NextResponse.json(
      { type: "error", content: "Lỗi gọi AI: " + (e as Error).message },
      { status: 200 }
    );
  }
}
