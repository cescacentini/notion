import Link from "next/link";

const SOURCE_ICON: Record<string, string> = {
  Books:   "📖",
  Youtube: "▶",
  Course:  "🎓",
  Paper:   "📄",
  Articles:"📰",
  PDFs:    "📄",
  Museum:  "🏛",
  Seminar: "🎤",
  Movie:   "🎬",
};

export default function FlashcardsCard({ due }: { due: number }) {
  return (
    <Link
      href={due > 0 ? "/study" : "/flashcards"}
      className="flex items-center justify-between border border-neutral-100 rounded-xl p-4 hover:bg-neutral-50 transition-colors"
    >
      <div>
        <p className="text-xs text-neutral-400 uppercase tracking-wider font-medium mb-1">Flashcards</p>
        <p className="text-sm text-neutral-900">
          {due > 0 ? (
            <><span className="text-2xl font-semibold tabular-nums">{due}</span> <span className="text-neutral-500">cards due</span></>
          ) : (
            <span className="text-neutral-400">All reviewed</span>
          )}
        </p>
      </div>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-neutral-300">
        <path d="M5 12h14M12 5l7 7-7 7" />
      </svg>
    </Link>
  );
}

export { SOURCE_ICON };
