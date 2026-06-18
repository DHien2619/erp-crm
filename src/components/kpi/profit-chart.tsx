"use client";

import { useEffect, useRef, useState } from "react";
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import type { KpiMonthly } from "@/lib/data";

type Entry = { dataKey?: string | number; value?: number | string; color?: string };
type TProps = { active?: boolean; payload?: Entry[]; label?: string | number };

const M = (n: number) => `${(Number(n) / 1_000_000).toFixed(1)}tr`;
const labelOf: Record<string, string> = {
  revenue: "Doanh thu",
  expense: "Chi phí",
  net: "LN ròng (ước tính)",
};

function TipBox({ active, payload, label }: TProps) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="bg-white/95 backdrop-blur px-4 py-3 rounded-2xl shadow-lg border border-white/40 text-xs">
      <p className="font-bold text-[var(--foreground)] mb-1.5">{label}</p>
      {payload.map((p) => (
        <p key={String(p.dataKey)} className="text-[var(--muted)]">
          {labelOf[String(p.dataKey)] ?? String(p.dataKey)}:{" "}
          <b style={{ color: p.color }}>{M(Number(p.value))}</b>
        </p>
      ))}
    </div>
  );
}

export function ProfitChart({ data }: { data: KpiMonthly[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(800);
  const height = 300;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0].contentRect.width;
      if (w > 0) setWidth(w);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={ref} className="w-full" style={{ height }}>
      <ComposedChart
        width={width}
        height={height}
        data={data}
        margin={{ top: 10, right: 8, left: -8, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#eceaf6" vertical={false} />
        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#9b9ab5", fontSize: 11 }} />
        <YAxis axisLine={false} tickLine={false} tick={{ fill: "#9b9ab5", fontSize: 11 }} tickFormatter={(v) => `${Math.round(Number(v) / 1_000_000)}`} />
        <Tooltip content={<TipBox />} cursor={{ fill: "rgba(91,79,207,0.05)" }} />
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, paddingTop: 8 }} formatter={(v) => labelOf[v] ?? v} />
        <Bar dataKey="revenue" fill="#5B4FCF" radius={[6, 6, 0, 0]} maxBarSize={22} isAnimationActive={false} />
        <Bar dataKey="expense" fill="#FFB3BD" radius={[6, 6, 0, 0]} maxBarSize={22} isAnimationActive={false} />
        <Line dataKey="net" stroke="#10b981" strokeWidth={2.5} dot={{ r: 3 }} isAnimationActive={false} />
      </ComposedChart>
    </div>
  );
}
