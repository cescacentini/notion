import type { ReactNode } from "react";
import Link from "next/link";
import GoalCard from "@/components/GoalCard";
import type { GoalOverview, Project, ProjectsOverview } from "@/lib/notion";
import { buildYearTimeline, formatSpan, isRange, timelineYears } from "@/lib/projectTimeline";

const MONTH_INITIALS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const notionUrl = (id: string) => `https://notion.so/${id.replace(/-/g, "")}`;

// Months are equal-width columns, so a date is placed within its own month.
// dayOffset says how far through the day to measure: 0 is its start, 1 its end.
function yearFraction(date: string, year: number, dayOffset = 0) {
  const dateYear = Number(date.slice(0, 4));
  if (dateYear < year) return 0;
  if (dateYear > year) return 1;
  const month = Number(date.slice(5, 7));
  const day = Number(date.slice(8, 10));
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return (month - 1 + (day - 1 + dayOffset) / daysInMonth) / 12;
}

function Chevron({ direction }: { direction: "left" | "right" }) {
  return (
    <svg
      aria-hidden
      width="10"
      height="10"
      viewBox="0 0 24 24"
      fill="none"
      stroke="white"
      strokeWidth="4"
      className={`absolute top-px ${direction === "left" ? "left-0.5" : "right-0.5"}`}
    >
      <path d={direction === "left" ? "M15 5l-7 7 7 7" : "M9 5l7 7-7 7"} />
    </svg>
  );
}

function MonthLines() {
  return (
    <div aria-hidden className="absolute inset-0 grid grid-cols-12">
      {MONTH_INITIALS.map((month, index) => (
        <div key={month} className={`border-l ${index % 3 === 0 ? "border-neutral-200" : "border-neutral-100"}`} />
      ))}
    </div>
  );
}

