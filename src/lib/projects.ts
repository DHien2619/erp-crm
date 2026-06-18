import type { ProjectCostCategory } from "@/lib/database.types";

export const costCategoryMeta: Record<
  ProjectCostCategory,
  { label: string; color: string }
> = {
  ai_tools: { label: "Công cụ AI", color: "#5B4FCF" },
  software: { label: "Phần mềm", color: "#8B7FE8" },
  personnel: { label: "Nhân sự", color: "#FF8FA3" },
  outsource: { label: "Thuê ngoài", color: "#FFB3BD" },
  other: { label: "Khác", color: "#C9C5E8" },
};

export const costCategoryOptions = (
  Object.keys(costCategoryMeta) as ProjectCostCategory[]
).map((k) => ({ value: k, label: costCategoryMeta[k].label, dot: costCategoryMeta[k].color }));

export const projectStatusMeta: Record<string, { label: string; cls: string }> = {
  active: { label: "Đang chạy", cls: "bg-emerald-50 text-emerald-600" },
  done: { label: "Hoàn thành", cls: "bg-[var(--primary-soft)] text-[var(--primary)]" },
  paused: { label: "Tạm dừng", cls: "bg-amber-50 text-amber-600" },
};

export const projectStatusOptions = Object.entries(projectStatusMeta).map(
  ([value, m]) => ({ value, label: m.label })
);
