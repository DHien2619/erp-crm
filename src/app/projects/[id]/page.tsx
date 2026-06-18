import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { ProjectDetailClient } from "@/components/projects/project-detail-client";
import { getProjectDetail } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const detail = await getProjectDetail(id);
  if (!detail) notFound();

  return (
    <AppShell>
      <ProjectDetailClient detail={detail} />
    </AppShell>
  );
}
