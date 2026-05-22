"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import type { DeckStat, Flashcard } from "@/lib/notion";
import { SOURCE_ICON } from "@/components/FlashcardsCard";
import Heatmap from "./Heatmap";
import Forecast from "./Forecast";

interface ForecastDay { date: string; label: string; count: number }

type ViewMode = "topics" | "resources";

interface Props {
  decks: DeckStat[];
  tagStats: DeckStat[];
  totalDue: number;
  totalReviewed: number;
  streak: number;
  heatmap: Record<string, number>;
  forecast: ForecastDay[];
  allCards: Flashcard[];
}

export default function Dashboard({
  decks,
  tagStats,
  totalDue,
  totalReviewed,
  streak,
  heatmap,
  forecast,
  allCards,
}: Props) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [view, setView] = useState<ViewMode>("topics");

  const query = search.trim().toLowerCase();

  const filteredTags = useMemo(() => {
    if (!query) return tagStats;
    return tagStats.filter((d) => d.name.toLowerCase().includes(query));
  }, [tagStats, query]);

  const filteredDecks = useMemo(() => {
    if (!query) return decks;
    return decks.filter((d) => d.name.toLowerCase().includes(query));
  }, [decks, query]);

  const groupedDecks = useMemo(() => {
    const order: string[] = [];
    const groups = new Map<string, DeckStat[]>();
    for (const deck of filteredDecks) {
      const key = deck.source ?? "Other";
      if (!groups.has(key)) { order.push(key); groups.set(key, []); }
      groups.get(key)!.push(deck);
    }
    return order.map((key) => ({ source: key, decks: groups.get(key)! }));
  }, [filteredDecks]);

  const matchingCards = useMemo(() => {
    if (!query) return [];
    return allCards.filter(
      (c) =>
        c.question.toLowerCase().includes(query) ||
        c.answer.toLowerCase().includes(query)
    );
  }, [allCards, query]);

  return (
    <div className="min-h-full max-w-xl mx-auto px-5 py-8 flex flex-col gap-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <a href="/" className="text-neutral-400 hover:text-neutral-700 transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </a>
          <h1 className="text-xl font-semibold tracking-tight">Flashcards</h1>
        </div>
        {/* View toggle */}
        <div className="flex items-center bg-neutral-100 rounded-lg p-0.5 text-xs font-medium">
          <button
            onClick={() => setView("topics")}
            className={`px-3 py-1.5 rounded-md transition-colors ${view === "topics" ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-500 hover:text-neutral-700"}`}
          >
            Topics
          </button>
          <button
            onClick={() => setView("resources")}
            className={`px-3 py-1.5 rounded-md transition-colors ${view === "resources" ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-500 hover:text-neutral-700"}`}
          >
            Resources
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="border border-neutral-100 rounded-xl px-4 py-3">
          <p className="text-2xl font-semibold tabular-nums">{streak}</p>
          <p className="text-xs text-neutral-400 mt-0.5">day streak</p>
        </div>
        <div className="border border-neutral-100 rounded-xl px-4 py-3">
          <p className="text-2xl font-semibold tabular-nums">{totalDue}</p>
          <p className="text-xs text-neutral-400 mt-0.5">due today</p>
        </div>
        <div className="border border-neutral-100 rounded-xl px-4 py-3">
          <p className="text-2xl font-semibold tabular-nums">{totalReviewed}</p>
          <p className="text-xs text-neutral-400 mt-0.5">reviewed</p>
        </div>
      </div>

      {/* Heatmap */}
      <div className="border border-neutral-100 rounded-xl px-4 py-4">
        <p className="text-xs text-neutral-400 uppercase tracking-wider font-medium mb-3">
          Activity
        </p>
        <Heatmap data={heatmap} weeks={26} />
        <div className="flex items-center gap-1.5 mt-3 justify-end">
          <span className="text-[10px] text-neutral-400">Less</span>
          {["bg-neutral-100","bg-neutral-300","bg-neutral-500","bg-neutral-700","bg-neutral-900"].map((c) => (
            <div key={c} className={`w-3 h-3 rounded-sm ${c}`} />
          ))}
          <span className="text-[10px] text-neutral-400">More</span>
        </div>
      </div>

      {/* Forecast */}
      <div className="border border-neutral-100 rounded-xl px-4 py-4">
        <p className="text-xs text-neutral-400 uppercase tracking-wider font-medium mb-3">
          Upcoming
        </p>
        <Forecast forecast={forecast} />
      </div>

      {/* Search */}
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
        </svg>
        <input
          type="text"
          placeholder="Search decks or cards..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-8 py-2.5 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:border-neutral-400 bg-white"
        />
        {search && (
          <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600">
            ✕
          </button>
        )}
      </div>

      {/* Card search results */}
      {query && matchingCards.length > 0 && (
        <div className="flex flex-col gap-1">
          <p className="text-xs text-neutral-400 uppercase tracking-wider font-medium mb-1">
            Cards — {matchingCards.length} result{matchingCards.length !== 1 ? "s" : ""}
          </p>
          <div className="border border-neutral-100 rounded-xl overflow-hidden divide-y divide-neutral-100">
            {matchingCards.slice(0, 8).map((card) => (
              <div key={card.id} className="px-4 py-3 bg-white">
                <p className="text-sm font-medium text-neutral-900 line-clamp-1">{card.question}</p>
                <p className="text-xs text-neutral-500 line-clamp-1 mt-0.5">{card.answer}</p>
                {card.deck && (
                  <span className="inline-block mt-1.5 text-[10px] text-neutral-400 bg-neutral-50 border border-neutral-100 rounded px-1.5 py-0.5">
                    {card.deck}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Global due */}
      {!query && (
        <button
          onClick={() => router.push("/study")}
          className="flex items-center justify-between w-full px-5 py-4 bg-neutral-900 text-white rounded-xl hover:bg-neutral-800 transition-colors"
        >
          <div className="text-left">
            <p className="font-medium">Review all due</p>
            <p className="text-sm text-neutral-400 mt-0.5">All decks combined</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-2xl font-semibold">{totalDue}</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </div>
        </button>
      )}

      {/* Topics view */}
      {view === "topics" && (
        <div className="flex flex-col gap-2">
          {!query && (
            <p className="text-xs text-neutral-400 uppercase tracking-wider font-medium">Topics</p>
          )}
          {filteredTags.length === 0 && (
            <p className="text-sm text-neutral-400 py-4 text-center">
              {query ? "No topics match your search." : "No tags yet — add a Tags multi_select to your flashcard DB in Notion."}
            </p>
          )}
          <div className="flex flex-col divide-y divide-neutral-100 border border-neutral-100 rounded-xl overflow-hidden">
            {filteredTags.map((tag) => (
              <button
                key={tag.name}
                onClick={() => router.push(`/study?tag=${encodeURIComponent(tag.name)}&name=${encodeURIComponent(tag.name)}`)}
                disabled={tag.due === 0}
                className="flex items-center justify-between px-5 py-4 bg-white hover:bg-neutral-50 transition-colors disabled:opacity-40 disabled:cursor-default text-left"
              >
                <div>
                  <p className="font-medium text-sm text-neutral-900">{tag.name}</p>
                  <p className="text-xs text-neutral-400 mt-0.5">{tag.total} card{tag.total !== 1 ? "s" : ""}</p>
                </div>
                <div className="flex items-center gap-3">
                  {tag.due > 0 ? (
                    <span className="text-sm font-semibold text-neutral-900 bg-neutral-100 rounded-full px-2.5 py-0.5">
                      {tag.due} due
                    </span>
                  ) : (
                    <span className="text-xs text-neutral-400">Done ✓</span>
                  )}
                  <svg className="text-neutral-300" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Resources view */}
      {view === "resources" && (
        <div className="flex flex-col gap-4">
          {!query && (
            <p className="text-xs text-neutral-400 uppercase tracking-wider font-medium">Resources</p>
          )}
          {filteredDecks.length === 0 && (
            <p className="text-sm text-neutral-400 py-4 text-center">
              {query ? "No resources match your search." : "No resources with cards yet."}
            </p>
          )}
          {groupedDecks.map(({ source, decks }) => (
            <div key={source} className="flex flex-col gap-1.5">
              <div className="flex items-center gap-1.5">
                <span className="text-sm leading-none">{SOURCE_ICON[source] ?? "·"}</span>
                <p className="text-xs text-neutral-400 uppercase tracking-wider font-medium">{source}</p>
              </div>
              <div className="flex flex-col divide-y divide-neutral-100 border border-neutral-100 rounded-xl overflow-hidden">
                {decks.map((deck) => (
                  <button
                    key={deck.id || deck.name}
                    onClick={() => router.push(`/study?resource=${encodeURIComponent(deck.id)}&name=${encodeURIComponent(deck.name)}`)}
                    disabled={deck.due === 0}
                    className="flex items-center justify-between px-5 py-4 bg-white hover:bg-neutral-50 transition-colors disabled:opacity-40 disabled:cursor-default text-left"
                  >
                    <div>
                      <p className="font-medium text-sm text-neutral-900">{deck.name}</p>
                      <p className="text-xs text-neutral-400 mt-0.5">
                        {deck.total} card{deck.total !== 1 ? "s" : ""}
                        {deck.topics.length > 0 && ` · ${deck.topics.join(", ")}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      {deck.due > 0 ? (
                        <span className="text-sm font-semibold text-neutral-900 bg-neutral-100 rounded-full px-2.5 py-0.5">
                          {deck.due} due
                        </span>
                      ) : (
                        <span className="text-xs text-neutral-400">Done ✓</span>
                      )}
                      <svg className="text-neutral-300" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M5 12h14M12 5l7 7-7 7" />
                      </svg>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
