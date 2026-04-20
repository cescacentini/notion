import { getTodayTasks } from "@/lib/notion";
import TaskSchedule from "@/components/TaskSchedule";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function TasksPage() {
  let tasks: Awaited<ReturnType<typeof getTodayTasks>> = [];
  let error: string | null = null;

  try {
    tasks = await getTodayTasks();
  } catch (err) {
    error = err instanceof Error ? err.message : "Failed to load tasks";
  }

  return (
    <div className="min-h-full max-w-xl mx-auto px-5 py-8 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-neutral-400 hover:text-neutral-700 transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-xl font-semibold tracking-tight">Tasks</h1>
        </div>
        <span className="text-xs text-neutral-400 tabular-nums">{tasks.length} today</span>
      </div>

      {error ? (
        <div className="border border-red-100 rounded-xl px-4 py-3">
          <p className="text-sm text-red-400">{error}</p>
          <p className="text-xs text-neutral-400 mt-1">Check that your Notion Tasks database has a &quot;Do date&quot; and &quot;Done&quot; property.</p>
        </div>
      ) : (
        <TaskSchedule initial={tasks} />
      )}
    </div>
  );
}
