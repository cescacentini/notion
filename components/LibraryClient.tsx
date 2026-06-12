"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Resource, Flashcard } from "@/lib/notion";

interface LibraryClientProps {
  dueCount: number;
  resources: Resource[];
  recentCards: Flashcard[];
  decks: { id: string; name: string; total: number; due: number }[];
  stats: { streak: number; totalReviewed: number };
}

function GenerateButton({ resource }: { resource: Resource }) {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [count, setCount] = useState(0);

  async function generate() {
    setState("loading");
    try {
      const res = await fetch("/api/generate-flashcards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resourceId: resource.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setCount(data.created ?? 0);
      setState("done");
      setTimeout(() => router.refresh(), 1000);
    } catch {
      setState("error");
      setTimeout(() => setState("idle"), 3000);
    }
  }

  if (state === "loading") return (
    <span className="px-2.5 py-1 text-xs text-neutral-400 border border-neutral-200 rounded-lg">
      Generating…
    </span>
  );
  if (state === "done") return (
    <span className="px-2.5 py-1 text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg">
      +{count} cards
    </span>
  );
  if (state === "error") return (
    <span className="px-2.5 py-1 text-xs text-red-500 border border-red-200 rounded-lg">
      Error
    </span>
  );

  return (
    <button
      onClick={generate}
      className="px-2.5 py-1 text-xs border border-neutral-200 rounded-lg hover:bg-neutral-100 active:scale-95 transition-all"
    >
      Generate cards
    </button>
  );
}

export default function LibraryClient({ dueCount, resources, recentCards, decks, stats }: LibraryClientProps) {
  const newResources = resources.slice(0, 8);
  const recentDecks = decks.slice(0, 4);

  return (
    <div className="min-h-full max-w-xl mx-auto px-5 pt-8 pb-[env(safe-area-inset-bottom,24px)] flex flex-col gap-6">

      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/" className="text-neutral-400 hover:text-neutral-700 active:scale-95 transition-transform">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-xl font-semibold tracking-tight">Library</h1>
      </div>

      {/* Review CTA */}
      <Link
        href="/study"
        className="block p-5 bg-neutral-900 text-white rounded-2xl active:scale-[0.98] transition-transform"
      >
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="font-semibold">Start Review</h2>
            <p className="text-sm text-neutral-400">{dueCount} cards due today</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </div>
        </div>
        <div className="flex gap-5 text-sm">
          <div>
            <p className="text-xl font-semibold">{stats.streak}</p>
            <p className="text-neutral-400">day streak</p>
          </div>
          <div>
            <p className="text-xl font-semibold">{stats.totalReviewed}</p>
            <p className="text-neutral-400">reviewed</p>
          </div>
        </div>
      </Link>

      {/* Resources — with Generate button */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-medium text-sm text-neutral-500">Resources</h2>
          <p className="text-xs text-neutral-400">tap to generate flashcards</p>
        </div>
        <div className="flex flex-col gap-2">
          {newResources.length === 0 ? (
            <p className="text-sm text-neutral-400">No resources in progress</p>
          ) : (
            newResources.map((r) => (
              <div
                key={r.id}
                className="flex items-center gap-3 p-3 bg-neutral-50 rounded-xl"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{r.title}</p>
                  {r.topics.length > 0 && (
                    <p className="text-xs text-neutral-400 truncate mt-0.5">{r.topics.join(" · ")}</p>
                  )}
                </div>
                <GenerateButton resource={r} />
              </div>
            ))
          )}
        </div>
      </div>

      {/* Recently reviewed */}
      {recentCards.length > 0 && (
        <div>
          <h2 className="font-medium text-sm text-neutral-500 mb-3">Recently Reviewed</h2>
          <div className="flex flex-col divide-y divide-neutral-100 border border-neutral-100 rounded-xl overflow-hidden">
            {recentCards.slice(0, 5).map((card) => (
              <div key={card.id} className="px-4 py-3 bg-white">
                <p className="text-sm font-medium line-clamp-1">{card.question}</p>
                <p className="text-xs text-neutral-400 mt-0.5">
                  {card.lastReview
                    ? new Date(card.lastReview).toLocaleDateString("en-GB", { day: "numeric", month: "short" })
                    : ""}
                  {card.deck ? ` · ${card.deck}` : ""}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Decks */}
      {recentDecks.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-medium text-sm text-neutral-500">Decks</h2>
            <Link href="/flashcards" className="text-xs text-neutral-400 hover:text-neutral-600">View all</Link>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {recentDecks.map((deck) => (
              <Link
                key={deck.id}
                href={`/study?resource=${deck.id}&name=${encodeURIComponent(deck.name)}`}
                className="p-3 border border-neutral-100 rounded-xl active:scale-[0.97] transition-transform"
              >
                <p className="text-sm font-medium truncate">{deck.name}</p>
                <p className="text-xs text-neutral-400 mt-0.5">{deck.total} cards · {deck.due} due</p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
