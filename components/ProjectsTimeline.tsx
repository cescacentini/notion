import Link from "next/link";
import GoalCard from "@/components/GoalCard";
import ProjectRow from "@/components/ProjectRow";
import type { GoalOverview, Project, ProjectsOverview } from "@/lib/notion";
import { buildYearTimeline, timelineYears } from "@/lib/projectTimeline";

function Items({
  goals,
  projects,
  goalNames,
}: {
  goals: GoalOverview[];
  projects: Project[];
  goalNames: (project: Project) => string[];
}) {
  return (
    <>
      {goals.map((goal) => <GoalCard key={goal.id} goal={goal} compact />)}
      {projects.map((project) => (
        <ProjectRow key={project.id} project={project} goalNames={goalNames(project)} />
      ))}
    </>
  );
}

export default function ProjectsTimeline({
  overview,
  requestedYear,
}: {
  overview: ProjectsOverview;
  requestedYear: number;
}) {
  const today = new Date().toISOString().split("T")[0];
  const years = timelineYears(overview, today);
  const year = years.some((y) => y.year === requestedYear) ? requestedYear : Number(today.slice(0, 4));
  const timeline = buildYearTimeline(overview, year, today);

  const nameById = new Map(overview.goals.map((goal) => [goal.id, goal.name]));
  const goalNames = (project: Project) =>
    project.goalIds.flatMap((id) => nameById.get(id) ?? []);
  const undatedCount = timeline.undatedGoals.length + timeline.undatedProjects.length;

  return (
    <div className="flex flex-col gap-6">
      <nav aria-label="Year" className="flex flex-wrap gap-2">
        {years.map((y) => (
          <Link
            key={y.year}
            href={`/projects?view=date&year=${y.year}`}
            aria-current={y.year === year ? "page" : undefined}
            className={`px-3 py-1.5 text-sm rounded-full tabular-nums transition-colors ${
              y.year === year ? "bg-neutral-900 text-white" : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
            }`}
          >
            {y.year} <span className="opacity-60">{y.count}</span>
          </Link>
        ))}
      </nav>

      {timeline.goals.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-xs text-neutral-500 uppercase tracking-wider font-medium">Goals for {year}</h2>
          {timeline.goals.map((goal) => <GoalCard key={goal.id} goal={goal} compact />)}
        </section>
      )}

      {timeline.quarters.map((quarter) => (
        <details key={quarter.quarter} open={quarter.isCurrent} className="border-t border-neutral-100 pt-4">
          <summary className="cursor-pointer text-base font-semibold text-neutral-900">
            {quarter.label}
            <span className="ml-2 text-xs font-normal text-neutral-400 tabular-nums">{quarter.count}</span>
          </summary>
          <div className="flex flex-col gap-3 mt-3">
            {quarter.goals.map((goal) => <GoalCard key={goal.id} goal={goal} compact />)}
            {quarter.months.map((month) => {
              const count = month.goals.length + month.projects.length;
              return (
                <details key={month.month} open={month.isCurrent}>
                  <summary className="cursor-pointer text-sm font-medium text-neutral-700 py-1">
                    {month.label}
                    <span className="ml-2 text-xs font-normal text-neutral-400 tabular-nums">{count}</span>
                  </summary>
                  <div className="flex flex-col gap-2 mt-2">
                    <Items goals={month.goals} projects={month.projects} goalNames={goalNames} />
                    {count === 0 && <p className="text-xs text-neutral-400">Nothing due this month.</p>}
                  </div>
                </details>
              );
            })}
          </div>
        </details>
      ))}

      {undatedCount > 0 && (
        <details className="border-t border-neutral-100 pt-4">
          <summary className="cursor-pointer text-base font-semibold text-neutral-900">
            No date
            <span className="ml-2 text-xs font-normal text-neutral-400 tabular-nums">{undatedCount}</span>
          </summary>
          <div className="flex flex-col gap-2 mt-3">
            <Items goals={timeline.undatedGoals} projects={timeline.undatedProjects} goalNames={goalNames} />
          </div>
        </details>
      )}
    </div>
  );
}
