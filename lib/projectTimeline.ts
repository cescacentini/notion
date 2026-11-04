import type { GoalOverview, Project, ProjectsOverview } from "@/lib/notion";

export interface MonthBucket {
  month: number;
  label: string;
  isCurrent: boolean;
  goals: GoalOverview[];
  projects: Project[];
}

export interface QuarterBucket {
  quarter: number;
  label: string;
  isCurrent: boolean;
  goals: GoalOverview[];
}

export interface YearTimeline {
  goals: GoalOverview[];
  quarters: QuarterBucket[];
  months: MonthBucket[];
  chartGoals: GoalOverview[];
  chartProjects: Project[];
  undatedGoals: GoalOverview[];
  undatedProjects: Project[];
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const yearOf = (date: string) => Number(date.slice(0, 4));
const monthOf = (date: string) => Number(date.slice(5, 7));
const quarterOf = (month: number) => Math.ceil(month / 3);
const monthKey = (year: number, month: number) => `${year}-${String(month).padStart(2, "0")}`;

function coversMonth(start: string | null, end: string | null, year: number, month: number) {
  if (!start || !end) return false;
  const key = monthKey(year, month);
  return start.slice(0, 7) <= key && key <= end.slice(0, 7);
}

function coversYear(start: string | null, end: string | null, year: number) {
  return !!start && !!end && yearOf(start) <= year && year <= yearOf(end);
}

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

export function timelineYears(overview: ProjectsOverview, today: string) {
  const counts = new Map<number, number>([[yearOf(today), 0]]);
  const spans = [
    ...overview.goals.map((goal) => [goal.startDate, goal.byWhen]),
    ...activeProjects(overview).map((project) => [project.startDate, project.dueDate]),
  ];
  for (const [start, end] of spans) {
    if (!start || !end) continue;
    // A project that runs across years counts in each of them.
    for (let year = yearOf(start); year <= yearOf(end); year++) {
      counts.set(year, (counts.get(year) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([year, count]) => ({ year, count }))
    .sort((a, b) => a.year - b.year);
}

export function buildYearTimeline(overview: ProjectsOverview, year: number, today: string): YearTimeline {
  const isCurrentYear = yearOf(today) === year;
  const currentMonth = monthOf(today);
  const goalsInYear = overview.goals.filter((goal) => coversYear(goal.startDate, goal.byWhen, year));
  const projects = activeProjects(overview);
  const projectsInYear = projects.filter((project) => coversYear(project.startDate, project.dueDate, year));
  const monthGoals = goalsInYear.filter((goal) => goal.type !== "yearly" && goal.type !== "quaterly");

  const months: MonthBucket[] = MONTHS.map((label, index) => {
    const month = index + 1;
    return {
      month,
      label,
      isCurrent: isCurrentYear && month === currentMonth,
      // Goals without a recognised type sit at the months of their date.
      goals: monthGoals.filter((goal) => coversMonth(goal.startDate, goal.byWhen, year, month)),
      projects: projectsInYear.filter((project) => coversMonth(project.startDate, project.dueDate, year, month)),
    };
  });

  const quarters: QuarterBucket[] = [1, 2, 3, 4].map((quarter) => ({
    quarter,
    label: `Q${quarter}`,
    isCurrent: isCurrentYear && quarter === quarterOf(currentMonth),
    goals: goalsInYear.filter((goal) =>
      goal.type === "quaterly" &&
      [0, 1, 2].some((offset) => coversMonth(goal.startDate, goal.byWhen, year, (quarter - 1) * 3 + 1 + offset))
    ),
  }));

  const byStart = (a: { startDate: string | null }, b: { startDate: string | null }) =>
    (a.startDate ?? "").localeCompare(b.startDate ?? "");

  return {
    goals: goalsInYear.filter((goal) => goal.type === "yearly"),
    quarters,
    months,
    chartGoals: goalsInYear.filter((goal) => goal.type !== "yearly").sort(byStart),
    chartProjects: [...projectsInYear].sort(byStart),
    undatedGoals: overview.goals.filter((goal) => !goal.byWhen),
    undatedProjects: projects.filter((project) => !project.dueDate),
  };
}
