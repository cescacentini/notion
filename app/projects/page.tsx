import { getProjectsOverview, type ProjectsOverview } from "@/lib/notion";
import ProjectsTimeline from "@/components/ProjectsTimeline";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  let overview: ProjectsOverview | null = null;
  try {
    overview = await getProjectsOverview();
  } catch (err) {
    console.error("[projects]", err);
  }

  return (
    <div className="min-h-full max-w-6xl mx-auto px-5 pt-8 pb-[max(env(safe-area-inset-bottom),24px)] flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Link href="/" aria-label="Back to home" className="text-neutral-400 hover:text-neutral-700 transition-colors">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-xl font-semibold tracking-tight">Goals &amp; projects</h1>
      </div>

      {overview ? (
        <ProjectsTimeline overview={overview} />
      ) : (
        <p className="text-sm text-neutral-500 border border-neutral-100 rounded-xl px-4 py-4">
          Couldn&apos;t load your projects from Notion. Refresh to try again.
        </p>
      )}
    </div>
  );
}
