import Link from "next/link";
import {
  Coins,
  Layers,
  Landmark,
  FileCheck,
  ArrowLeftRight,
  PieChart,
  BarChart3,
  ChevronRight,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Topbar } from "@/components/topbar";
import {
  getAdvances,
  getCostCenters,
  getBankAccounts,
  getPaymentRequests,
  getTransactions,
  getBudgets,
} from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function ModulesPage() {
  const [adv, cc, ba, pr, tx, bg] = await Promise.all([
    getAdvances(),
    getCostCenters(),
    getBankAccounts(),
    getPaymentRequests(),
    getTransactions(),
    getBudgets(),
  ]);

  const modules = [
    { href: "/modules/advances", icon: Coins, name: "Tạm ứng", desc: "Tiền tạm ứng & hoàn ứng", count: adv.length, tone: "violet" },
    { href: "/modules/cost-centers", icon: Layers, name: "Trung tâm chi phí", desc: "Phân bổ chi phí theo bộ phận", count: cc.length, tone: "blue" },
    { href: "/modules/bank-accounts", icon: Landmark, name: "Tài khoản ngân hàng", desc: "Quỹ & số dư tài khoản", count: ba.length, tone: "emerald" },
    { href: "/modules/payment-requests", icon: FileCheck, name: "Yêu cầu thanh toán", desc: "Đề nghị chi & duyệt", count: pr.length, tone: "amber" },
    { href: "/modules/transactions", icon: ArrowLeftRight, name: "Giao dịch thanh toán", desc: "Sổ thu – chi thực tế", count: tx.length, tone: "pink" },
    { href: "/modules/budgets", icon: PieChart, name: "Kế hoạch ngân sách", desc: "Ngân sách vs thực chi", count: bg.length, tone: "cyan" },
    { href: "/reports", icon: BarChart3, name: "KQHĐ kinh doanh", desc: "Báo cáo lãi/lỗ theo kỳ", count: null, tone: "violet" },
  ];

  const toneCls: Record<string, string> = {
    violet: "bg-violet-100 text-violet-600",
    blue: "bg-blue-100 text-blue-600",
    emerald: "bg-emerald-100 text-emerald-600",
    amber: "bg-amber-100 text-amber-600",
    pink: "bg-pink-100 text-pink-600",
    cyan: "bg-cyan-100 text-cyan-600",
  };

  return (
    <AppShell>
      <Topbar title="Nghiệp vụ" subtitle="Các module quản trị tài chính" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {modules.map((m) => (
          <Link
            key={m.href}
            href={m.href}
            className="card-soft p-5 flex items-center gap-4 hover:shadow-lg hover:-translate-y-0.5 transition-all group"
          >
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${toneCls[m.tone]}`}>
              <m.icon className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-[var(--foreground)]">{m.name}</p>
              <p className="text-xs text-[var(--muted)]">{m.desc}</p>
              {m.count !== null && (
                <p className="text-[11px] text-[var(--primary)] font-semibold mt-1">{m.count} mục</p>
              )}
            </div>
            <ChevronRight className="w-5 h-5 text-[var(--muted-soft)] group-hover:text-[var(--primary)] transition-colors" />
          </Link>
        ))}
      </div>
    </AppShell>
  );
}