function ChartRow({
  id,
  name,
  start,
  end,
  year,
  today,
  isGoal,
}: {
  id: string;
  name: string;
  start: string;
  end: string;
  year: number;
  today: string;
  isGoal: boolean;
}) {
  const span = formatSpan(start, end, year);
  const overdue = end < today;
  const left = yearFraction(start, year) * 100;
  const right = yearFraction(end, year, 1) * 100;
  const color = overdue ? "bg-red-500" : isGoal ? "bg-neutral-500" : "bg-neutral-900";
  const startedBefore = Number(start.slice(0, 4)) < year;
  const endsAfter = Number(end.slice(0, 4)) > year;

  return (
    <div className="grid grid-cols-[180px_1fr] lg:grid-cols-[240px_1fr] items-stretch hover:bg-neutral-50 transition-colors">
      <a
        href={notionUrl(id)}
        target="_blank"
        rel="noopener noreferrer"
        className="pr-3 py-1.5 min-w-0"
      >
        <p className="text-xs font-medium text-neutral-900 truncate">{name}</p>
        <p className={`text-[10px] tabular-nums truncate ${overdue ? "text-red-600" : "text-neutral-400"}`}>{span}</p>
      </a>
      <div className="relative">
        <MonthLines />
        {isRange(start, end) ? (
          <div
            title={`${name}: ${span}`}
            className={`absolute top-1/2 -translate-y-1/2 h-3 ${startedBefore ? "" : "rounded-l-full"} ${endsAfter ? "" : "rounded-r-full"} ${color}`}
            style={{ left: `${left}%`, width: `max(${right - left}%, 6px)` }}
          >
            {startedBefore && <Chevron direction="left" />}
            {endsAfter && <Chevron direction="right" />}
          </div>
        ) : (
          <div
            title={`${name}: ${span}`}
            className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-2.5 h-2.5 rotate-45 ${color}`}
            style={{ left: `${yearFraction(start, year, 0.5) * 100}%` }}
          />
        )}
      </div>
    </div>
  );
}

function YearChart({
  year,
  today,
  goals,
  projects,
}: {
  year: number;
  today: string;
  goals: GoalOverview[];
  projects: Project[];
}) {
  const showToday = Number(today.slice(0, 4)) === year;
  const startedEarlier = (start: string | null) => Number(start?.slice(0, 4)) < year;
  const earlierGoals = goals.filter((goal) => startedEarlier(goal.startDate));
  const earlierProjects = projects.filter((project) => startedEarlier(project.startDate));
  const newGoals = goals.filter((goal) => !startedEarlier(goal.startDate));
  const newProjects = projects.filter((project) => !startedEarlier(project.startDate));
  const goalRow = (goal: GoalOverview) => (
    <ChartRow
      key={goal.id}
      id={goal.id}
      name={goal.name}
      start={goal.startDate!}
      end={goal.byWhen!}
      year={year}
      today={today}
      isGoal
    />
  );
  const projectRow = (project: Project) => (
    <ChartRow
      key={project.id}
      id={project.id}
      name={project.name}
      start={project.startDate!}
      end={project.dueDate!}
      year={year}
      today={today}
      isGoal={false}
    />
  );
  const rowGroup = (label: string, rows: ReactNode) => (
    <>
      <p className="pt-3 pb-1 text-[10px] text-neutral-500 uppercase tracking-wider font-medium">{label}</p>
      <div className="flex flex-col">{rows}</div>
    </>
  );

  return (
    <section className="hidden sm:block relative">
      <div className="grid grid-cols-[180px_1fr] lg:grid-cols-[240px_1fr] border-b border-neutral-200">
        <div />
        <div>
          <div className="grid grid-cols-4">
            {["Q1", "Q2", "Q3", "Q4"].map((quarter) => (
              <p key={quarter} className="pl-1 text-xs font-semibold text-neutral-900">{quarter}</p>
            ))}
          </div>
          <div className="grid grid-cols-12 mt-1 pb-1">
            {MONTH_INITIALS.map((month) => (
              <p key={month} className="pl-1 text-[10px] text-neutral-400">{month}</p>
            ))}
          </div>
        </div>
      </div>

      {earlierGoals.length + earlierProjects.length > 0 && rowGroup(
        "Continuing from before " + year,
        [...earlierGoals.map(goalRow), ...earlierProjects.map(projectRow)],
      )}

      {newGoals.length > 0 && rowGroup("Goals", newGoals.map(goalRow))}

      {newProjects.length > 0 && rowGroup("Projects", newProjects.map(projectRow))}

      {goals.length + projects.length === 0 && (
        <p className="py-6 text-xs text-neutral-400">Nothing dated in {year}.</p>
      )}

      {showToday && (
        <div aria-hidden className="absolute inset-0 grid grid-cols-[180px_1fr] lg:grid-cols-[240px_1fr] pointer-events-none">
          <div />
          <div className="relative">
            <div
              className="absolute top-0 bottom-0 w-px bg-blue-500"
              style={{ left: `${yearFraction(today, year) * 100}%` }}
            />
          </div>
        </div>
      )}
    </section>
  );
}

function Tile({
  id,
  name,
  start,
  end,
  year,
  today,
  detail,
}: {
  id: string;
  name: string;
  start: string | null;
  end: string | null;
  year: number;
  today: string;
  detail?: string;
}) {
  const overdue = end !== null && end < today;
  return (
    <a
      href={notionUrl(id)}
      target="_blank"
      rel="noopener noreferrer"
      className="block rounded-lg bg-white border border-neutral-100 px-2.5 py-2 hover:border-neutral-300 transition-colors"
    >
      <p className="text-xs font-medium text-neutral-900 line-clamp-3 break-words">{name}</p>
      {detail && <p className="text-[10px] text-neutral-500 mt-0.5 line-clamp-2 break-words">{detail}</p>}
      {end && (
        <p className={`text-[10px] mt-0.5 tabular-nums ${overdue ? "text-red-600" : "text-neutral-400"}`}>
          {!isRange(start, end) && (overdue ? "Was due " : "Due ")}
          {formatSpan(start, end, year)}
        </p>
      )}
    </a>
  );
}

function Items({
  goals,
  projects,
  goalNames,
  year,
  today,
}: {
  goals: GoalOverview[];
  projects: Project[];
  goalNames: (project: Project) => string[];
  year: number;
  today: string;
}) {
  return (
    <>
      {goals.map((goal) => (
        <Tile
          key={goal.id}
          id={goal.id}
          name={goal.name}
          start={goal.startDate}
          end={goal.byWhen}
          year={year}
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
            start={project.startDate}
            end={project.dueDate}
            year={year}
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

      <YearChart year={year} today={today} goals={timeline.chartGoals} projects={timeline.chartProjects} />

      {hasQuarterGoals && (
        <section className="flex flex-col gap-3 sm:hidden">
          <h2 className="text-xs text-neutral-500 uppercase tracking-wider font-medium">Quarters</h2>
          <div className="grid grid-cols-2 gap-2 items-start">
            {timeline.quarters.map((quarter) => (
              <Cell key={quarter.quarter} label={quarter.label} isCurrent={quarter.isCurrent} count={quarter.goals.length}>
                <Items goals={quarter.goals} projects={[]} goalNames={goalNames} year={year} today={today} />
              </Cell>
            ))}
          </div>
        </section>
      )}

      <section className="flex flex-col gap-3 sm:hidden">
        <h2 className="text-xs text-neutral-500 uppercase tracking-wider font-medium">Months</h2>
        <div className="grid grid-cols-2 gap-2">
          {timeline.months.map((month) => (
            <Cell
              key={month.month}
              label={month.label}
              isCurrent={month.isCurrent}
              count={month.goals.length + month.projects.length}
            >
              <Items goals={month.goals} projects={month.projects} goalNames={goalNames} year={year} today={today} />
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
            <Items goals={timeline.undatedGoals} projects={timeline.undatedProjects} goalNames={goalNames} year={year} today={today} />
          </div>
        </section>
      )}
    </div>
  );
}
