import { getActiveProjects, getInProgressResources } from "@/lib/notion";
import ProjectsCard from "@/components/ProjectsCard";
import ResourcesCard from "@/components/ResourcesCard";
import ProjectTimeline from "@/components/ProjectTimeline";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const [projects, resources] = await Promise.all([
    getActiveProjects(),
    getInProgressResources(),
  ]);
  return (
    <div className="min-h-full max-w-xl mx-auto px-5 py-8 flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Link href="/" className="text-neutral-400 hover:text-neutral-700 transition-colors">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-xl font-semibold tracking-tight">Projects</h1>
      </div>
      <ProjectTimeline projects={projects} />
      <ProjectsCard projects={projects} />
      <ResourcesCard resources={resources} />
    </div>
  );
}
