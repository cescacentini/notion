import type { GoalOverview, Project, ProjectsOverview } from "@/lib/notion";

export const WINDOW_MONTHS = 12;

export interface TimelineMonth {
  year: number;
  month: number;
  label: string;
}

// A goal with the projects drawn under it; goal is null for projects without an open goal.
export interface GoalGroup {
  goal: GoalOverview | null;
  projects: Project[];
}

export interface GoalTimeline {
  months: TimelineMonth[];
  needsDate: { goals: GoalOverview[]; projects: Project[] };
  groups: GoalGroup[];
  undated: { goals: GoalOverview[]; projects: Project[] };
}

const MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const yearOf = (date: string) => Number(date.slice(0, 4));
const monthOf = (date: string) => Number(date.slice(5, 7));
const quarterOf = (month: number) => Math.ceil(month / 3);

function formatDay(date: string, withYear: boolean) {
  return new Date(date).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    ...(withYear ? { year: "numeric" } : {}),
    timeZone: "UTC",
  });
}

export function isRange(start: string | null, end: string | null) {
  return !!start && !!end && start.slice(0, 10) !== end.slice(0, 10);
}

export function formatSpan(start: string | null, end: string | null, year: number) {
  if (!start || !end) return "";
  if (!isRange(start, end)) return formatDay(end, yearOf(end) !== year);
  const showYears = yearOf(start) !== year || yearOf(end) !== year;
  return `${formatDay(start, showYears)} – ${formatDay(end, showYears)}`;
}

export function activeProjects(overview: ProjectsOverview): Project[] {
  const byId = new Map<string, Project>();
  for (const goal of overview.goals) {
    for (const project of goal.activeProjects) byId.set(project.id, project);
  }
  for (const project of overview.withoutGoal) byId.set(project.id, project);
  return [...byId.values()];
}

// Where a date sits across the window, from 0 (its first day) to 1 (past its last).
// Months are equal-width columns, so a date is placed within its own month;
// dayOffset says how far through the day to measure: 0 is its start, 1 its end.
export function windowFraction(date: string, months: TimelineMonth[], dayOffset = 0) {
  const year = yearOf(date);
  const month = monthOf(date);
  const index = (year - months[0].year) * 12 + (month - months[0].month);
  if (index < 0) return 0;
  if (index >= months.length) return 1;
  const day = Number(date.slice(8, 10));
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return (index + (day - 1 + dayOffset) / daysInMonth) / months.length;
}

export function buildGoalTimeline(overview: ProjectsOverview, today: string): GoalTimeline {
  // The window starts at the current quarter and runs for a year.
  const firstMonth = (quarterOf(monthOf(today)) - 1) * 3;
  const months = Array.from({ length: WINDOW_MONTHS }, (_, i) => {
    const offset = firstMonth + i;
    return {
      year: yearOf(today) + Math.floor(offset / 12),
      month: (offset % 12) + 1,
      label: MONTH_SHORT[offset % 12],
    };
  });

  const isPast = (end: string | null) => end !== null && end.slice(0, 10) < today;
  const onTimeline = (project: Project) => project.dueDate !== null && !isPast(project.dueDate);
  const byStart = (a: Project, b: Project) =>
    (a.startDate ?? a.dueDate ?? "").localeCompare(b.startDate ?? b.dueDate ?? "");

  // Goals arrive sorted by deadline. A project linked to several goals is drawn under the first.
  const drawn = new Set<string>();
  const groups: GoalGroup[] = [];
  for (const goal of overview.goals) {
    const projects = goal.activeProjects.filter((project) => onTimeline(project) && !drawn.has(project.id));
    projects.forEach((project) => drawn.add(project.id));
    // A goal that is undated or past its date only gets a row when it has projects to hold.
    if ((!goal.byWhen || isPast(goal.byWhen)) && projects.length === 0) continue;
    groups.push({ goal, projects: projects.sort(byStart) });
  }
  const withoutGoal = overview.withoutGoal.filter(onTimeline);
  if (withoutGoal.length > 0) groups.push({ goal: null, projects: withoutGoal.sort(byStart) });

  const grouped = new Set(groups.flatMap((group) => (group.goal ? [group.goal.id] : [])));
  const projects = activeProjects(overview);

  return {
    months,
    needsDate: {
      goals: overview.goals.filter((goal) => isPast(goal.byWhen)),
      projects: projects.filter((project) => isPast(project.dueDate)),
    },
    groups,
    undated: {
      goals: overview.goals.filter((goal) => !goal.byWhen && !grouped.has(goal.id)),
      projects: projects.filter((project) => !project.dueDate),
    },
  };
}
