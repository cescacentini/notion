import { getProjectsOverview, type GoalOverview, type ProjectsOverview } from "@/lib/notion";
import GoalCard from "@/components/GoalCard";
import ProjectRow from "@/components/ProjectRow";
import ProjectsTimeline from "@/components/ProjectsTimeline";
import Link from "next/link";

export const dynamic = "force-dynamic";

const GOAL_GROUPS = [
  { type: "yearly", label: "Yearly goals" },
  { type: "quaterly", label: "Quarterly goals" },
  { type: "monthly", label: "Monthly goals" },
];

function groupGoals(goals: GoalOverview[]) {
  const knownTypes = GOAL_GROUPS.map((group) => group.type);
  return [
    ...GOAL_GROUPS.map(({ type, label }) => ({ label, goals: goals.filter((goal) => goal.type === type) })),
    { label: "Other goals", goals: goals.filter((goal) => !knownTypes.includes(goal.type ?? "")) },
  ].filter((group) => group.goals.length > 0);
}

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; year?: string }>;
}) {
  const { view, year } = await searchParams;
  const byDate = view === "date";
  let overview: ProjectsOverview | null = null;
  try {
    overview = await getProjectsOverview();
  } catch (err) {
    console.error("[projects]", err);
  }

  return (
    <div className="min-h-full max-w-xl mx-auto px-5 pt-8 pb-[max(env(safe-area-inset-bottom),24px)] flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Link href="/" aria-label="Back to home" className="text-neutral-400 hover:text-neutral-700 transition-colors">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-xl font-semibold tracking-tight">Goals &amp; projects</h1>
      </div>

      <nav aria-label="View" className="grid grid-cols-2 gap-1 p-1 bg-neutral-100 rounded-xl text-sm font-medium">
        <Link
          href="/projects"
          aria-current={byDate ? undefined : "page"}
          className={`text-center py-2 rounded-lg transition-colors ${byDate ? "text-neutral-500" : "bg-white text-neutral-900 shadow-sm"}`}
        >
          By type
        </Link>
        <Link
          href="/projects?view=date"
          aria-current={byDate ? "page" : undefined}
          className={`text-center py-2 rounded-lg transition-colors ${byDate ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-500"}`}
        >
          By date
        </Link>
      </nav>

      {overview && byDate && <ProjectsTimeline overview={overview} requestedYear={Number(year)} />}

      {!overview && (
        <p className="text-sm text-neutral-500 border border-neutral-100 rounded-xl px-4 py-4">
          Couldn&apos;t load your projects from Notion. Refresh to try again.
        </p>
      )}

      {overview && !byDate && groupGoals(overview.goals).map((group) => (
        <section key={group.label} className="flex flex-col gap-3">
          <h2 className="text-xs text-neutral-500 uppercase tracking-wider font-medium">{group.label}</h2>
          {group.goals.map((goal) => <GoalCard key={goal.id} goal={goal} />)}
        </section>
      ))}

      {overview && !byDate && overview.withoutGoal.length > 0 && (
        <section className="flex flex-col gap-2">
          <div>
            <h2 className="text-xs text-neutral-500 uppercase tracking-wider font-medium">No goal</h2>
            <p className="text-xs text-neutral-400 mt-1">
              {overview.withoutGoal.length} active project{overview.withoutGoal.length !== 1 ? "s" : ""} not linked to an open goal
            </p>
          </div>
          {overview.withoutGoal.map((project) => <ProjectRow key={project.id} project={project} />)}
        </section>
      )}

      {overview && overview.goals.length === 0 && overview.withoutGoal.length === 0 && (
        <p className="text-sm text-neutral-400 border border-neutral-100 rounded-xl px-4 py-4">No open goals or active projects.</p>
      )}
    </div>
  );
}
