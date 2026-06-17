"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Ô nhập số "thân thiện":
 * - Giá trị 0 hiển thị RỖNG (không kẹt số 0), placeholder gợi ý.
 * - Cho nhập thập phân, chấp nhận cả dấu "," lẫn "." (VN gõ 1,2 = 1.2).
 * - Cho xoá trắng khi gõ; rời ô (blur) tự chuẩn hoá lại theo value.
 */
function toStr(n: number) {
  return n === 0 || Number.isNaN(n) ? "" : String(n);
}

export function NumberField({
  value,
  onChange,
  placeholder = "0",
  suffix,
  allowNegative = false,
  className,
}: {
  value: number;
  onChange: (v: number) => void;
  placeholder?: string;
  suffix?: string;
  allowNegative?: boolean;
  className?: string;
}) {
  const [local, setLocal] = useState(toStr(value));
  const focused = useRef(false);

  // đồng bộ khi value đổi từ ngoài (vd chuyển chế độ tự đề xuất) — không phá lúc đang gõ
  useEffect(() => {
    if (!focused.current) setLocal(toStr(value));
  }, [value]);

  function handle(raw: string) {
    // giữ lại số, dấu chấm/phẩy, và dấu trừ (nếu cho phép)
    const cleaned = raw.replace(allowNegative ? /[^0-9.,-]/g : /[^0-9.,]/g, "");
    setLocal(cleaned);
    const parsed = parseFloat(cleaned.replace(/,/g, "."));
    onChange(Number.isNaN(parsed) ? 0 : parsed);
  }

  return (
    <div className="relative">
      <input
        type="text"
        inputMode="decimal"
        value={local}
        placeholder={placeholder}
        onFocus={() => {
          focused.current = true;
        }}
        onBlur={() => {
          focused.current = false;
          setLocal(toStr(value));
        }}
        onChange={(e) => handle(e.target.value)}
        className={cn("erp-input", suffix && "pr-10", className)}
      />
      {suffix && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-[var(--muted)] font-medium pointer-events-none">
          {suffix}
        </span>
      )}
    </div>
  );
}
