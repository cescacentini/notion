import ProjectRow from "@/components/ProjectRow";
import type { GoalOverview, Project, ProjectsOverview } from "@/lib/notion";
import {
  buildGoalTimeline,
  formatSpan,
  isRange,
  windowFraction,
  type GoalGroup,
  type TimelineMonth,
} from "@/lib/projectTimeline";

const notionUrl = (id: string) => `https://notion.so/${id.replace(/-/g, "")}`;
const NAME_COLUMN = "grid-cols-[200px_1fr] lg:grid-cols-[260px_1fr]";

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

function MonthLines({ months }: { months: TimelineMonth[] }) {
  return (
    <div aria-hidden className="absolute inset-0 grid grid-cols-12">
      {months.map((month) => (
        <div
          key={`${month.year}-${month.month}`}
          className={`border-l ${month.month % 3 === 1 ? "border-neutral-200" : "border-neutral-100"}`}
        />
      ))}
    </div>
  );
}

// A bar from start to end across the window, or a diamond for a single date.
function Bar({
  label,
  start,
  end,
  months,
  thin,
  color,
}: {
  label: string;
  start: string;
  end: string;
  months: TimelineMonth[];
  thin: boolean;
  color: string;
}) {
  if (!isRange(start, end)) {
    return (
      <div
        title={label}
        className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-2.5 h-2.5 rotate-45 ${color}`}
        style={{ left: `${windowFraction(start, months, 0.5) * 100}%` }}
      />
    );
  }
  const left = windowFraction(start, months) * 100;
  const right = windowFraction(end, months, 1) * 100;
  const startsBefore = start.slice(0, 7) < monthKey(months[0]);
  const endsAfter = end.slice(0, 7) > monthKey(months[months.length - 1]);
  return (
    <div
      title={label}
      className={`absolute top-1/2 -translate-y-1/2 ${thin ? "h-1.5" : "h-3"} ${startsBefore ? "" : "rounded-l-full"} ${endsAfter ? "" : "rounded-r-full"} ${color}`}
      style={{ left: `${left}%`, width: `max(${right - left}%, 6px)` }}
    >
      {!thin && startsBefore && <Chevron direction="left" />}
      {!thin && endsAfter && <Chevron direction="right" />}
    </div>
  );
}

const monthKey = (month: TimelineMonth) => `${month.year}-${String(month.month).padStart(2, "0")}`;

function GoalHeading({ goal, months, today }: { goal: GoalOverview | null; months: TimelineMonth[]; today: string }) {
  const year = Number(today.slice(0, 4));
  if (!goal) {
    return (
      <div className={`grid ${NAME_COLUMN} pt-5 pb-1`}>
        <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">No goal</p>
      </div>
    );
  }
  const passed = goal.byWhen !== null && goal.byWhen < today;
  const start = goal.startDate ?? goal.byWhen;
  return (
    <div className={`grid ${NAME_COLUMN} items-stretch pt-5`}>
      <a href={notionUrl(goal.id)} target="_blank" rel="noopener noreferrer" className="pr-3 py-1 min-w-0">
        <p className="text-sm font-semibold text-neutral-900 truncate">{goal.name}</p>
        <p className={`text-[10px] tabular-nums truncate ${passed ? "text-red-600" : "text-neutral-500"}`}>
          {goal.byWhen ? (passed ? "Date passed · " : "By ") + formatSpan(goal.byWhen, goal.byWhen, year) : "No date"}
          {goal.progress !== null && ` · ${Math.round(goal.progress * 100)}%`}
        </p>
      </a>
      <div className="relative">
        <MonthLines months={months} />
        {start && goal.byWhen && !passed && (
          <Bar
            label={`${goal.name}: ${formatSpan(start, goal.byWhen, year)}`}
            start={start}
            end={goal.byWhen}
            months={months}
            thin
            color="bg-neutral-400"
          />
        )}
      </div>
    </div>
  );
}

function ProjectBarRow({ project, months, today }: { project: Project; months: TimelineMonth[]; today: string }) {
  const start = project.startDate ?? project.dueDate!;
  const span = formatSpan(start, project.dueDate, Number(today.slice(0, 4)));
  const onHold = project.status === "On Hold";
  return (
    <div className={`grid ${NAME_COLUMN} items-stretch hover:bg-neutral-50 transition-colors`}>
      <a href={notionUrl(project.id)} target="_blank" rel="noopener noreferrer" className="pl-4 pr-3 py-1.5 min-w-0">
        <p className="text-xs font-medium text-neutral-900 truncate">{project.name}</p>
        <p className="text-[10px] text-neutral-400 tabular-nums truncate">
          {span}
          {onHold && " · On hold"}
        </p>
      </a>
      <div className="relative">
        <MonthLines months={months} />
        <Bar
          label={`${project.name}: ${span}`}
          start={start}
          end={project.dueDate!}
          months={months}
          thin={false}
          color={onHold ? "bg-neutral-400" : "bg-neutral-900"}
        />
      </div>
    </div>
  );
}

function Timeline({ groups, months, today }: { groups: GoalGroup[]; months: TimelineMonth[]; today: string }) {
  const quarters = months.filter((month) => month.month % 3 === 1);
  return (
    <section className="hidden sm:block relative">
      <div className={`grid ${NAME_COLUMN} border-b border-neutral-200 sticky top-0 bg-white z-10`}>
        <div />
        <div>
          <div className="grid grid-cols-4">
            {quarters.map((month) => (
              <p key={monthKey(month)} className="pl-1 text-xs font-semibold text-neutral-900">
                Q{Math.ceil(month.month / 3)} {month.year}
              </p>
            ))}
          </div>
          <div className="grid grid-cols-12 mt-1 pb-1">
            {months.map((month) => (
              <p key={monthKey(month)} className="pl-1 text-[10px] text-neutral-400">{month.label}</p>
            ))}
          </div>
        </div>
      </div>

      {groups.map((group) => (
        <div key={group.goal?.id ?? "no-goal"}>
          <GoalHeading goal={group.goal} months={months} today={today} />
          {group.projects.map((project) => (
            <ProjectBarRow key={project.id} project={project} months={months} today={today} />
          ))}
        </div>
      ))}

      <div aria-hidden className={`absolute inset-0 grid ${NAME_COLUMN} pointer-events-none`}>
        <div />
        <div className="relative">
          <div
            className="absolute top-0 bottom-0 w-px bg-blue-500"
            style={{ left: `${windowFraction(today, months, 0.5) * 100}%` }}
          />
        </div>
      </div>
    </section>
  );
}

// Phones get the same grouping as a list.
function GroupList({ groups, today }: { groups: GoalGroup[]; today: string }) {
  const year = Number(today.slice(0, 4));
  return (
    <section className="flex flex-col gap-6 sm:hidden">
      {groups.map((group) => (
        <div key={group.goal?.id ?? "no-goal"} className="flex flex-col gap-2">
          {group.goal ? (
            <a href={notionUrl(group.goal.id)} target="_blank" rel="noopener noreferrer">
              <h2 className="text-sm font-semibold text-neutral-900">{group.goal.name}</h2>
              <p className={`text-xs tabular-nums ${group.goal.byWhen && group.goal.byWhen < today ? "text-red-600" : "text-neutral-500"}`}>
                {group.goal.byWhen
                  ? `${group.goal.byWhen < today ? "Date passed · " : "By "}${formatSpan(group.goal.byWhen, group.goal.byWhen, year)}`
                  : "No date"}
                {group.goal.progress !== null && ` · ${Math.round(group.goal.progress * 100)}%`}
              </p>
            </a>
          ) : (
            <h2 className="text-xs text-neutral-500 uppercase tracking-wider font-medium">No goal</h2>
          )}
          {group.projects.map((project) => <ProjectRow key={project.id} project={project} />)}
        </div>
      ))}
    </section>
  );
}

function Chip({ id, name, detail, urgent }: { id: string; name: string; detail: string; urgent?: boolean }) {
  return (
    <a
      href={notionUrl(id)}
      target="_blank"
      rel="noopener noreferrer"
      className="block rounded-lg bg-white border border-neutral-200 px-2.5 py-1.5 hover:border-neutral-400 transition-colors min-w-0"
    >
      <p className="text-xs font-medium text-neutral-900 truncate">{name}</p>
      <p className={`text-[10px] tabular-nums truncate ${urgent ? "text-red-600" : "text-neutral-400"}`}>{detail}</p>
    </a>
  );
}

export default function ProjectsTimeline({ overview }: { overview: ProjectsOverview }) {
  const today = new Date().toISOString().split("T")[0];
  const year = Number(today.slice(0, 4));
  const timeline = buildGoalTimeline(overview, today);
  const pastCount = timeline.needsDate.goals.length + timeline.needsDate.projects.length;
  const undatedCount = timeline.undated.goals.length + timeline.undated.projects.length;

  return (
    <div className="flex flex-col gap-8">
      {pastCount > 0 && (
        <section className="rounded-2xl bg-red-50/60 p-4 flex flex-col gap-3">
          <div>
            <h2 className="text-sm font-semibold text-neutral-900">
              Needs a new date <span className="font-normal text-neutral-500 tabular-nums">{pastCount}</span>
            </h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              Still open, but the date has passed. Open one in Notion to give it a new date or close it.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {timeline.needsDate.goals.map((goal) => (
              <Chip key={goal.id} id={goal.id} name={goal.name} detail={`Goal · was due ${formatSpan(goal.byWhen, goal.byWhen, year)}`} urgent />
            ))}
            {timeline.needsDate.projects.map((project) => (
              <Chip key={project.id} id={project.id} name={project.name} detail={`Was due ${formatSpan(project.dueDate, project.dueDate, year)}`} urgent />
            ))}
          </div>
        </section>
      )}

      <Timeline groups={timeline.groups} months={timeline.months} today={today} />
      <GroupList groups={timeline.groups} today={today} />

      {timeline.groups.length === 0 && (
        <p className="text-sm text-neutral-400">Nothing dated from this quarter on.</p>
      )}

      {undatedCount > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-xs text-neutral-500 uppercase tracking-wider font-medium">
            No date <span className="ml-1 font-normal text-neutral-400 tabular-nums">{undatedCount}</span>
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {timeline.undated.goals.map((goal) => (
              <Chip key={goal.id} id={goal.id} name={goal.name} detail="Goal" />
            ))}
            {timeline.undated.projects.map((project) => (
              <Chip key={project.id} id={project.id} name={project.name} detail={project.status} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
