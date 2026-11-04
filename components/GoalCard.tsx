import type { GoalOverview } from "@/lib/notion";
import ProjectRow from "@/components/ProjectRow";

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}

export default function GoalCard({ goal, compact = false }: { goal: GoalOverview; compact?: boolean }) {
  const today = new Date().toISOString().split("T")[0];
  const overdue = goal.byWhen !== null && goal.byWhen < today;

  return (
    <article className="bg-neutral-50 rounded-2xl p-3 flex flex-col gap-2">
      <div className="px-1 pt-1">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-sm font-semibold text-neutral-900 min-w-0">{goal.name}</h3>
          <a
            href={`https://notion.so/${goal.id.replace(/-/g, "")}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Open ${goal.name} in Notion`}
            className="flex-shrink-0 text-neutral-400 hover:text-neutral-700"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
          </a>
        </div>
        <p className="text-xs text-neutral-500 mt-0.5">
          {goal.status}
          {goal.byWhen && (
            <span className={overdue ? "text-red-600" : undefined}>
              {" · "}{overdue ? "Was due" : "By"} {formatDate(goal.byWhen)}
            </span>
          )}
        </p>
        {goal.progress !== null && (
          <div className="mt-2">
            <div className="h-1.5 bg-neutral-200 rounded-full overflow-hidden">
              <div className="h-full bg-neutral-900 rounded-full" style={{ width: `${goal.progress * 100}%` }} />
            </div>
            <p className="text-[11px] text-neutral-500 mt-1 tabular-nums">
              {Math.round(goal.progress * 100)}% · {goal.doneProjects} of {goal.totalProjects} project{goal.totalProjects !== 1 ? "s" : ""} done
            </p>
          </div>
        )}
      </div>

      {!compact && goal.activeProjects.map((project) => <ProjectRow key={project.id} project={project} />)}

      {!compact && goal.activeProjects.length === 0 && (
        <p className="px-1 pb-1 text-xs text-neutral-400">
          {goal.totalProjects === 0 ? "No projects linked yet." : "No active projects right now."}
        </p>
      )}
    </article>
  );
}
