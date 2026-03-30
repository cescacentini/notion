"use client";

import { Flashcard } from "@/lib/notion";

interface Props {
  card: Flashcard;
  flipped: boolean;
  onFlip: () => void;
}

export default function FlashcardView({ card, flipped, onFlip }: Props) {
  return (
    <div
      className="card-scene w-full max-w-xl cursor-pointer"
      style={{ height: "min(60vh, 380px)" }}
      onClick={onFlip}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onFlip()}
      aria-label="Flashcard — click to flip"
    >
      <div className={`card-inner ${flipped ? "flipped" : ""}`}>
        {/* Front */}
        <div className="card-face border border-neutral-200 rounded-xl p-8 flex flex-col items-center justify-center bg-white">
          <span className="text-[10px] uppercase tracking-[0.15em] text-neutral-400 mb-6 font-medium">
            Question
          </span>
          <p className="text-xl font-medium leading-relaxed text-center text-neutral-900 max-w-sm">
            {card.question}
          </p>
        </div>

        {/* Back */}
        <div className="card-face card-back border border-neutral-900 rounded-xl p-8 flex flex-col items-center justify-center bg-neutral-900 overflow-auto">
          <span className="text-[10px] uppercase tracking-[0.15em] text-neutral-500 mb-6 font-medium">
            Answer
          </span>
          <p className="text-base leading-relaxed text-center text-white max-w-sm">
            {card.answer}
          </p>
        </div>
      </div>
    </div>
  );
}
