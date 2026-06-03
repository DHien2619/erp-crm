import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatVND(value: number): string {
  if (value >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(1)} tỷ`;
  }
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(0)} tr`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(0)}k`;
  }
  return value.toString();
}

export function formatFullVND(value: number): string {
  return new Intl.NumberFormat("vi-VN").format(value) + " ₫";
}
