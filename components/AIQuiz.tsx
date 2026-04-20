"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

interface AIChatProps {
  topic: string;
  onClose: () => void;
}

export default function AIQuiz({ topic, onClose }: AIChatProps) {
  const router = useRouter();
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<{ q: string; a: string }[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history, answer]);

  const askAI = async () => {
    if (!question.trim() || loading) return;
    const q = question.trim();
    setQuestion("");
    setLoading(true);
    setHistory((h) => [...h, { q, a: "" }]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: q, topic }),
      });
      const data = await res.json();
      setHistory((h) => {
        const newHist = [...h];
        newHist[newHist.length - 1].a = data.answer || data.error || "No response";
        return newHist;
      });
    } catch {
      setHistory((h) => {
        const newHist = [...h];
        newHist[newHist.length - 1].a = "Error connecting to AI";
        return newHist;
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/20" onClick={onClose}>
      <div
        className="w-full h-[80vh] bg-white rounded-t-2xl shadow-xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="font-medium">Quiz: {topic}</span>
          </div>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-600">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {history.length === 0 && (
            <div className="text-center text-neutral-400 py-8">
              <p className="text-sm">Ask me anything about {topic}</p>
              <p className="text-xs mt-2">e.g. "What is backpropagation?"</p>
            </div>
          )}
          {history.map((item, i) => (
            <div key={i} className="space-y-2">
              <div className="flex justify-end">
                <div className="bg-neutral-100 rounded-xl px-4 py-2 max-w-[80%]">
                  <p className="text-sm">{item.q}</p>
                </div>
              </div>
              <div className="flex justify-start">
                <div className="bg-neutral-900 text-white rounded-xl px-4 py-2 max-w-[80%]">
                  <p className="text-sm">{item.a || (i === history.length - 1 && loading ? "Thinking..." : "")}</p>
                </div>
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        <div className="px-5 py-4 border-t">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              askAI();
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask a question..."
              className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:border-neutral-900"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-neutral-900 text-white rounded-lg disabled:opacity-50"
            >
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}