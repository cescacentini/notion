"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

export interface HomeStatus {
  habits: { done: number; total: number } | null;
  tasks: number;
  flashcards: number;
  journal: boolean;
  social: number;
  projects: number;
}

const ALL_SECTION_IDS = ["habits", "tasks", "flashcards", "journal", "social", "projects"] as const;
type SectionId = typeof ALL_SECTION_IDS[number];

const SECTION_META: Record<SectionId, { label: string; href: string; icon: React.ReactNode }> = {
  habits: {
    label: "Habits",
    href: "/habits",
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M9 12l2 2 4-4" />
        <path d="M12 2a10 10 0 100 20A10 10 0 0012 2z" />
      </svg>
    ),
  },
  tasks: {
    label: "Tasks",
    href: "/tasks",
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <line x1="3" y1="10" x2="21" y2="10" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <path d="M8 15l2 2 4-4" />
      </svg>
    ),
  },
  flashcards: {
    label: "Flashcards",
    href: "/flashcards",
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="2" y="6" width="20" height="14" rx="2" />
        <path d="M2 10h20" />
        <path d="M7 3l5 3 5-3" />
      </svg>
    ),
  },
  journal: {
    label: "Journal",
    href: "/journal",
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
        <line x1="9" y1="7" x2="15" y2="7" />
        <line x1="9" y1="11" x2="15" y2="11" />
      </svg>
    ),
  },
  social: {
    label: "Content",
    href: "/social",
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="18" cy="5" r="3" />
        <circle cx="6" cy="12" r="3" />
        <circle cx="18" cy="19" r="3" />
        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
        <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
      </svg>
    ),
  },
  projects: {
    label: "Projects",
    href: "/projects",
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z" />
      </svg>
    ),
  },
};

function badge(id: SectionId, status: HomeStatus): { text: string; alert: boolean } | null {
  switch (id) {
    case "habits":
      if (!status.habits) return null;
      return {
        text: `${status.habits.done}/${status.habits.total}`,
        alert: status.habits.done < status.habits.total,
      };
    case "tasks":
      if (!status.tasks) return null;
      return { text: String(status.tasks), alert: true };
    case "flashcards":
      if (!status.flashcards) return null;
      return { text: String(status.flashcards), alert: true };
    case "journal":
      return status.journal ? { text: "✓", alert: false } : null;
    case "social":
      if (!status.social) return null;
      return { text: String(status.social), alert: false };
    case "projects":
      if (!status.projects) return null;
      return { text: String(status.projects), alert: false };
    default:
      return null;
  }
}

const STORAGE_KEY = "home-section-prefs";

interface Prefs {
  order: SectionId[];
  hidden: SectionId[];
}

function loadPrefs(): Prefs {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { order: [...ALL_SECTION_IDS], hidden: [] };
}

function savePrefs(prefs: Prefs) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs)); } catch { /* ignore */ }
}

export default function HomeHub({ status }: { status: HomeStatus }) {
  const [prefs, setPrefs] = useState<Prefs>({ order: [...ALL_SECTION_IDS], hidden: [] });
  const [customize, setCustomize] = useState(false);

  useEffect(() => { setPrefs(loadPrefs()); }, []);

  function updatePrefs(next: Prefs) {
    setPrefs(next);
    savePrefs(next);
  }

  function moveUp(id: SectionId) {
    const order = [...prefs.order];
    const i = order.indexOf(id);
    if (i > 0) { [order[i - 1], order[i]] = [order[i], order[i - 1]]; }
    updatePrefs({ ...prefs, order });
  }

  function moveDown(id: SectionId) {
    const order = [...prefs.order];
    const i = order.indexOf(id);
    if (i < order.length - 1) { [order[i], order[i + 1]] = [order[i + 1], order[i]]; }
    updatePrefs({ ...prefs, order });
  }

  function toggleHidden(id: SectionId) {
    const hidden = prefs.hidden.includes(id)
      ? prefs.hidden.filter((h) => h !== id)
      : [...prefs.hidden, id];
    updatePrefs({ ...prefs, hidden });
  }

  const visible = prefs.order.filter((id) => !prefs.hidden.includes(id));

  return (
    <>
      {/* Circle grid */}
      <div className="grid grid-cols-3 gap-y-7 gap-x-4 px-4 py-6">
        {visible.map((id) => {
          const meta = SECTION_META[id];
          const b = badge(id, status);
          return (
            <div key={id} className="flex flex-col items-center gap-2">
              <Link href={meta.href} className="relative block">
                <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-700 hover:bg-neutral-200 transition-colors active:scale-95">
                  {meta.icon}
                </div>
                {b && (
                  <span className={`absolute -top-1 -right-1 min-w-[20px] h-5 rounded-full text-[10px] font-semibold flex items-center justify-center px-1.5 ${
                    b.alert ? "bg-neutral-900 text-white" : "bg-neutral-200 text-neutral-700"
                  }`}>
                    {b.text}
                  </span>
                )}
              </Link>
              <span className="text-xs text-neutral-600 font-medium">{meta.label}</span>
            </div>
          );
        })}
      </div>

      {/* Customize button */}
      <div className="flex justify-center pb-2">
        <button
          onClick={() => setCustomize(true)}
          className="text-xs text-neutral-400 hover:text-neutral-600 transition-colors flex items-center gap-1"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
          </svg>
          Customize
        </button>
      </div>

      {/* Customize modal */}
      {customize && (
        <div className="fixed inset-0 z-50 flex items-end" onClick={() => setCustomize(false)}>
          <div
            className="w-full bg-white rounded-t-2xl shadow-xl border-t border-neutral-100 px-5 pt-4 pb-10 max-w-xl mx-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-neutral-200 rounded-full mx-auto mb-5" />
            <h2 className="font-semibold text-base mb-4">Customize sections</h2>
            <div className="flex flex-col gap-1">
              {prefs.order.map((id, i) => {
                const meta = SECTION_META[id];
                const hidden = prefs.hidden.includes(id);
                return (
                  <div key={id} className={`flex items-center gap-3 py-2.5 border-b border-neutral-50 ${hidden ? "opacity-40" : ""}`}>
                    <button onClick={() => toggleHidden(id)} className="flex-shrink-0">
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                        !hidden ? "bg-neutral-900 border-neutral-900" : "border-neutral-300"
                      }`}>
                        {!hidden && (
                          <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="white" strokeWidth="2.5">
                            <path d="M2 6l3 3 5-5" />
                          </svg>
                        )}
                      </div>
                    </button>
                    <span className="flex-1 text-sm font-medium text-neutral-800">{meta.label}</span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => moveUp(id)}
                        disabled={i === 0}
                        className="p-1.5 text-neutral-400 hover:text-neutral-700 disabled:opacity-20 transition-colors"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M18 15l-6-6-6 6" />
                        </svg>
                      </button>
                      <button
                        onClick={() => moveDown(id)}
                        disabled={i === prefs.order.length - 1}
                        className="p-1.5 text-neutral-400 hover:text-neutral-700 disabled:opacity-20 transition-colors"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M6 9l6 6 6-6" />
                        </svg>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            <button
              onClick={() => setCustomize(false)}
              className="mt-5 w-full py-3 text-sm bg-neutral-900 text-white rounded-xl hover:bg-neutral-800 transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </>
  );
}
