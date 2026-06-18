import { AppShell } from "@/components/app-shell";
import { ProjectsClient } from "@/components/projects/projects-client";
import { getProjectsWithStats } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const projects = await getProjectsWithStats();
  return (
    <AppShell>
      <ProjectsClient projects={projects} />
    </AppShell>
  );
}
