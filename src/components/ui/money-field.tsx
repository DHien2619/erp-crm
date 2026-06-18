"use client";

import { useState } from "react";

/**
 * Ô nhập tiền VND: hiển thị có dấu phân cách nghìn (50.000.000) cho dễ đọc,
 * nhưng gửi đi số thô qua một <input hidden name=...> để FormData lấy đúng.
 * Dùng cho form uncontrolled (FormData) như các modal hiện có.
 */
export function MoneyField({
  name,
  defaultValue,
  required,
  placeholder = "0",
  className = "erp-input",
}: {
  name: string;
  defaultValue?: number | string | null;
  required?: boolean;
  placeholder?: string;
  className?: string;
}) {
  const init =
    defaultValue === null || defaultValue === undefined || defaultValue === ""
      ? ""
      : String(defaultValue).replace(/[^\d]/g, "");
  const [raw, setRaw] = useState(init);

  const display = raw === "" ? "" : Number(raw).toLocaleString("vi-VN");

  return (
    <>
      <input
        type="text"
        inputMode="numeric"
        autoComplete="off"
        value={display}
        required={required}
        placeholder={placeholder}
        onChange={(e) => setRaw(e.target.value.replace(/[^\d]/g, ""))}
        className={className}
      />
      <input type="hidden" name={name} value={raw} />
    </>
  );
}
