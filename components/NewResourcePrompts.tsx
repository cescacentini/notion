"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { Resource } from "@/lib/notion";
import { SOURCE_ICON } from "@/components/FlashcardsCard";

interface GenerationResult {
  created: number;
  resourceId: string;
  resourceName: string;
}

function NewResourcePrompt({ resource }: { resource: Resource }) {
  const router = useRouter();
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [error, setError] = useState("");
  const [dismissed, setDismissed] = useState(false);

  function handleDismiss() {
    try {
      const raw = localStorage.getItem("dismissed-new-resource-prompts");
      const ids: string[] = raw ? JSON.parse(raw) : [];
      if (!ids.includes(resource.id)) ids.push(resource.id);
      localStorage.setItem("dismissed-new-resource-prompts", JSON.stringify(ids));
    } catch { /* ignore */ }
    setDismissed(true);
  }

  async function handleGenerate() {
    setGenerating(true);
    setError("");
    try {
      const res = await fetch("/api/generate-flashcards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resourceId: resource.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setResult(data as GenerationResult);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setGenerating(false);
    }
  }

  if (dismissed) return null;

  const icon = SOURCE_ICON[resource.source ?? ""] ?? "·";

  if (result) {
    return (
      <div className="flex items-center justify-between border border-neutral-100 rounded-xl px-4 py-3 bg-white">
        <p className="text-sm text-neutral-700 min-w-0 truncate">
          <span className="mr-1.5 text-neutral-500">✓</span>
          <span className="font-medium">{result.created} cards created</span>
          <span className="text-neutral-400"> for {resource.title}</span>
        </p>
        <a
          href={`/study?resource=${encodeURIComponent(result.resourceId)}&name=${encodeURIComponent(result.resourceName)}`}
          className="text-xs text-neutral-900 border border-neutral-200 rounded-md px-2.5 py-1.5 hover:bg-neutral-50 transition-colors whitespace-nowrap ml-3 flex-shrink-0"
        >
          Start studying →
        </a>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between border border-neutral-200 border-dashed rounded-xl px-4 py-3">
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-base leading-none flex-shrink-0">{icon}</span>
        <p className="text-sm text-neutral-700 truncate">
          <span className="text-neutral-400">New resource: </span>
          <span className="font-medium">{resource.title}</span>
          <span className="text-neutral-400"> — want to create flashcards with AI?</span>
        </p>
      </div>
      <div className="flex items-center gap-2 ml-3 flex-shrink-0">
        {error && <span className="text-xs text-red-500 max-w-24 truncate">{error}</span>}
        <button
          onClick={handleDismiss}
          className="text-xs text-neutral-400 hover:text-neutral-600 transition-colors"
          aria-label="Dismiss"
        >
          ✕
        </button>
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="text-xs bg-neutral-900 text-white rounded-md px-2.5 py-1.5 hover:bg-neutral-800 transition-colors disabled:opacity-40"
        >
          {generating ? "Generating..." : "Generate"}
        </button>
      </div>
    </div>
  );
}

export default function NewResourcePrompts() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Read dismissed IDs from localStorage
    try {
      const raw = localStorage.getItem("dismissed-new-resource-prompts");
      const ids: string[] = raw ? JSON.parse(raw) : [];
      setDismissed(new Set(ids));
    } catch { /* ignore */ }

    // Fetch resources with no cards in the background
    fetch("/api/new-resources")
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setResources(data); })
      .catch(() => { /* silently fail */ });
  }, []);

  const visible = resources.filter((r) => !dismissed.has(r.id));
  if (visible.length === 0) return null;

  return (
    <section className="flex flex-col gap-2">
      <p className="text-xs text-neutral-400 uppercase tracking-wider font-medium">
        No flashcards yet
      </p>
      {visible.map((r) => (
        <NewResourcePrompt key={r.id} resource={r} />
      ))}
    </section>
  );
}
