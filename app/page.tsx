import { getTodayHabits, getTodayTasks, getInProgressResources, getDueCount, getTodaySocialPosts, getActiveProjects } from "@/lib/notion";
import HabitsCard from "@/components/HabitsCard";
import TasksCard from "@/components/TasksCard";
import FlashcardsCard from "@/components/FlashcardsCard";
import ResourcesCard from "@/components/ResourcesCard";
import SocialCard from "@/components/SocialCard";
import ProjectsCard from "@/components/ProjectsCard";
import Link from "next/link";

export const dynamic = "force-dynamic";

const GREETINGS = ["Good morning", "Good afternoon", "Good evening"];

function greeting() {
  const h = new Date().getUTCHours();
  if (h < 12) return GREETINGS[0];
  if (h < 18) return GREETINGS[1];
  return GREETINGS[2];
}

function todayLabel() {
  return new Date().toLocaleDateString("en-GB", {
    weekday: "long", day: "numeric", month: "long",
  });
}

export default async function Home() {
  const [habits, tasks, resources, dueCount, socialPosts, projects] = await Promise.all([
    getTodayHabits(),
    getTodayTasks(),
    getInProgressResources(),
    getDueCount(),
    getTodaySocialPosts(),
    getActiveProjects(),
  ]);

  return (
    <div className="min-h-full max-w-xl mx-auto px-5 py-8 flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-neutral-400">{greeting()}</p>
          <h1 className="text-xl font-semibold tracking-tight mt-0.5">{todayLabel()}</h1>
        </div>
        <Link
          href="/flashcards"
          className="text-xs text-neutral-400 hover:text-neutral-700 border border-neutral-200 rounded-md px-2.5 py-1.5 transition-colors"
        >
          All decks
        </Link>
      </div>

      <HabitsCard initial={habits} />
      <SocialCard posts={socialPosts} />
      <TasksCard initial={tasks} />
      <FlashcardsCard due={dueCount} />
      <ResourcesCard resources={resources} />
      <ProjectsCard projects={projects} />
    </div>
  );
}
