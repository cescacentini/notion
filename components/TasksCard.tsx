"use client";

import { useState } from "react";
import type { Task } from "@/lib/notion";

const PRIORITY_STYLE: Record<string, string> = {
  High:   "text-neutral-900 bg-neutral-900/10",
  Medium: "text-neutral-600 bg-neutral-100",
  Low:    "text-neutral-400 bg-neutral-50",
};

export default function TasksCard({ initial }: { initial: Task[] }) {
  const [tasks, setTasks] = useState(initial);
  const [pending, setPending] = useState<string | null>(null);

  async function markDone(id: string) {
    if (pending) return;
    setPending(id);
    setTasks((t) => t.filter((x) => x.id !== id));
    try {
      await fetch(`/api/tasks/${id}`, { method: "PATCH" });
    } catch {
      // fire and forget — Notion might still update
    } finally {
      setPending(null);
    }
  }

  return (
    <section className="border border-neutral-100 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-neutral-400 uppercase tracking-wider font-medium">Tasks</p>
        {tasks.length > 0 && (
          <span className="text-xs text-neutral-500 tabular-nums">{tasks.length}</span>
        )}
      </div>

      {tasks.length === 0 ? (
        <p className="text-sm text-neutral-400">All clear for today.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-neutral-50">
          {tasks.map((task) => {
            const isOverdue = task.dueDate && task.dueDate < new Date().toISOString().split("T")[0];
            return (
              <li key={task.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                <button
                  onClick={() => markDone(task.id)}
                  className="w-4 h-4 rounded border border-neutral-300 flex-shrink-0 hover:border-neutral-600 transition-colors"
                  aria-label="Mark done"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-neutral-900 truncate">{task.name}</p>
                  {isOverdue && task.dueDate && (
                    <p className="text-[11px] text-red-400 mt-0.5">
                      Due {new Date(task.dueDate + "T12:00:00Z").toLocaleDateString("en", { month: "short", day: "numeric" })}
                    </p>
                  )}
                </div>
                {task.priority && (
                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded flex-shrink-0 ${PRIORITY_STYLE[task.priority] ?? "text-neutral-400 bg-neutral-50"}`}>
                    {task.priority}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
