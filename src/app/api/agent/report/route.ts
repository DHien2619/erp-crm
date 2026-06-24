import { NextResponse } from "next/server";
import Groq from "groq-sdk";
import { getCurrentUser } from "@/lib/auth";
import {
  getKpiData,
  getFinanceData,
  getProjectsWithStats,
  getActivityLog,
} from "@/lib/data";
import type { ActivityLog } from "@/lib/database.types";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const MODEL = "llama-3.3-70b-versatile";
const m = (n: number) => Math.round(n);

export async function POST() {
  const key = process.env.GROQ_API_KEY?.replace(/[^\x21-\x7e]/g, "");

  const user = await getCurrentUser();
  const role = user?.role ?? "staff";
  const canFinance = role === "admin" || role === "accountant";

  // ---- Gom dữ liệu thật ----
  const [kpi, projects, logsRaw] = await Promise.all([
    getKpiData(),
    getProjectsWithStats(),
    getActivityLog(100),
  ]);
  const logs = logsRaw as ActivityLog[];

  const revenue = kpi.monthly.reduce((s, x) => s + x.revenue, 0);
  const expense = kpi.monthly.reduce((s, x) => s + x.expense, 0);
  const net = kpi.monthly.reduce((s, x) => s + x.net, 0);

  let gap = 0;
  if (canFinance) {
    const fin = await getFinanceData();
    gap = fin.in.filter((r) => r.status !== "matched").reduce((s, r) => s + r.net, 0);
  }

  const overdueTotal = kpi.overdue.reduce((s, o) => s + o.amount, 0);
  const topCustomers = kpi.topCustomers.slice(0, 5).map((c) => ({ name: c.name, amount: m(c.amount) }));
  const projSummary = projects.map((p) => ({
    name: p.name,
    profit: m(p.totalPaid - p.totalCost),
    paidPct: Number(p.contract_value) ? Math.round((p.totalPaid / Number(p.contract_value)) * 100) : 0,
  }));

  // hoạt động AI
  const todayStr = new Date().toISOString().slice(0, 10);
  const activity = {
    total: logs.length,
    today: logs.filter((l) => l.created_at?.slice(0, 10) === todayStr).length,
    week: logs.filter((l) => Date.now() - new Date(l.created_at).getTime() < 7 * 86400000).length,
    questions: logs.slice(0, 20).map((l) => l.question).filter(Boolean),
  };

  // ---- AI viết nhận định + khuyến nghị (dựa trên số thật) ----
  let insights: string[] = [];
  let recommendations: string[] = [];
  if (key) {
    const facts = {
      vai_tro: role,
      tai_chinh: canFinance ? { doanh_thu: m(revenue), chi_phi: m(expense), loi_nhuan_rong: m(net), gap_hoa_don: m(gap) } : "ẩn (không đủ quyền)",
      cong_no_qua_han: { tong: m(overdueTotal), so_khoan: kpi.overdue.length },
      top_khach_hang: topCustomers,
      du_an: projSummary,
      hoat_dong_ai: { tong_luot: activity.total, cac_cau_hoi: activity.questions },
    };
    try {
      const groq = new Groq({ apiKey: key });
      const res = await groq.chat.completions.create({
        model: MODEL,
        temperature: 0.5,
        max_tokens: 800,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              'Bạn là chuyên gia phân tích tài chính. Dựa trên SỐ LIỆU THẬT (JSON) của doanh nghiệp, viết NHẬN ĐỊNH và KHUYẾN NGHỊ bằng tiếng Việt, CỤ THỂ, có dẫn số, KHÔNG chung chung. Trả về đúng JSON: {"insights": ["..."], "recommendations": ["..."]}. Mỗi mảng 3-5 câu ngắn, mỗi câu nêu rõ con số hoặc tên cụ thể.',
          },
          { role: "user", content: JSON.stringify(facts) },
        ],
      });
      const parsed = JSON.parse(res.choices[0]?.message?.content || "{}");
      insights = Array.isArray(parsed.insights) ? parsed.insights.slice(0, 6) : [];
      recommendations = Array.isArray(parsed.recommendations) ? parsed.recommendations.slice(0, 6) : [];
    } catch {
      insights = [];
      recommendations = [];
    }
  }

  return NextResponse.json({
    type: "report",
    role,
    finance: canFinance ? { revenue: m(revenue), expense: m(expense), net: m(net), gap: m(gap) } : null,
    overdue: { total: m(overdueTotal), count: kpi.overdue.length },
    topCustomers,
    projects: projSummary,
    activity: { total: activity.total, today: activity.today, week: activity.week },
    insights,
    recommendations,
  });
}
