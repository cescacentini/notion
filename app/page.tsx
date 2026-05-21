import Link from "next/link";
import {
  getDueCount,
  getInProgressResources,
  getTodayHabits,
  getTodayTasks,
  getTodaySocialPosts,
  getActiveProjectsCount,
} from "@/lib/notion";
import { isConfigured, getAvailableSections, isSectionAvailable } from "@/lib/config";
import HomeHub, { HomeStatus } from "@/components/HomeHub";

export const dynamic = "force-dynamic";

function greeting() {
  const h = new Date().getUTCHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export default async function Home() {
  if (!isConfigured()) {
    return (
      <div className="min-h-full max-w-xl mx-auto px-5 py-16 flex flex-col items-center justify-center gap-6 text-center">
        <div>
          <div className="w-14 h-14 rounded-2xl bg-neutral-100 flex items-center justify-center mx-auto mb-4">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="2" y="6" width="20" height="14" rx="2" />
              <path d="M2 10h20M7 3l5 3 5-3" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold tracking-tight">Welcome to Notion Flashcards</h1>
          <p className="text-sm text-neutral-500 mt-2 max-w-xs mx-auto">
            Connect your Notion workspace to get started. It only takes a minute.
          </p>
        </div>
        <Link
          href="/setup"
          className="px-6 py-3 bg-neutral-900 text-white text-sm font-medium rounded-xl hover:bg-neutral-800 transition-colors"
        >
          Connect Notion →
        </Link>
      </div>
    );
  }

  const available = getAvailableSections();

  function safe<T>(p: Promise<T>, fallback: T): Promise<T> {
    return p.catch(() => fallback);
  }

  const [dueCount, resources, habitsEntry, tasks, socialPosts, projectsCount] =
    await Promise.all([
      safe(getDueCount(), 0),
      safe(getInProgressResources(), []),
      isSectionAvailable("habits")  ? safe(getTodayHabits(), null)    : Promise.resolve(null),
      isSectionAvailable("tasks")   ? safe(getTodayTasks(), [])       : Promise.resolve([]),
      isSectionAvailable("social")  ? safe(getTodaySocialPosts(), []) : Promise.resolve([]),
      isSectionAvailable("projects")? safe(getActiveProjectsCount(), 0): Promise.resolve(0),
    ]);

  const status: HomeStatus = {
    habits: habitsEntry
      ? { done: habitsEntry.habits.filter((h) => h.checked).length, total: habitsEntry.habits.length }
      : null,
    tasks:      (tasks as Awaited<ReturnType<typeof getTodayTasks>>).length,
    flashcards: dueCount,
    social:     (socialPosts as Awaited<ReturnType<typeof getTodaySocialPosts>>).length,
    projects:   projectsCount as number,
  };

  return (
    <div className="min-h-full max-w-xl mx-auto px-5 py-8 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-neutral-400">{greeting()}</p>
          <h1 className="text-xl font-semibold tracking-tight mt-0.5">What would you like to work on?</h1>
        </div>
        <Link href="/setup" className="text-neutral-300 hover:text-neutral-500 transition-colors" title="Setup">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
          </svg>
        </Link>
      </div>

      <Link
        href="/library"
        className="group block p-6 bg-neutral-900 text-white rounded-2xl hover:bg-neutral-800 transition-colors"
      >
        <div className="flex items-center gap-3 mb-4">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
            <path d="M9 7h6M9 11h6M9 15h4" />
          </svg>
          <div className="flex-1">
            <h2 className="font-semibold text-lg">Library</h2>
            <p className="text-sm text-neutral-400">Flashcards, recent reads, review</p>
          </div>
        </div>
        <div className="flex gap-6 text-sm">
          <div>
            <p className="text-2xl font-semibold">{dueCount}</p>
            <p className="text-neutral-400">due today</p>
          </div>
          {resources.length > 0 && (
            <div>
              <p className="text-2xl font-semibold">{resources.length}</p>
              <p className="text-neutral-400">in progress</p>
            </div>
          )}
        </div>
      </Link>

      {available.length > 1 && (
        <HomeHub
          status={status}
          available={available.filter((s) => s !== "resources") as ("flashcards" | "habits" | "tasks" | "social" | "projects")[]}
        />
      )}
    </div>
  );
}
