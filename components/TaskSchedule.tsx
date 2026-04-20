"use client";

import { useState, useEffect } from "react";
import type { Task } from "@/lib/notion";

function parseDateTime(s: string | null): Date | null {
  if (!s) return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

function formatTime(s: string): string {
  const d = parseDateTime(s);
  if (!d) return "";
  return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

const PRIORITY_STYLE: Record<string, string> = {
  High:   "bg-neutral-900/10 text-neutral-900",
  Medium: "bg-neutral-100 text-neutral-600",
  Low:    "bg-neutral-50 text-neutral-400",
};

export default function TaskSchedule({ initial }: { initial: Task[] }) {
  const [tasks, setTasks] = useState(initial);
  const [pending, setPending] = useState<string | null>(null);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  async function markDone(id: string) {
    if (pending) return;
    setPending(id);
    setTasks((t) => t.filter((x) => x.id !== id));
    try { await fetch(`/api/tasks/${id}`, { method: "PATCH" }); }
    catch { /* fire and forget */ }
    finally { setPending(null); }
  }

  const todayStr = now.toLocaleDateString("en-CA"); // YYYY-MM-DD in local time

  const overdue = tasks.filter((t) => {
    if (!t.dueDate) return false;
    const d = t.dueDate.split("T")[0];
    return d < todayStr;
  });

  const rest = tasks.filter((t) => !overdue.includes(t));

  // Sort by doDate time if present, then untimed at end
  const sorted = [...rest].sort((a, b) => {
    const ta = parseDateTime(a.doDate)?.getTime() ?? Infinity;
    const tb = parseDateTime(b.doDate)?.getTime() ?? Infinity;
    return ta - tb;
  });

  // Split by now
  const past = sorted.filter((t) => {
    if (!t.doDate?.includes("T")) return false;
    const d = parseDateTime(t.doDate);
    return d && d < now;
  });
  const upcoming = sorted.filter((t) => !past.includes(t));

  function TaskRow({ task }: { task: Task }) {
    const time = task.doDate?.includes("T") ? formatTime(task.doDate) : null;
    const isPast = past.includes(task);
    return (
      <li className="flex items-center gap-3 py-3">
        <button
          onClick={() => markDone(task.id)}
          className="w-5 h-5 rounded-full border-2 border-neutral-300 flex-shrink-0 hover:border-neutral-700 transition-colors"
          aria-label="Mark done"
        />
        <div className="flex-1 min-w-0">
          <p className={`text-sm ${isPast ? "text-neutral-400" : "text-neutral-900"}`}>
            {task.name}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {time && (
            <span className={`text-xs tabular-nums ${isPast ? "text-neutral-300" : "text-neutral-400"}`}>
              {time}
            </span>
          )}
          {task.priority && (
            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${PRIORITY_STYLE[task.priority] ?? "bg-neutral-50 text-neutral-400"}`}>
              {task.priority}
            </span>
          )}
        </div>
      </li>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-sm text-neutral-400">All clear for today.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Clock */}
      <div className="flex items-center gap-3">
        <div className="w-2 h-2 rounded-full bg-neutral-900 animate-pulse flex-shrink-0" />
        <span className="text-2xl font-semibold tabular-nums">
          {now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
        </span>
      </div>

      {/* Overdue */}
      {overdue.length > 0 && (
        <section>
          <p className="text-[11px] uppercase tracking-wider font-medium text-red-400 mb-1">Overdue</p>
          <ul className="divide-y divide-neutral-50 border border-red-50 rounded-xl px-3">
            {overdue.map((t) => <TaskRow key={t.id} task={t} />)}
          </ul>
        </section>
      )}

      {/* Past tasks today */}
      {past.length > 0 && (
        <section>
          <p className="text-[11px] uppercase tracking-wider font-medium text-neutral-300 mb-1">Earlier</p>
          <ul className="divide-y divide-neutral-50">
            {past.map((t) => <TaskRow key={t.id} task={t} />)}
          </ul>
        </section>
      )}

      {/* Now divider */}
      {past.length > 0 && upcoming.length > 0 && (
        <div className="flex items-center gap-2">
          <div className="flex-1 h-px bg-neutral-900" />
          <span className="text-[11px] font-bold tracking-widest uppercase text-neutral-900">Now</span>
          <div className="flex-1 h-px bg-neutral-900" />
        </div>
      )}

      {/* Upcoming */}
      {upcoming.length > 0 && (
        <section>
          {past.length === 0 && overdue.length === 0 && (
            <p className="text-[11px] uppercase tracking-wider font-medium text-neutral-400 mb-1">Today</p>
          )}
          <ul className="divide-y divide-neutral-50">
            {upcoming.map((t) => <TaskRow key={t.id} task={t} />)}
          </ul>
        </section>
      )}
    </div>
  );
}
