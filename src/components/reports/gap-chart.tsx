"use client";

import { useEffect, useRef, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { type GapRow } from "@/lib/analytics";

type TooltipEntry = { dataKey?: string | number; value?: number | string };
type ChartTooltipProps = {
  active?: boolean;
  payload?: TooltipEntry[];
  label?: string | number;
};

function CustomTooltip({ active, payload, label }: ChartTooltipProps) {
  if (!active || !payload || !payload.length) return null;
  const expense = payload.find((p) => p.dataKey === "expense")?.value ?? 0;
  const invoiceIn = payload.find((p) => p.dataKey === "invoiceIn")?.value ?? 0;
  const gap = Number(expense) - Number(invoiceIn);
  return (
    <div className="bg-white/95 backdrop-blur px-4 py-3 rounded-2xl shadow-lg border border-white/40 text-xs">
      <p className="font-bold text-[var(--foreground)] mb-1.5">{label}</p>
      <p className="text-[var(--muted)]">
        Chi phí: <b className="text-[var(--foreground)]">{String(expense)}M</b>
      </p>
      <p className="text-[var(--muted)]">
        HĐ đã có: <b className="text-[var(--primary)]">{String(invoiceIn)}M</b>
      </p>
      <p className="text-rose-500 font-semibold mt-1">Gap: {gap}M</p>
    </div>
  );
}

export function GapChart({ data }: { data: GapRow[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(800);
  const height = 280;

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
      <BarChart
        width={width}
        height={height}
        data={data}
        margin={{ top: 10, right: 8, left: -16, bottom: 0 }}
        barGap={4}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#eceaf6" vertical={false} />
        <XAxis
          dataKey="month"
          axisLine={false}
          tickLine={false}
          tick={{ fill: "#9b9ab5", fontSize: 11, fontWeight: 500 }}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fill: "#9b9ab5", fontSize: 11 }}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(91,79,207,0.05)" }} />
        <Legend
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
          formatter={(v) =>
            v === "expense" ? "Chi phí thực" : "Hoá đơn đã có"
          }
        />
        <Bar dataKey="expense" fill="#FFB3BD" radius={[6, 6, 0, 0]} maxBarSize={22} isAnimationActive={false} />
        <Bar dataKey="invoiceIn" fill="#5B4FCF" radius={[6, 6, 0, 0]} maxBarSize={22} isAnimationActive={false} />
      </BarChart>
    </div>
  );
}
