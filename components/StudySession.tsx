"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Flashcard as FlashcardType } from "@/lib/notion";
import FlashcardView from "./FlashcardView";

interface ChatMessage { role: "user" | "assistant"; text: string }

function AiChatPanel({
  card,
  onClose,
}: {
  card: FlashcardType;
  onClose: () => void;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  async function send(text: string) {
    if (!text.trim() || loading) return;
    const userMsg: ChatMessage = { role: "user", text };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          topic: card.deck,
          cardQuestion: card.question,
          cardAnswer: card.answer,
        }),
      });
      const data = await res.json();
      setMessages((m) => [...m, { role: "assistant", text: data.answer ?? data.error ?? "Error" }]);
    } catch {
      setMessages((m) => [...m, { role: "assistant", text: "Something went wrong." }]);
    } finally {
      setLoading(false);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end" onClick={onClose}>
      <div
        className="w-full bg-white rounded-t-2xl shadow-xl border-t border-neutral-100 flex flex-col max-h-[80vh] max-w-xl mx-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-neutral-100 flex-shrink-0">
          <div className="w-10 h-1 bg-neutral-200 rounded-full absolute left-1/2 -translate-x-1/2 top-3" />
          <span className="text-sm font-semibold mt-2">Ask AI</span>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-700 mt-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Quick prompts (only before first message) */}
        {messages.length === 0 && (
          <div className="px-4 pt-3 pb-1 flex flex-wrap gap-2 flex-shrink-0">
            {["Explain this to me", "Give me an example", "Why does this matter?"].map((q) => (
              <button
                key={q}
                onClick={() => send(q)}
                className="text-xs px-3 py-1.5 rounded-full border border-neutral-200 hover:border-neutral-400 transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3 min-h-0">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
                  m.role === "user"
                    ? "bg-neutral-900 text-white rounded-br-sm"
                    : "bg-neutral-100 text-neutral-900 rounded-bl-sm"
                }`}
              >
                {m.text}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-neutral-100 rounded-2xl rounded-bl-sm px-4 py-2.5">
                <span className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce"
                      style={{ animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="px-4 pb-6 pt-2 flex gap-2 flex-shrink-0 border-t border-neutral-100">
          <input
            className="flex-1 text-sm border border-neutral-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-neutral-400"
            placeholder="Ask anything about this card…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); } }}
            autoFocus
          />
          <button
            onClick={() => send(input)}
            disabled={!input.trim() || loading}
            className="px-4 py-2.5 bg-neutral-900 text-white text-sm rounded-xl disabled:opacity-40 hover:bg-neutral-800 transition-colors"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

function getRetentionPct(card: FlashcardType): number | null {
  if (card.repetitions === 0 || !card.lastReview || card.interval === 0) return null;
  const daysSince =
    (Date.now() - new Date(card.lastReview).getTime()) / 86_400_000;
  return Math.min(99, Math.round(Math.pow(0.9, daysSince / card.interval) * 100));
}

function CardInfoPanel({ card, onClose }: { card: FlashcardType; onClose: () => void }) {
  const retention = getRetentionPct(card);
  const isNew = card.repetitions === 0;

  const rows: { label: string; value: string }[] = [
    { label: "Deck", value: card.deck || "—" },
    { label: "Ease factor", value: card.easeFactor.toFixed(2) },
    { label: "Interval", value: card.interval > 0 ? `${card.interval} day${card.interval !== 1 ? "s" : ""}` : "—" },
    { label: "Reviews", value: String(card.repetitions) },
    { label: "Last review", value: card.lastReview ? new Date(card.lastReview).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—" },
    { label: "Next review", value: card.nextReview ? new Date(card.nextReview).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end" onClick={onClose}>
      <div
        className="w-full bg-white rounded-t-2xl shadow-xl border border-neutral-100 px-5 pt-4 pb-8 max-w-xl mx-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="w-10 h-1 bg-neutral-200 rounded-full mx-auto mb-5" />

        {/* Retention */}
        <div className="mb-5">
          {isNew ? (
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-semibold">New</span>
              <span className="text-sm text-neutral-400">card — not yet reviewed</span>
            </div>
          ) : retention !== null ? (
            <>
              <div className="flex items-baseline gap-1.5 mb-1">
                <span className="text-3xl font-semibold tabular-nums">{retention}%</span>
                <span className="text-sm text-neutral-400">estimated retention</span>
              </div>
              <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    retention >= 80 ? "bg-neutral-900" : retention >= 50 ? "bg-neutral-500" : "bg-neutral-300"
                  }`}
                  style={{ width: `${retention}%` }}
                />
              </div>
            </>
          ) : null}
        </div>

        {/* Stats table */}
        <div className="divide-y divide-neutral-100 border border-neutral-100 rounded-xl overflow-hidden">
          {rows.map(({ label, value }) => (
            <div key={label} className="flex justify-between items-center px-4 py-2.5 bg-white">
              <span className="text-xs text-neutral-400">{label}</span>
              <span className="text-sm font-medium text-neutral-900">{value}</span>
            </div>
          ))}
        </div>

        <button
          onClick={onClose}
          className="mt-4 w-full py-3 text-sm border border-neutral-200 rounded-xl hover:bg-neutral-50 transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
}

