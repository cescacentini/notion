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
  const dates = [
    ...overview.goals.map((goal) => goal.byWhen),
    ...activeProjects(overview).map((project) => project.dueDate),
  ];
  for (const date of dates) {
    if (date) counts.set(yearOf(date), (counts.get(yearOf(date)) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([year, count]) => ({ year, count }))
    .sort((a, b) => a.year - b.year);
}

export function buildYearTimeline(overview: ProjectsOverview, year: number, today: string): YearTimeline {
  const isCurrentYear = yearOf(today) === year;
  const currentMonth = monthOf(today);
  const goalsInYear = overview.goals.filter((goal) => goal.byWhen && yearOf(goal.byWhen) === year);
  const projects = activeProjects(overview);
  const projectsInYear = projects.filter((project) => project.dueDate && yearOf(project.dueDate) === year);

  const months: MonthBucket[] = MONTHS.map((label, index) => {
    const month = index + 1;
    return {
      month,
      label,
      isCurrent: isCurrentYear && month === currentMonth,
      // Goals without a recognised type sit at the month of their date.
      goals: goalsInYear.filter((goal) =>
        goal.type !== "yearly" && goal.type !== "quaterly" && monthOf(goal.byWhen!) === month
      ),
      projects: projectsInYear.filter((project) => monthOf(project.dueDate!) === month),
    };
  });

  const quarters: QuarterBucket[] = [1, 2, 3, 4].map((quarter) => ({
    quarter,
    label: `Q${quarter}`,
    isCurrent: isCurrentYear && quarter === quarterOf(currentMonth),
    goals: goalsInYear.filter((goal) =>
      goal.type === "quaterly" && quarterOf(monthOf(goal.byWhen!)) === quarter
    ),
  }));

  return {
    goals: goalsInYear.filter((goal) => goal.type === "yearly"),
    quarters,
    months,
    undatedGoals: overview.goals.filter((goal) => !goal.byWhen),
    undatedProjects: projects.filter((project) => !project.dueDate),
  };
}
