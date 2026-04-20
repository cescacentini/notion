"use client";

import { useState } from "react";
import type { Project, Task } from "@/lib/notion";

const PRIORITY_STYLE: Record<string, string> = {
  High:   "bg-neutral-900/10 text-neutral-900",
  Medium: "bg-neutral-100 text-neutral-600",
  Low:    "bg-neutral-50 text-neutral-400",
};

function statusBadge(status: string) {
  return status === "In progress"
    ? "bg-neutral-900 text-white"
    : "bg-neutral-200 text-neutral-700";
}

function ProjectRow({ project }: { project: Project }) {
  const [open, setOpen] = useState(false);
  const [tasks, setTasks] = useState<Task[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [pending, setPending] = useState<string | null>(null);

  const pct = project.totalTasks > 0 ? project.doneTasks / project.totalTasks : 0;

  async function toggle() {
    if (!open && tasks === null) {
      setLoading(true);
      try {
        const res = await fetch(`/api/projects/${project.id}/tasks`);
        const data = await res.json();
        setTasks(Array.isArray(data) ? data : []);
      } catch {
        setTasks([]);
      } finally {
        setLoading(false);
      }
    }
    setOpen((o) => !o);
  }

  async function markDone(taskId: string) {
    if (pending) return;
    setPending(taskId);
    setTasks((t) => t?.map((x) => x.id === taskId ? { ...x, status: "Done" } : x) ?? null);
    try {
      await fetch(`/api/tasks/${taskId}`, { method: "PATCH" });
    } catch { /* ignore */ }
    finally { setPending(null); }
  }

  const activeTasks = tasks?.filter((t) => t.status !== "Done") ?? [];
  const doneTasks = tasks?.filter((t) => t.status === "Done") ?? [];

  return (
    <div className="border border-neutral-100 rounded-xl overflow-hidden">
      <button
        onClick={toggle}
        className="w-full px-4 py-3 flex items-start gap-3 hover:bg-neutral-50 transition-colors text-left"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-3 mb-2">
            <p className="text-sm font-medium text-neutral-900 truncate">{project.name}</p>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${statusBadge(project.status)}`}>
                {project.status}
              </span>
              <svg
                width="14" height="14" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2"
                className={`text-neutral-300 transition-transform ${open ? "rotate-180" : ""}`}
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
            </div>
          </div>
          {project.totalTasks > 0 && (
            <>
              <div className="h-1 bg-neutral-100 rounded-full overflow-hidden">
                <div className="h-full bg-neutral-900 rounded-full transition-all" style={{ width: `${pct * 100}%` }} />
              </div>
              <p className="text-[10px] text-neutral-400 mt-1">{project.doneTasks}/{project.totalTasks} tasks</p>
            </>
          )}
        </div>
      </button>

      {open && (
        <div className="border-t border-neutral-100 px-4 py-3 flex flex-col gap-1 bg-neutral-50/50">
          {loading && <p className="text-xs text-neutral-400 py-2">Loading tasks...</p>}

          {!loading && tasks !== null && activeTasks.length === 0 && doneTasks.length === 0 && (
            <p className="text-xs text-neutral-400 py-2">No tasks linked to this project.</p>
          )}

          {activeTasks.map((task) => (
            <div key={task.id} className="flex items-center gap-2.5 py-1.5">
              <button
                onClick={() => markDone(task.id)}
                disabled={!!pending}
                className="w-4 h-4 rounded border-2 border-neutral-300 flex-shrink-0 hover:border-neutral-600 transition-colors"
                aria-label="Mark done"
              />
              <span className="text-sm text-neutral-800 flex-1 min-w-0 truncate">{task.name}</span>
              {task.priority && (
                <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded flex-shrink-0 ${PRIORITY_STYLE[task.priority] ?? ""}`}>
                  {task.priority}
                </span>
              )}
            </div>
          ))}

          {doneTasks.length > 0 && (
            <div className="mt-1 pt-1 border-t border-neutral-100">
              {doneTasks.map((task) => (
                <div key={task.id} className="flex items-center gap-2.5 py-1.5 opacity-40">
                  <div className="w-4 h-4 rounded border-2 bg-neutral-300 border-neutral-300 flex items-center justify-center flex-shrink-0">
                    <svg width="8" height="8" viewBox="0 0 12 12" fill="none" stroke="white" strokeWidth="2.5">
                      <path d="M2 6l3 3 5-5" />
                    </svg>
                  </div>
                  <span className="text-sm text-neutral-500 line-through flex-1 min-w-0 truncate">{task.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ProjectsCard({ projects }: { projects: Project[] }) {
  if (projects.length === 0) {
    return (
      <div className="border border-neutral-100 rounded-xl px-4 py-4">
        <p className="text-sm text-neutral-400">No active projects.</p>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-2">
      {projects.map((p) => <ProjectRow key={p.id} project={p} />)}
    </div>
  );
}
