"use client";

import { useEffect, useRef, useState } from "react";
import { AreaChart, Area, XAxis, Tooltip } from "recharts";
import { formatVND } from "@/lib/utils";

export type ChartPoint = { label: string; value: number };

type TooltipEntry = { value?: number; payload?: ChartPoint };
type ChartTooltipProps = {
  active?: boolean;
  payload?: TooltipEntry[];
  label?: string | number;
};

function CustomTooltip({ active, payload }: ChartTooltipProps) {
  if (!active || !payload || !payload.length) return null;
  const p = payload[0];
  return (
    <div className="bg-white/95 backdrop-blur px-4 py-2 rounded-2xl shadow-lg border border-white/40">
      <p className="text-xs text-[var(--muted)] font-medium">
        {p.payload?.label}
      </p>
      <p className="text-base font-bold text-[var(--foreground)]">
        {formatVND(Number(p.payload?.value ?? 0))}
      </p>
      <p className="text-[10px] text-[var(--accent)] font-semibold uppercase tracking-wider mt-0.5">
        Doanh thu
      </p>
    </div>
  );
}

export default function ChartArea({ data }: { data: ChartPoint[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(600);
  const height = 200;

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
      <AreaChart width={width} height={height} data={data}>
        <defs>
          <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFB3BD" stopOpacity={0.5} />
            <stop offset="100%" stopColor="#FFB3BD" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis
          dataKey="label"
          axisLine={false}
          tickLine={false}
          tick={{
            fill: "rgba(255,255,255,0.6)",
            fontSize: 11,
            fontWeight: 500,
          }}
          dy={6}
          interval="preserveStartEnd"
          minTickGap={20}
        />
        <Tooltip
          content={<CustomTooltip />}
          cursor={{ stroke: "rgba(255,255,255,0.3)", strokeWidth: 1 }}
        />
        <Area
          type="monotone"
          dataKey="value"
          stroke="#FF8C9A"
          strokeWidth={2.5}
          fill="url(#revenueGrad)"
          dot={false}
          isAnimationActive={false}
          activeDot={{
            r: 6,
            fill: "#FF8C9A",
            stroke: "#fff",
            strokeWidth: 2,
          }}
        />
      </AreaChart>
    </div>
  );
}
