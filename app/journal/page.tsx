import JournalEditor from "@/components/JournalEditor";
import Link from "next/link";

export const dynamic = "force-dynamic";

function todayLabel() {
  return new Date().toLocaleDateString("en-GB", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
}

export default function JournalPage() {
  return (
    <div className="min-h-full max-w-xl mx-auto px-5 py-8 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-neutral-400 hover:text-neutral-700 transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-xl font-semibold tracking-tight">Journal</h1>
        </div>
        <p className="text-xs text-neutral-400">{todayLabel()}</p>
      </div>
      <JournalEditor />
    </div>
  );
}
