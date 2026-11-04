"use client";

import { useState } from "react";
import type { HabitsEntry } from "@/lib/notion";

export default function HabitsCard({ initial }: { initial: HabitsEntry | null }) {
  const [entry, setEntry] = useState(initial);
  const [pending, setPending] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [startFailed, setStartFailed] = useState(false);

  async function startToday() {
    setStarting(true);
    setStartFailed(false);
    try {
      const res = await fetch("/api/habits", { method: "POST" });
      if (!res.ok) throw new Error("Failed");
      setEntry(await res.json());
    } catch {
      setStartFailed(true);
    } finally {
      setStarting(false);
    }
  }

  if (!entry) {
    return (
      <section className="border border-neutral-100 rounded-xl p-4">
        <p className="text-xs text-neutral-400 uppercase tracking-wider font-medium mb-3">Habits</p>
        <p className="text-sm text-neutral-400 mb-3">No entry for today yet.</p>
        <button
          onClick={startToday}
          disabled={starting}
          className="px-3 py-2 text-sm bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 disabled:opacity-50 transition-colors"
        >
          {starting ? "Starting…" : "Start today"}
        </button>
        {startFailed && <p className="text-xs text-red-500 mt-2">Couldn&apos;t create today&apos;s entry. Try again.</p>}
      </section>
    );
  }

  const done = entry.habits.filter((h) => h.checked).length;
  const total = entry.habits.length;

  async function toggle(habitKey: string, current: boolean) {
    if (pending) return;
    setPending(habitKey);
    // Optimistic update
    setEntry((e) => e && {
      ...e,
      habits: e.habits.map((h) =>
        h.key === habitKey ? { ...h, checked: !current } : h
      ),
    });
    try {
      await fetch(`/api/habits/${entry!.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ habitKey, checked: !current }),
      });
    } catch {
      // Revert on error
      setEntry((e) => e && {
        ...e,
        habits: e.habits.map((h) =>
          h.key === habitKey ? { ...h, checked: current } : h
        ),
      });
    } finally {
      setPending(null);
    }
  }

  return (
    <section className="border border-neutral-100 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-neutral-400 uppercase tracking-wider font-medium">Habits</p>
        <span className="text-xs text-neutral-500 tabular-nums">{done}/{total}</span>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-neutral-100 rounded-full mb-4 overflow-hidden">
        <div
          className="h-full bg-neutral-900 rounded-full transition-all duration-300"
          style={{ width: `${(done / total) * 100}%` }}
        />
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
        {entry.habits.map((h) => (
          <button
            key={h.key}
            onClick={() => toggle(h.key, h.checked)}
            disabled={pending === h.key}
            className="flex items-center gap-2.5 text-left group"
          >
            <div className={`w-4 h-4 rounded flex-shrink-0 border flex items-center justify-center transition-colors ${
              h.checked
                ? "bg-neutral-900 border-neutral-900"
                : "border-neutral-300 group-hover:border-neutral-500"
            }`}>
              {h.checked && (
                <svg width="8" height="8" viewBox="0 0 12 12" fill="none" stroke="white" strokeWidth="2.5">
                  <path d="M2 6l3 3 5-5" />
                </svg>
              )}
            </div>
            <span className={`text-sm transition-colors ${
              h.checked ? "text-neutral-400 line-through" : "text-neutral-800"
            }`}>
              {h.label}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
