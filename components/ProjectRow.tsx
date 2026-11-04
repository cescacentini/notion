"use client";

import { useState } from "react";
import type { Project, Resource, Task } from "@/lib/notion";

const PRIORITY_STYLE: Record<string, string> = {
  Urgent: "bg-red-50 text-red-700",
  High:   "bg-neutral-900/10 text-neutral-900",
  Medium: "bg-neutral-100 text-neutral-600",
  Low:    "bg-neutral-50 text-neutral-400",
};

function statusBadge(status: string) {
  return status === "In progress"
    ? "bg-neutral-900 text-white"
    : "bg-neutral-200 text-neutral-700";
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}

async function fetchList<T>(url: string): Promise<T[] | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export default function ProjectRow({ project }: { project: Project }) {
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [pending, setPending] = useState<string | null>(null);

  const pct = project.totalTasks > 0 ? project.doneTasks / project.totalTasks : 0;

  async function toggle() {
    if (!open && !loaded) {
      setLoading(true);
      setFailed(false);
      const [taskList, resourceList] = await Promise.all([
        fetchList<Task>(`/api/projects/${project.id}/tasks`),
        fetchList<Resource>(`/api/projects/${project.id}/resources`),
      ]);
      setTasks(taskList ?? []);
      setResources(resourceList ?? []);
      if (taskList && resourceList) setLoaded(true);
      else setFailed(true);
      setLoading(false);
    }
    setOpen((o) => !o);
  }

  async function markDone(taskId: string) {
    if (pending) return;
    setPending(taskId);
    setTasks((t) => t.map((x) => x.id === taskId ? { ...x, status: "Done" } : x));
    try {
      await fetch(`/api/tasks/${taskId}`, { method: "PATCH" });
    } catch { /* ignore */ }
    finally { setPending(null); }
  }

  const activeTasks = tasks.filter((t) => t.status !== "Done");
  const doneTasks = tasks.filter((t) => t.status === "Done");

  return (
    <div className="border border-neutral-100 rounded-xl overflow-hidden bg-white">
      <button
        onClick={toggle}
        aria-expanded={open}
        className="w-full px-4 py-3 flex items-start gap-3 hover:bg-neutral-50 transition-colors text-left"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium text-neutral-900 truncate">{project.name}</p>
            <svg
              width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2"
              className={`flex-shrink-0 text-neutral-300 transition-transform ${open ? "rotate-180" : ""}`}
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${statusBadge(project.status)}`}>
              {project.status}
            </span>
            {project.priority && (
              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${PRIORITY_STYLE[project.priority] ?? "bg-neutral-100 text-neutral-600"}`}>
                {project.priority}
              </span>
            )}
            {project.dueDate && (
              <span className="text-[10px] text-neutral-400">Due {formatDate(project.dueDate)}</span>
            )}
          </div>
          {project.totalTasks > 0 && (
            <>
              <div className="h-1 bg-neutral-100 rounded-full overflow-hidden mt-2">
                <div className="h-full bg-neutral-900 rounded-full transition-all" style={{ width: `${pct * 100}%` }} />
              </div>
              <p className="text-[10px] text-neutral-400 mt-1">{project.doneTasks}/{project.totalTasks} tasks</p>
            </>
          )}
        </div>
      </button>

      {open && (
        <div className="border-t border-neutral-100 px-4 py-3 flex flex-col gap-1 bg-neutral-50/50">
          {loading && <p className="text-xs text-neutral-400 py-2">Loading…</p>}
          {failed && <p className="text-xs text-red-500 py-2">Couldn&apos;t load everything. Close and reopen to retry.</p>}

          {!loading && !failed && tasks.length === 0 && resources.length === 0 && (
            <p className="text-xs text-neutral-400 py-2">No tasks or resources linked to this project.</p>
          )}

          {activeTasks.map((task) => (
            <div key={task.id} className="flex items-center gap-2.5 py-1.5">
              <button
                onClick={() => markDone(task.id)}
                disabled={!!pending}
                className="w-4 h-4 rounded border-2 border-neutral-300 flex-shrink-0 hover:border-neutral-600 transition-colors"
                aria-label={`Mark ${task.name} done`}
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

          {resources.length > 0 && (
            <div className="mt-1 pt-2 border-t border-neutral-100">
              <p className="text-[10px] text-neutral-400 uppercase tracking-wider font-medium mb-1">Resources</p>
              {resources.map((resource) => (
                <a
                  key={resource.id}
                  href={resource.url ?? `https://notion.so/${resource.id.replace(/-/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block py-1.5 text-sm text-neutral-700 hover:text-neutral-900 truncate"
                >
                  {resource.title}
                </a>
              ))}
            </div>
          )}

          <a
            href={`https://notion.so/${project.id.replace(/-/g, "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 pt-2 border-t border-neutral-100 text-xs text-neutral-400 hover:text-neutral-700"
          >
            Open project in Notion ↗
          </a>
        </div>
      )}
    </div>
  );
}
