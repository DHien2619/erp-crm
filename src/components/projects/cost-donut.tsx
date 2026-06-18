"use client";

import { useEffect, useRef, useState } from "react";
import { PieChart, Pie, Cell } from "recharts";
import { formatFullVND } from "@/lib/utils";

export type DonutSlice = { name: string; value: number; color: string };

export function CostDonut({ data }: { data: DonutSlice[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState(240);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0].contentRect.width;
      if (w > 0) setSize(Math.min(260, Math.max(180, w)));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const total = data.reduce((s, d) => s + d.value, 0);

  if (total === 0) {
    return (
      <div className="h-[200px] flex items-center justify-center text-sm text-[var(--muted)]">
        Chưa có chi phí nào
      </div>
    );
  }

  return (
    <div ref={ref} className="w-full flex justify-center relative">
      <PieChart width={size} height={size}>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          innerRadius={size * 0.28}
          outerRadius={size * 0.46}
          paddingAngle={2}
          stroke="none"
          isAnimationActive={false}
        >
          {data.map((d) => (
            <Cell key={d.name} fill={d.color} />
          ))}
        </Pie>
      </PieChart>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="text-[10px] uppercase tracking-wider text-[var(--muted)] font-semibold">
          Tổng chi phí
        </span>
        <span className="text-base font-bold text-[var(--foreground)]">
          {formatFullVND(total)}
        </span>
      </div>
    </div>
  );
}