type SessionState = "loading" | "ready" | "empty" | "done" | "error";

interface Props {
  resource?: string;
  deckLabel?: string;
  tag?: string;
}

export default function StudySession({ resource, deckLabel, tag }: Props) {
  const router = useRouter();
  const [cards, setCards] = useState<FlashcardType[]>([]);
  const [index, setIndex] = useState(0);
  const [state, setState] = useState<SessionState>("loading");
  const [flipped, setFlipped] = useState(false);
  const [rating, setRating] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [showInfo, setShowInfo] = useState(false);
  const [showAi, setShowAi] = useState(false);

  const label = deckLabel ?? (resource && resource !== "all" ? "Deck" : "All decks");

  const loadCards = useCallback(() => {
    setState("loading");
    setErrorMsg("");
    const url = resource && resource !== "all"
      ? `/api/cards?resource=${encodeURIComponent(resource)}`
      : tag
      ? `/api/cards?tag=${encodeURIComponent(tag)}`
      : "/api/cards";
    fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data: FlashcardType[]) => {
        if (data.length === 0) setState("empty");
        else {
          setCards(data);
          setIndex(0);
          setState("ready");
        }
      })
      .catch((e: Error) => {
        setErrorMsg(e.message);
        setState("error");
      });
  }, [resource]);

  useEffect(() => { loadCards(); }, [loadCards]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (state !== "ready") return;
      if ((e.key === " " || e.key === "Enter") && !flipped) {
        e.preventDefault();
        setFlipped(true);
      }
      if (flipped) {
        if (e.key === "1") handleRate(0);
        if (e.key === "2") handleRate(1);
        if (e.key === "3") handleRate(2);
        if (e.key === "4") handleRate(3);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, flipped]);

  const current = cards[index];
  const total = cards.length;
  const progress = total > 0 ? index / total : 0;

  const handleRate = useCallback(
    async (r: 0 | 1 | 2 | 3) => {
      if (!current || rating !== null) return;
      setRating(r);
      await fetch(`/api/cards/${current.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating: r,
          easeFactor: current.easeFactor,
          interval: current.interval,
          repetitions: current.repetitions,
        }),
      });
      setTimeout(() => {
        setRating(null);
        setFlipped(false);
        if (index + 1 >= total) setState("done");
        else setIndex((i) => i + 1);
      }, 300);
    },
    [current, index, total, rating]
  );

  const backBtn = (
    <button
      onClick={() => router.push("/library")}
      className="flex items-center gap-1.5 text-sm text-neutral-400 hover:text-neutral-700 transition-colors"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M19 12H5M12 19l-7-7 7-7" />
      </svg>
      Library
    </button>
  );

  if (state === "loading") {
    return (
      <div className="h-full flex flex-col">
        <header className="flex items-center justify-between px-5 py-4 border-b border-neutral-100">
          {backBtn}
          <span className="text-sm font-medium">{label}</span>
          <span className="w-14" />
        </header>
        <div className="flex-1 flex items-center justify-center">
          <span className="text-sm text-neutral-400">Loading cards...</span>
        </div>
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="h-full flex flex-col">
        <header className="flex items-center justify-between px-5 py-4 border-b border-neutral-100">
          {backBtn}
          <span className="text-sm font-medium">{label}</span>
          <span className="w-14" />
        </header>
        <div className="flex-1 flex flex-col items-center justify-center gap-3 px-6 text-center">
          <p className="text-sm font-semibold">Failed to load</p>
          <p className="text-xs text-neutral-500 font-mono">{errorMsg}</p>
          <button onClick={loadCards} className="mt-2 px-5 py-2 text-sm border border-neutral-200 rounded-md hover:bg-neutral-50">
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (state === "empty") {
    return (
      <div className="h-full flex flex-col">
        <header className="flex items-center justify-between px-5 py-4 border-b border-neutral-100">
          {backBtn}
          <span className="text-sm font-medium">{label}</span>
          <span className="w-14" />
        </header>
        <div className="flex-1 flex flex-col items-center justify-center gap-2 px-6 text-center">
          <p className="text-xl font-semibold">All caught up</p>
          <p className="text-sm text-neutral-500">No cards due for review today.</p>
        </div>
      </div>
    );
  }

  if (state === "done") {
    return (
      <div className="h-full flex flex-col">
        <header className="flex items-center justify-between px-5 py-4 border-b border-neutral-100">
          {backBtn}
          <span className="text-sm font-medium">{label}</span>
          <span className="w-14" />
        </header>
        <div className="flex-1 flex flex-col items-center justify-center gap-3 px-6 text-center">
          <p className="text-xl font-semibold">Session complete</p>
          <p className="text-sm text-neutral-500">
            You reviewed {total} card{total !== 1 ? "s" : ""}.
          </p>
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => router.push("/flashcards")}
              className="px-5 py-2 text-sm border border-neutral-200 rounded-md hover:bg-neutral-50 transition-colors"
            >
              Back to decks
            </button>
            <button
              onClick={loadCards}
              className="px-5 py-2 text-sm bg-neutral-900 text-white rounded-md hover:bg-neutral-800 transition-colors"
            >
              Review again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Card info sheet */}
      {showInfo && current && (
        <CardInfoPanel card={current} onClose={() => setShowInfo(false)} />
      )}
      {/* AI chat sheet */}
      {showAi && current && (
        <AiChatPanel card={current} onClose={() => setShowAi(false)} />
      )}

      {/* Header */}
      <header className="flex items-center justify-between px-5 py-4 border-b border-neutral-100">
        {backBtn}
        <span className="text-sm font-medium truncate max-w-[140px]">{label}</span>
        <div className="flex items-center gap-3 w-14 justify-end">
          <span className="text-sm text-neutral-400 tabular-nums">{total - index} left</span>
          <button
            onClick={() => setShowInfo(true)}
            className="text-neutral-400 hover:text-neutral-700 transition-colors"
            aria-label="Card info"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-4M12 8h.01" />
            </svg>
          </button>
        </div>
      </header>

      {/* Progress bar */}
      <div className="h-0.5 bg-neutral-100">
        <div
          className="h-full bg-neutral-900 transition-all duration-500"
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      {/* Card */}
      <div className="flex-1 flex items-center justify-center px-5 py-8">
        <FlashcardView
          card={current}
          flipped={flipped}
          onFlip={() => !flipped && setFlipped(true)}
        />
      </div>

      {/* Rating buttons */}
      <div
        className={`px-5 pb-8 transition-opacity duration-200 ${
          flipped ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        <div className="flex items-center justify-between max-w-md mx-auto mb-3">
          <p className="text-xs text-neutral-400">How well did you know this?</p>
          <button
            onClick={() => setShowAi(true)}
            className="flex items-center gap-1 text-xs text-neutral-400 hover:text-neutral-700 transition-colors"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
            </svg>
            Ask AI
          </button>
        </div>
        <div className="grid grid-cols-4 gap-2 max-w-md mx-auto">
          {(
            [
              { label: "Again", key: "1", r: 0 as const },
              { label: "Hard",  key: "2", r: 1 as const },
              { label: "Good",  key: "3", r: 2 as const },
              { label: "Easy",  key: "4", r: 3 as const },
            ] as const
          ).map(({ label, key, r }) => (
            <button
              key={label}
              onClick={() => handleRate(r)}
              disabled={rating !== null}
              className={`py-3 text-sm border rounded-md transition-all duration-150 flex flex-col items-center gap-0.5 disabled:cursor-not-allowed
                ${rating === r
                  ? "bg-neutral-900 text-white border-neutral-900"
                  : "border-neutral-200 hover:border-neutral-400 hover:bg-neutral-50"
                }`}
            >
              <span className="font-medium">{label}</span>
              <span className={`text-[10px] ${rating === r ? "text-neutral-400" : "text-neutral-400"}`}>{key}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tap hint */}
      <div
        className={`pb-8 text-center transition-opacity duration-200 ${
          flipped ? "opacity-0 pointer-events-none" : "opacity-100"
        }`}
      >
        <p className="text-xs text-neutral-400">Tap card to reveal · Space or Enter</p>
      </div>
    </div>
  );
}
