"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import type { DeckStat, Flashcard } from "@/lib/notion";
import Heatmap from "./Heatmap";
import Forecast from "./Forecast";

interface ForecastDay { date: string; label: string; count: number }

interface Props {
  decks: DeckStat[];
  totalDue: number;
  totalReviewed: number;
  streak: number;
  heatmap: Record<string, number>;
  forecast: ForecastDay[];
  allCards: Flashcard[];
}

export default function Dashboard({
  decks,
  totalDue,
  totalReviewed,
  streak,
  heatmap,
  forecast,
  allCards,
}: Props) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [showNewDeck, setShowNewDeck] = useState(false);
  const [newDeckName, setNewDeckName] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  const query = search.trim().toLowerCase();

  const filteredDecks = useMemo(() => {
    if (!query) return decks;
    return decks.filter((d) => d.name.toLowerCase().includes(query));
  }, [decks, query]);

  const matchingCards = useMemo(() => {
    if (!query) return [];
    return allCards.filter(
      (c) =>
        c.question.toLowerCase().includes(query) ||
        c.answer.toLowerCase().includes(query)
    );
  }, [allCards, query]);

  async function handleCreateDeck(e: React.FormEvent) {
    e.preventDefault();
    if (!newDeckName.trim()) return;
    setCreating(true);
    setCreateError("");
    try {
      const res = await fetch("/api/decks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newDeckName.trim() }),
      });
      if (!res.ok) throw new Error("Failed");
      setShowNewDeck(false);
      setNewDeckName("");
      router.refresh();
    } catch {
      setCreateError("Could not create deck. Try again.");
    } finally {
      setCreating(false);
    }
  }

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
        <button
          onClick={() => setShowNewDeck(true)}
          className="text-sm px-3 py-1.5 border border-neutral-200 rounded-md hover:bg-neutral-50 transition-colors"
        >
          + New deck
        </button>
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

      {/* Deck list */}
      <div className="flex flex-col gap-1">
        {!query && (
          <p className="text-xs text-neutral-400 uppercase tracking-wider font-medium mb-1">Decks</p>
        )}
        {filteredDecks.length === 0 && (
          <p className="text-sm text-neutral-400 py-4 text-center">
            {query ? "No decks match your search." : "No decks yet. Create one to get started."}
          </p>
        )}
        <div className="flex flex-col divide-y divide-neutral-100 border border-neutral-100 rounded-xl overflow-hidden">
          {filteredDecks.map((deck) => (
            <button
              key={deck.id || deck.name}
              onClick={() => router.push(`/study?resource=${encodeURIComponent(deck.id)}&name=${encodeURIComponent(deck.name)}`)}
              disabled={deck.due === 0}
              className="flex items-center justify-between px-5 py-4 bg-white hover:bg-neutral-50 transition-colors disabled:opacity-40 disabled:cursor-default text-left"
            >
              <div>
                <p className="font-medium text-sm text-neutral-900">{deck.name}</p>
                <p className="text-xs text-neutral-400 mt-0.5">{deck.total} card{deck.total !== 1 ? "s" : ""}</p>
              </div>
              <div className="flex items-center gap-3">
                {deck.due > 0 ? (
                  <span className="text-sm font-semibold text-neutral-900 bg-neutral-100 rounded-full px-2.5 py-0.5">
                    {deck.due} due
                  </span>
                ) : (
                  <span className="text-xs text-neutral-400">Done</span>
                )}
                <svg className="text-neutral-300" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* New deck modal */}
      {showNewDeck && (
        <div className="fixed inset-0 bg-black/30 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-xl">
            <h2 className="font-semibold text-lg mb-1">New deck</h2>
            <p className="text-sm text-neutral-500 mb-5">
              Name your deck — e.g. &quot;Neuroscienze L1&quot;. Then assign cards to it in Notion using the Deck property.
            </p>
            <form onSubmit={handleCreateDeck} className="flex flex-col gap-3">
              <input
                autoFocus
                type="text"
                placeholder="Deck name"
                value={newDeckName}
                onChange={(e) => setNewDeckName(e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:border-neutral-400"
              />
              {createError && <p className="text-xs text-red-500">{createError}</p>}
              <div className="flex gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => { setShowNewDeck(false); setNewDeckName(""); setCreateError(""); }}
                  className="flex-1 py-2.5 text-sm border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newDeckName.trim() || creating}
                  className="flex-1 py-2.5 text-sm bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 transition-colors disabled:opacity-40"
                >
                  {creating ? "Creating..." : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
