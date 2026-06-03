import { cn } from "@/lib/utils";

export type Column<T> = {
  key: string;
  label: string;
  align?: "left" | "right" | "center";
  className?: string;
  render: (row: T) => React.ReactNode;
};

export function DataTable<T extends { id: string }>({
  columns,
  rows,
  empty = "Chưa có dữ liệu.",
  footer,
}: {
  columns: Column<T>[];
  rows: T[];
  empty?: string;
  footer?: React.ReactNode;
}) {
  const alignCls = { left: "text-left", right: "text-right", center: "text-center" };
  return (
    <div className="card-soft overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[var(--primary-soft)]/50 text-[var(--muted)] text-[11px] uppercase tracking-wider font-semibold">
              {columns.map((c, i) => (
                <th
                  key={c.key}
                  className={cn(
                    "py-3.5 px-3 whitespace-nowrap",
                    alignCls[c.align ?? "left"],
                    i === 0 && "pl-6",
                    i === columns.length - 1 && "pr-6"
                  )}
                >
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="py-12 text-center text-[var(--muted)]">
                  {empty}
                </td>
              </tr>
            )}
            {rows.map((row) => (
              <tr key={row.id} className="border-t border-[var(--border)] hover:bg-[var(--primary-soft)]/30 transition-colors">
                {columns.map((c, i) => (
                  <td
                    key={c.key}
                    className={cn(
                      "py-3 px-3",
                      alignCls[c.align ?? "left"],
                      i === 0 && "pl-6",
                      i === columns.length - 1 && "pr-6",
                      c.className
                    )}
                  >
                    {c.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {footer}
    </div>
  );
}
