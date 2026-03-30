"use client";

import { useState } from "react";
import type { Resource } from "@/lib/notion";

const SOURCE_ICON: Record<string, string> = {
  Books:    "📖",
  Youtube:  "▶",
  Course:   "🎓",
  Paper:    "📄",
  Articles: "📰",
  PDFs:     "📄",
  Museum:   "🏛",
  Seminar:  "🎤",
  Movie:    "🎬",
};

function ResourceRow({ r }: { r: Resource }) {
  const icon = SOURCE_ICON[r.source ?? ""] ?? "·";
  const inner = (
    <div className="flex items-center gap-3 py-2.5">
      <span className="text-base w-5 flex-shrink-0 text-center leading-none">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-neutral-900 truncate">{r.title}</p>
        {r.topics.length > 0 && (
          <p className="text-[11px] text-neutral-400 truncate mt-0.5">{r.topics.join(", ")}</p>
        )}
      </div>
      {r.url && (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-neutral-300 flex-shrink-0">
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
          <polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
        </svg>
      )}
    </div>
  );
  return r.url ? (
    <a href={r.url} target="_blank" rel="noopener noreferrer" className="block hover:bg-neutral-50 -mx-1 px-1 rounded transition-colors divide-y divide-neutral-50">
      {inner}
    </a>
  ) : <div>{inner}</div>;
}

function ResourceCard({ r }: { r: Resource }) {
  const icon = SOURCE_ICON[r.source ?? ""] ?? "·";
  const Wrapper = ({ children }: { children: React.ReactNode }) =>
    r.url ? (
      <a href={r.url} target="_blank" rel="noopener noreferrer" className="block">
        {children}
      </a>
    ) : <div>{children}</div>;

  return (
    <Wrapper>
      <div className="border border-neutral-100 rounded-xl p-4 hover:bg-neutral-50 transition-colors">
        <div className="flex items-start justify-between gap-2 mb-2">
          <span className="text-xl leading-none">{icon}</span>
          {r.source && (
            <span className="text-[10px] text-neutral-400 bg-neutral-100 rounded px-1.5 py-0.5 flex-shrink-0">
              {r.source}
            </span>
          )}
        </div>
        <p className="text-sm font-medium text-neutral-900 line-clamp-2 leading-snug">{r.title}</p>
        {r.topics.length > 0 && (
          <p className="text-[11px] text-neutral-400 mt-1.5 truncate">{r.topics.join(", ")}</p>
        )}
      </div>
    </Wrapper>
  );
}

export default function ResourcesCard({ resources }: { resources: Resource[] }) {
  const [showAll, setShowAll] = useState(false);
  const preview = resources.slice(0, 3);
  const rest = resources.slice(3);

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-neutral-400 uppercase tracking-wider font-medium">In progress</p>
        <span className="text-xs text-neutral-500 tabular-nums">{resources.length}</span>
      </div>

      {resources.length === 0 ? (
        <p className="text-sm text-neutral-400">Nothing in progress.</p>
      ) : (
        <>
          {/* Top 3 as gallery cards */}
          <div className="grid grid-cols-3 gap-2">
            {preview.map((r) => <ResourceCard key={r.id} r={r} />)}
          </div>

          {/* Rest as compact rows */}
          {showAll && rest.length > 0 && (
            <div className="border border-neutral-100 rounded-xl px-4 divide-y divide-neutral-50">
              {rest.map((r) => <ResourceRow key={r.id} r={r} />)}
            </div>
          )}

          {rest.length > 0 && (
            <button
              onClick={() => setShowAll((s) => !s)}
              className="text-xs text-neutral-400 hover:text-neutral-700 transition-colors text-center py-1"
            >
              {showAll ? "Show less" : `Show all ${resources.length} in progress`}
            </button>
          )}
        </>
      )}
    </section>
  );
}
