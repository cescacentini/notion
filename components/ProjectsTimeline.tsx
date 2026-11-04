import type { ReactNode } from "react";
import Link from "next/link";
import GoalCard from "@/components/GoalCard";
import type { GoalOverview, Project, ProjectsOverview } from "@/lib/notion";
import { buildYearTimeline, timelineYears } from "@/lib/projectTimeline";

function formatDay(date: string) {
  return new Date(date).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
}

function Tile({
  id,
  name,
  date,
  today,
  detail,
}: {
  id: string;
  name: string;
  date: string | null;
  today: string;
  detail?: string;
}) {
  const overdue = date !== null && date < today;
  return (
    <a
      href={`https://notion.so/${id.replace(/-/g, "")}`}
      target="_blank"
      rel="noopener noreferrer"
      className="block rounded-lg bg-white border border-neutral-100 px-2.5 py-2 hover:border-neutral-300 transition-colors"
    >
      <p className="text-xs font-medium text-neutral-900 line-clamp-3 break-words">{name}</p>
      {detail && <p className="text-[10px] text-neutral-500 mt-0.5 line-clamp-2 break-words">{detail}</p>}
      {date && (
        <p className={`text-[10px] mt-0.5 tabular-nums ${overdue ? "text-red-600" : "text-neutral-400"}`}>
          {overdue ? "Was due" : "Due"} {formatDay(date)}
        </p>
      )}
    </a>
  );
}

function Items({
  goals,
  projects,
  goalNames,
  today,
}: {
  goals: GoalOverview[];
  projects: Project[];
  goalNames: (project: Project) => string[];
  today: string;
}) {
  return (
    <>
      {goals.map((goal) => (
        <Tile
          key={goal.id}
          id={goal.id}
          name={goal.name}
          date={goal.byWhen}
          today={today}
          detail={goal.progress !== null ? `Goal · ${Math.round(goal.progress * 100)}%` : "Goal"}
        />
      ))}
      {projects.map((project) => {
        const names = goalNames(project);
        return (
          <Tile
            key={project.id}
            id={project.id}
            name={project.name}
            date={project.dueDate}
            today={today}
            detail={names.length > 0 ? `Goal: ${names.join(", ")}` : undefined}
          />
        );
      })}
    </>
  );
}

function Cell({ label, isCurrent, count, children }: { label: string; isCurrent: boolean; count: number; children: ReactNode }) {
  return (
    <section
      aria-current={isCurrent ? "date" : undefined}
      className={`min-w-0 rounded-xl p-2 flex flex-col gap-1.5 min-h-20 ${
        isCurrent ? "bg-neutral-100 ring-1 ring-neutral-900" : "bg-neutral-50"
      }`}
    >
      <h3 className={`px-0.5 text-xs font-semibold ${count > 0 || isCurrent ? "text-neutral-900" : "text-neutral-400"}`}>
        {label}
        {count > 0 && <span className="ml-1.5 font-normal text-neutral-400 tabular-nums">{count}</span>}
      </h3>
      {children}
    </section>
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
  const hasQuarterGoals = timeline.quarters.some((quarter) => quarter.goals.length > 0);

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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {timeline.goals.map((goal) => <GoalCard key={goal.id} goal={goal} compact />)}
          </div>
        </section>
      )}

      {hasQuarterGoals && (
        <section className="flex flex-col gap-3">
          <h2 className="text-xs text-neutral-500 uppercase tracking-wider font-medium">Quarters</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 items-start">
            {timeline.quarters.map((quarter) => (
              <Cell key={quarter.quarter} label={quarter.label} isCurrent={quarter.isCurrent} count={quarter.goals.length}>
                <Items goals={quarter.goals} projects={[]} goalNames={goalNames} today={today} />
              </Cell>
            ))}
          </div>
        </section>
      )}

      <section className="flex flex-col gap-3">
        <h2 className="text-xs text-neutral-500 uppercase tracking-wider font-medium">Months</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {timeline.months.map((month) => (
            <Cell
              key={month.month}
              label={month.label}
              isCurrent={month.isCurrent}
              count={month.goals.length + month.projects.length}
            >
              <Items goals={month.goals} projects={month.projects} goalNames={goalNames} today={today} />
            </Cell>
          ))}
        </div>
      </section>

      {undatedCount > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-xs text-neutral-500 uppercase tracking-wider font-medium">
            No date <span className="ml-1 font-normal text-neutral-400 tabular-nums">{undatedCount}</span>
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <Items goals={timeline.undatedGoals} projects={timeline.undatedProjects} goalNames={goalNames} today={today} />
          </div>
        </section>
      )}
    </div>
  );
}
