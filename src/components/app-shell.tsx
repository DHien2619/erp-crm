import { Sidebar } from "./sidebar";

export function AppShell({
  children,
  rightRail,
}: {
  children: React.ReactNode;
  rightRail?: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <div className="flex-1 flex gap-4 py-4 pr-4 min-w-0">
        <main className="flex-1 card-soft p-6 min-w-0">{children}</main>
        {rightRail}
      </div>
    </div>
  );
}
