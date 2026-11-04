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
  months: MonthBucket[];
  count: number;
}

export interface YearTimeline {
  goals: GoalOverview[];
  quarters: QuarterBucket[];
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
  const currentQuarter = quarterOf(currentMonth);
  const goalsInYear = overview.goals.filter((goal) => goal.byWhen && yearOf(goal.byWhen) === year);
  const projects = activeProjects(overview);
  const projectsInYear = projects.filter((project) => project.dueDate && yearOf(project.dueDate) === year);

  const quarters: QuarterBucket[] = [1, 2, 3, 4].map((quarter) => {
    const months: MonthBucket[] = [0, 1, 2].map((offset) => {
      const month = (quarter - 1) * 3 + 1 + offset;
      return {
        month,
        label: MONTHS[month - 1],
        isCurrent: isCurrentYear && month === currentMonth,
        // Goals without a recognised type sit at the month of their date.
        goals: goalsInYear.filter((goal) =>
          goal.type !== "yearly" && goal.type !== "quaterly" && monthOf(goal.byWhen!) === month
        ),
        projects: projectsInYear.filter((project) => monthOf(project.dueDate!) === month),
      };
    }).filter((bucket) => bucket.isCurrent || bucket.goals.length + bucket.projects.length > 0);

    const goals = goalsInYear.filter((goal) =>
      goal.type === "quaterly" && quarterOf(monthOf(goal.byWhen!)) === quarter
    );
    return {
      quarter,
      label: `Q${quarter}`,
      isCurrent: isCurrentYear && quarter === currentQuarter,
      goals,
      months,
      count: goals.length + months.reduce((sum, bucket) => sum + bucket.goals.length + bucket.projects.length, 0),
    };
  }).filter((bucket) => bucket.isCurrent || bucket.count > 0);

  // In the current year, what's coming up reads first; earlier quarters follow.
  const ordered = isCurrentYear
    ? [
        ...quarters.filter((bucket) => bucket.quarter >= currentQuarter),
        ...quarters.filter((bucket) => bucket.quarter < currentQuarter),
      ]
    : quarters;

  return {
    goals: goalsInYear.filter((goal) => goal.type === "yearly"),
    quarters: ordered,
    undatedGoals: overview.goals.filter((goal) => !goal.byWhen),
    undatedProjects: projects.filter((project) => !project.dueDate),
  };
}
