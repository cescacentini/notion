"use client";

import { useState, useEffect, useRef } from "react";

interface Entry {
  id: string;
  date: string;
  blocks: string[];
}

export default function JournalEditor() {
  const [entry, setEntry] = useState<Entry | null>(null);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/journal")
      .then((r) => r.json())
      .then((data) => {
        // Store id/date only — content is intentionally not displayed
        const e = data.entry;
        setEntry(e ? { id: e.id, date: e.date, blocks: [] } : null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [text]);

  async function handleSave() {
    if (!text.trim() || saving || !entry) return;
    setSaving(true);
    setSaveError("");
    try {
      const res = await fetch(`/api/journal/${entry.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text.trim() }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to save");
      }
      setText("");
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !entry) return;
    setUploadError("");
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`/api/journal/${entry.id}/image`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Upload failed");
      }
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      handleSave();
    }
  }

  if (loading) return <p className="text-sm text-neutral-400">Loading...</p>;

  if (!entry) {
    return (
      <div className="border border-dashed border-neutral-200 rounded-xl p-6 text-center">
        <p className="text-sm text-neutral-400">No entry for today yet.</p>
        <p className="text-xs text-neutral-300 mt-1">Create today&apos;s page in Notion first.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 pb-8">
      {/* Write area */}
      <textarea
        ref={textareaRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Write here..."
        rows={4}
        className="w-full resize-none text-sm text-neutral-900 placeholder-neutral-300 focus:outline-none leading-relaxed"
      />

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleImageChange}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-neutral-700 transition-colors disabled:opacity-40"
          >
            {uploading ? (
              <span>Uploading...</span>
            ) : (
              <>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
                Photo
              </>
            )}
          </button>
          {uploadError && <span className="text-xs text-red-400 truncate max-w-36">{uploadError}</span>}
        </div>

        <div className="flex items-center gap-3">
          {saveError && <span className="text-xs text-red-400 truncate max-w-36">{saveError}</span>}
          <span className="text-[11px] text-neutral-300 hidden sm:block">⌘ Enter</span>
          <button
            onClick={handleSave}
            disabled={!text.trim() || saving}
            className="text-xs bg-neutral-900 text-white rounded-lg px-3 py-1.5 hover:bg-neutral-800 transition-colors disabled:opacity-30"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
