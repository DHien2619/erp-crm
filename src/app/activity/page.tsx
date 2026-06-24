import { AppShell } from "@/components/app-shell";
import { ActivityClient } from "@/components/activity/activity-client";
import { getActivityLog } from "@/lib/data";
import type { ActivityLog } from "@/lib/database.types";

export const dynamic = "force-dynamic";

export default async function ActivityPage() {
  const logs = (await getActivityLog()) as ActivityLog[];
  return (
    <AppShell>
      <ActivityClient logs={logs} />
    </AppShell>
  );
}
