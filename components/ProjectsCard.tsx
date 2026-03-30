import type { Project } from "@/lib/notion";

function statusBadge(status: string) {
  switch (status) {
    case "In progress":
      return "bg-neutral-900 text-white";
    case "On Hold":
      return "bg-neutral-200 text-neutral-700";
    default:
      return "bg-neutral-100 text-neutral-500";
  }
}

export default function ProjectsCard({ projects }: { projects: Project[] }) {
  return (
    <div className="border border-neutral-100 rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-neutral-100">
        <p className="text-xs text-neutral-400 uppercase tracking-wider font-medium">
          Projects
        </p>
      </div>
      {projects.length === 0 ? (
        <div className="px-4 py-4">
          <p className="text-sm text-neutral-400">No active projects</p>
        </div>
      ) : (
        <div className="divide-y divide-neutral-100">
          {projects.map((project) => {
            const pct = project.totalTasks > 0
              ? project.doneTasks / project.totalTasks
              : 0;
            return (
              <div key={project.id} className="px-4 py-3">
                <div className="flex items-center justify-between gap-3 mb-2">
                  <p className="text-sm font-medium text-neutral-900 truncate flex-1">
                    {project.name}
                  </p>
                  <span
                    className={`shrink-0 text-[10px] font-medium px-2 py-0.5 rounded-full ${statusBadge(project.status)}`}
                  >
                    {project.status}
                  </span>
                </div>
                {project.totalTasks > 0 ? (
                  <>
                    <div className="h-1 bg-neutral-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-neutral-900 rounded-full transition-all"
                        style={{ width: `${pct * 100}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-neutral-400 mt-1">
                      {project.doneTasks}/{project.totalTasks} tasks
                    </p>
                  </>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
