export type Role = "admin" | "accountant" | "hr" | "staff";

/** Vai trò nào được vào route nào. "*" = tất cả. */
const ACCESS: Record<Role, string[] | "*"> = {
  admin: "*",
  accountant: [
    "/", "/invoices", "/customers", "/suppliers", "/debts",
    "/reports", "/kpi", "/finance", "/tax", "/forecast", "/strategy", "/modules", "/activity", "/settings",
  ],
  hr: ["/", "/projects", "/customers", "/activity", "/settings"],
  staff: ["/", "/invoices"],
};

export const roleLabel: Record<string, string> = {
  admin: "Quản trị viên",
  accountant: "Kế toán",
  hr: "Nhân sự",
  staff: "Nhân viên",
};

export function isAllowed(role: string, path: string): boolean {
  const a = ACCESS[(role as Role)] ?? ACCESS.staff;
  if (a === "*") return true;
  return a.some((p) => (p === "/" ? path === "/" : path === p || path.startsWith(p + "/")));
}

/** Lọc danh sách href theo vai trò (cho sidebar). */
export function allowedHrefs(role: string, hrefs: string[]): Set<string> {
  return new Set(hrefs.filter((h) => isAllowed(role, h)));
}
