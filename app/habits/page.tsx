import { getTodayHabits } from "@/lib/notion";
import HabitsCard from "@/components/HabitsCard";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function HabitsPage() {
  const habits = await getTodayHabits();
  return (
    <div className="min-h-full max-w-xl mx-auto px-5 py-8 flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Link href="/" className="text-neutral-400 hover:text-neutral-700 transition-colors">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-xl font-semibold tracking-tight">Habits</h1>
      </div>
      <HabitsCard initial={habits} />
    </div>
  );
}
