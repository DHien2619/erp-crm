"use client";

import { useEffect, useRef, useState } from "react";
import {
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Legend,
} from "recharts";

export type ForecastPoint = {
  label: string;
  revenue: number;
  expense: number;
  forecast: boolean;
};

type TooltipEntry = { dataKey?: string | number; value?: number | string };
type TipProps = { active?: boolean; payload?: TooltipEntry[]; label?: string | number };

function Tip({ active, payload, label }: TipProps) {
  if (!active || !payload || !payload.length) return null;
  const rev = payload.find((p) => p.dataKey === "revenue")?.value ?? 0;
  const exp = payload.find((p) => p.dataKey === "expense")?.value ?? 0;
  return (
    <div className="bg-white/95 backdrop-blur px-4 py-3 rounded-2xl shadow-lg border border-white/40 text-xs">
      <p className="font-bold text-[var(--foreground)] mb-1.5">{label}</p>
      <p className="text-[var(--primary)]">Doanh thu: <b>{String(rev)}M</b></p>
      <p className="text-rose-500">Chi phí: <b>{String(exp)}M</b></p>
      <p className="text-emerald-600 font-semibold mt-1">Lợi nhuận: {Number(rev) - Number(exp)}M</p>
    </div>
  );
}

export function ForecastChart({
  data,
  boundaryLabel,
}: {
  data: ForecastPoint[];
  boundaryLabel?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(800);
  const height = 300;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver((e) => {
      const w = e[0].contentRect.width;
      if (w > 0) setWidth(w);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={ref} className="w-full" style={{ height }}>
      <ComposedChart width={width} height={height} data={data} margin={{ top: 10, right: 8, left: -12, bottom: 0 }}>
        <defs>
          <linearGradient id="fcRev" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#5B4FCF" stopOpacity={0.18} />
            <stop offset="100%" stopColor="#5B4FCF" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#eceaf6" vertical={false} />
        <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "#9b9ab5", fontSize: 11, fontWeight: 500 }} />
        <YAxis axisLine={false} tickLine={false} tick={{ fill: "#9b9ab5", fontSize: 11 }} />
        <Tooltip content={<Tip />} />
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, paddingTop: 8 }} formatter={(v) => (v === "revenue" ? "Doanh thu" : "Chi phí")} />
        {boundaryLabel && (
          <ReferenceLine x={boundaryLabel} stroke="#a8a7bf" strokeDasharray="4 4" label={{ value: "Dự báo →", position: "insideTopRight", fill: "#9b9ab5", fontSize: 10 }} />
        )}
        <Area type="monotone" dataKey="revenue" stroke="none" fill="url(#fcRev)" isAnimationActive={false} legendType="none" />
        <Line type="monotone" dataKey="revenue" stroke="#5B4FCF" strokeWidth={2.5} dot={{ r: 3 }} isAnimationActive={false} />
        <Line type="monotone" dataKey="expense" stroke="#FF8C9A" strokeWidth={2.5} dot={{ r: 3 }} isAnimationActive={false} />
      </ComposedChart>
    </div>
  );
}
