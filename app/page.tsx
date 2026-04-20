import Link from "next/link";
import {
  getDueCount,
  getInProgressResources,
  getTodayHabits,
  HABIT_KEYS,
  getTodayTasks,
  getTodayJournalPage,
  getTodaySocialPosts,
  getActiveProjectsCount,
} from "@/lib/notion";
import HomeHub, { HomeStatus } from "@/components/HomeHub";

export const dynamic = "force-dynamic";

function greeting() {
  const h = new Date().getUTCHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export default async function Home() {
  const [dueCount, resources, habitsEntry, tasks, journalPage, socialPosts, projectsCount] =
    await Promise.all([
      getDueCount(),
      getInProgressResources(),
      getTodayHabits(),
      getTodayTasks(),
      getTodayJournalPage(),
      getTodaySocialPosts(),
      getActiveProjectsCount(),
    ]);

  const habitsDone = habitsEntry
    ? habitsEntry.habits.filter((h) => h.checked).length
    : 0;
  const habitsTotal = HABIT_KEYS.length;

  const status: HomeStatus = {
    habits: { done: habitsDone, total: habitsTotal },
    tasks: tasks.length,
    flashcards: dueCount,
    journal: !!journalPage,
    social: socialPosts.length,
    projects: projectsCount,
  };

  return (
    <div className="min-h-full max-w-xl mx-auto px-5 py-8 flex flex-col gap-6">
      <div>
        <p className="text-xs text-neutral-400">{greeting()}</p>
        <h1 className="text-xl font-semibold tracking-tight mt-0.5">What would you like to work on?</h1>
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
          <div>
            <p className="text-2xl font-semibold">{resources.length}</p>
            <p className="text-neutral-400">in progress</p>
          </div>
        </div>
      </Link>

      <HomeHub status={status} />
    </div>
  );
}
