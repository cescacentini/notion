import { getVocabLanguageStats } from "@/lib/notion";
import Link from "next/link";

export const dynamic = "force-dynamic";

const LANG_FLAG: Record<string, string> = {
  Spanish: "🇪🇸", Italian: "🇮🇹", French: "🇫🇷", German: "🇩🇪",
  Portuguese: "🇵🇹", Japanese: "🇯🇵", Chinese: "🇨🇳", Korean: "🇰🇷",
  Arabic: "🇸🇦", Russian: "🇷🇺", English: "🇬🇧",
};

export default async function VocabPage() {
  let stats: Awaited<ReturnType<typeof getVocabLanguageStats>> = [];
  try { stats = await getVocabLanguageStats(); } catch { /* not configured */ }

  const totalDue = stats.reduce((s, l) => s + l.due, 0);

  return (
    <div className="min-h-full max-w-xl mx-auto px-5 pt-8 pb-[env(safe-area-inset-bottom,24px)] flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Link href="/" className="text-neutral-400 hover:text-neutral-700 transition-colors">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-xl font-semibold tracking-tight">Languages</h1>
      </div>

      {/* Review all */}
      {totalDue > 0 && (
        <Link
          href="/study-vocab"
          className="block p-5 bg-neutral-900 text-white rounded-2xl active:scale-[0.98] transition-transform"
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold">Review all languages</h2>
              <p className="text-sm text-neutral-400 mt-0.5">{totalDue} words due today</p>
            </div>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </div>
        </Link>
      )}

      {/* Language list */}
      <div className="flex flex-col gap-2">
        <p className="text-xs text-neutral-400 uppercase tracking-wider font-medium">By Language</p>
        {stats.length === 0 ? (
          <div className="border border-neutral-100 rounded-xl px-5 py-6 text-center">
            <p className="text-sm text-neutral-500">No vocabulary cards yet.</p>
            <p className="text-xs text-neutral-400 mt-1">Add cards to your Notion vocab database to get started.</p>
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-neutral-100 border border-neutral-100 rounded-xl overflow-hidden">
            {stats.map((lang) => (
              <Link
                key={lang.language}
                href={`/study-vocab?language=${encodeURIComponent(lang.language)}&name=${encodeURIComponent(lang.language)}`}
                className={`flex items-center justify-between px-5 py-4 bg-white hover:bg-neutral-50 transition-colors ${lang.due === 0 ? "opacity-50 pointer-events-none" : ""}`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{LANG_FLAG[lang.language] ?? "🌐"}</span>
                  <div>
                    <p className="font-medium text-sm text-neutral-900">{lang.language}</p>
                    <p className="text-xs text-neutral-400">{lang.total} word{lang.total !== 1 ? "s" : ""}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {lang.due > 0 ? (
                    <span className="text-sm font-semibold text-neutral-900 bg-neutral-100 rounded-full px-2.5 py-0.5">
                      {lang.due} due
                    </span>
                  ) : (
                    <span className="text-xs text-neutral-400">Done ✓</span>
                  )}
                  <svg className="text-neutral-300" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
