"use client";

import { useState } from "react";
import Link from "next/link";
import AIQuiz from "@/components/AIQuiz";
import type { Resource, Flashcard } from "@/lib/notion";

interface LibraryClientProps {
  dueCount: number;
  resources: Resource[];
  recentCards: Flashcard[];
  decks: { id: string; name: string; total: number; due: number }[];
  stats: { streak: number; totalReviewed: number };
}

export default function LibraryClient({ dueCount, resources, recentCards, decks, stats }: LibraryClientProps) {
  const [quizTopic, setQuizTopic] = useState<string | null>(null);

  const newResources = resources.slice(0, 5);
  const recentDecks = decks.slice(0, 4);

  return (
    <>
      {quizTopic && <AIQuiz topic={quizTopic} onClose={() => setQuizTopic(null)} />}

      <div className="min-h-full max-w-xl mx-auto px-5 py-8 flex flex-col gap-6">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-neutral-400 hover:text-neutral-700">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-xl font-semibold tracking-tight">Library</h1>
          <div className="flex-1" />
          <Link href="/notebooks" className="text-neutral-400 hover:text-neutral-700">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
            </svg>
          </Link>
        </div>

        <Link
          href="/study"
          className="block p-5 bg-neutral-900 text-white rounded-xl hover:bg-neutral-800 transition-colors"
        >
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="font-semibold">Start Review</h2>
              <p className="text-sm text-neutral-400">{dueCount} cards due</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </div>
          </div>
          <div className="flex gap-4 text-sm">
            <div>
              <p className="text-xl font-semibold">{stats.streak}</p>
              <p className="text-neutral-400">day streak</p>
            </div>
            <div>
              <p className="text-xl font-semibold">{stats.totalReviewed}</p>
              <p className="text-neutral-400">total reviewed</p>
            </div>
          </div>
        </Link>

        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-medium text-sm text-neutral-500">Continue Learning</h2>
          </div>
          <div className="flex flex-col gap-2">
            {newResources.length === 0 ? (
              <p className="text-sm text-neutral-400">No resources in progress</p>
            ) : (
              newResources.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{r.title}</p>
                    <p className="text-xs text-neutral-400 truncate">{r.topics.join(", ")}</p>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setQuizTopic(r.title)}
                      className="ml-2 px-2 py-1 text-xs border border-neutral-200 rounded hover:bg-neutral-100"
                    >
                      Quiz
                    </button>
                    <a
                      href={`https://notion.so/${r.id.replace(/-/g, "").slice(0, 8)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2 py-1 text-xs border border-neutral-200 rounded hover:bg-neutral-100"
                    >
                      Notion
                    </a>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {recentCards.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-medium text-sm text-neutral-500">Recently Reviewed</h2>
            </div>
            <div className="flex flex-col gap-2">
              {recentCards.slice(0, 5).map((card) => (
                <Link
                  key={card.id}
                  href={`/study?resource=${card.id}`}
                  className="flex items-center justify-between p-3 border border-neutral-100 rounded-lg hover:border-neutral-300 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{card.question}</p>
                    <p className="text-xs text-neutral-400 truncate">
                      {card.lastReview ? new Date(card.lastReview).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : ""} · {card.deck || "Uncategorized"}
                    </p>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-neutral-300">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </Link>
              ))}
            </div>
          </div>
        )}

        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-medium text-sm text-neutral-500">Decks</h2>
            <Link href="/flashcards" className="text-xs text-neutral-400 hover:text-neutral-600">View all</Link>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {recentDecks.map((deck) => (
              <Link
                key={deck.id}
                href={`/study?resource=${deck.id}`}
                className="p-3 border border-neutral-100 rounded-lg hover:border-neutral-300 transition-colors"
              >
                <p className="text-sm font-medium truncate">{deck.name}</p>
                <p className="text-xs text-neutral-400">{deck.total} cards · {deck.due} due</p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}