import Link from "next/link";

const REQUIRED = [
  {
    key: "NOTION_API_KEY",
    label: "Notion API Key",
    hint: 'Create an integration at notion.so/my-integrations, then copy the "Internal Integration Secret".',
    value: process.env.NOTION_API_KEY,
  },
  {
    key: "NOTION_DATABASE_ID",
    label: "Flashcard Database ID",
    hint: "Open your flashcard database in Notion, click Share → Copy link. The ID is the 32-character string in the URL before the ?.",
    value: process.env.NOTION_DATABASE_ID,
  },
];

const OPTIONAL = [
  {
    key: "NOTION_RESOURCES_DB",
    label: "Resources Database ID",
    section: "Resources & Decks",
    hint: "A database of books, courses, articles — used to organise flashcard decks by source.",
    value: process.env.NOTION_RESOURCES_DB,
  },
  {
    key: "NOTION_HABITS_DB",
    label: "Habits Database ID",
    section: "Daily Habits",
    hint: "A database with a Date property and one checkbox column per habit.",
    value: process.env.NOTION_HABITS_DB,
  },
  {
    key: "NOTION_TASKS_DB",
    label: "Tasks Database ID",
    section: "Task Scheduler",
    hint: 'A tasks database with "Do date", "Due date", "Priority", and a "Done" status property.',
    value: process.env.NOTION_TASKS_DB,
  },
  {
    key: "NOTION_PROJECTS_DB",
    label: "Projects Database ID",
    section: "Projects",
    hint: 'A projects database with a "Status" status property and a relation to your tasks database.',
    value: process.env.NOTION_PROJECTS_DB,
  },
  {
    key: "NOTION_JOURNAL_DB",
    label: "Journal Database ID",
    section: "Journal",
    hint: 'A database with a "Date" date property. One row = one journal entry.',
    value: process.env.NOTION_JOURNAL_DB,
  },
  {
    key: "NOTION_SOCIAL_DB",
    label: "Content Database ID",
    section: "Content Calendar",
    hint: 'A database with a "Published Date" date property and a "Status" status property.',
    value: process.env.NOTION_SOCIAL_DB,
  },
];

const ANTHROPIC_KEY = {
  key: "ANTHROPIC_API_KEY",
  label: "Anthropic API Key",
  hint: "Required for AI flashcard generation and the AI tutor. Get a key at console.anthropic.com.",
  value: process.env.ANTHROPIC_API_KEY,
};

function StatusDot({ set }: { set: boolean }) {
  return (
    <span className={`inline-block w-2 h-2 rounded-full flex-shrink-0 mt-1.5 ${set ? "bg-green-500" : "bg-neutral-300"}`} />
  );
}

export default function SetupPage() {
  const requiredDone = REQUIRED.every((v) => !!v.value);
  const configuredCount = OPTIONAL.filter((v) => !!v.value).length;

  return (
    <div className="min-h-full max-w-xl mx-auto px-5 py-8 flex flex-col gap-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/" className="text-neutral-400 hover:text-neutral-700 transition-colors">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Setup</h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            {requiredDone
              ? `Core configured · ${configuredCount}/${OPTIONAL.length} optional sections`
              : "Configure your Notion connection"}
          </p>
        </div>
      </div>

      {/* How it works */}
      <div className="bg-neutral-50 rounded-2xl p-5 text-sm text-neutral-600 space-y-1.5">
        <p className="font-medium text-neutral-900">How to connect Notion</p>
        <ol className="list-decimal list-inside space-y-1 text-sm">
          <li>
            Go to{" "}
            <span className="font-mono text-xs bg-white border border-neutral-200 rounded px-1 py-0.5">notion.so/my-integrations</span>
            {" "}→ New integration
          </li>
          <li>Give it a name, select your workspace, click Save</li>
          <li>Copy the <strong>Internal Integration Secret</strong> → <code className="text-xs bg-white border border-neutral-200 rounded px-1">NOTION_API_KEY</code></li>
          <li>Open each database in Notion → Share → Connect to your integration</li>
          <li>Copy each database ID from the URL and set the env vars below</li>
        </ol>
        <p className="text-xs text-neutral-400 pt-1">
          Set env vars in your <code className="bg-white border border-neutral-200 rounded px-1">.env.local</code> file when running locally, or in your Vercel project settings when deployed.
        </p>
      </div>

      {/* Required */}
      <div>
        <p className="text-xs text-neutral-400 uppercase tracking-wider font-medium mb-3">Required</p>
        <div className="border border-neutral-200 rounded-xl overflow-hidden divide-y divide-neutral-100">
          {REQUIRED.map(({ key, label, hint, value }) => (
            <div key={key} className="px-4 py-3 flex gap-3">
              <StatusDot set={!!value} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <code className="text-xs font-mono text-neutral-700">{key}</code>
                  {value && <span className="text-xs text-green-600 font-medium">Set</span>}
                  {!value && <span className="text-xs text-red-500 font-medium">Missing</span>}
                </div>
                <p className="text-xs text-neutral-500 leading-relaxed">{label} — {hint}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AI */}
      <div>
        <p className="text-xs text-neutral-400 uppercase tracking-wider font-medium mb-3">AI Features</p>
        <div className="border border-neutral-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 flex gap-3">
            <StatusDot set={!!ANTHROPIC_KEY.value} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <code className="text-xs font-mono text-neutral-700">{ANTHROPIC_KEY.key}</code>
                {ANTHROPIC_KEY.value
                  ? <span className="text-xs text-green-600 font-medium">Set</span>
                  : <span className="text-xs text-neutral-400 font-medium">Not set</span>}
              </div>
              <p className="text-xs text-neutral-500 leading-relaxed">{ANTHROPIC_KEY.hint}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Optional sections */}
      <div>
        <p className="text-xs text-neutral-400 uppercase tracking-wider font-medium mb-3">
          Optional Sections ({configuredCount}/{OPTIONAL.length} configured)
        </p>
        <div className="border border-neutral-200 rounded-xl overflow-hidden divide-y divide-neutral-100">
          {OPTIONAL.map(({ key, label, section, hint, value }) => (
            <div key={key} className="px-4 py-3 flex gap-3">
              <StatusDot set={!!value} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-sm font-medium text-neutral-800">{section}</span>
                  {value && <span className="text-xs text-green-600 font-medium">Active</span>}
                </div>
                <code className="text-xs font-mono text-neutral-400 block mb-0.5">{key}</code>
                <p className="text-xs text-neutral-500 leading-relaxed">{hint}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Database schema */}
      <div>
        <p className="text-xs text-neutral-400 uppercase tracking-wider font-medium mb-3">Flashcard Database Schema</p>
        <div className="border border-neutral-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 bg-neutral-50 border-b border-neutral-200">
            <p className="text-xs text-neutral-500">Your flashcard database needs these exact property names:</p>
          </div>
          <div className="divide-y divide-neutral-100">
            {[
              { name: "Question", type: "Title", required: true },
              { name: "Answer", type: "Text", required: true },
              { name: "EaseFactor", type: "Number", required: true },
              { name: "Interval", type: "Number", required: true },
              { name: "Repetitions", type: "Number", required: true },
              { name: "NextReview", type: "Date", required: true },
              { name: "LastReview", type: "Date", required: true },
              { name: "Deck", type: "Select", required: false },
              { name: "Resources", type: "Relation → Resources DB", required: false },
            ].map(({ name, type, required }) => (
              <div key={name} className="flex items-center justify-between px-4 py-2">
                <div className="flex items-center gap-2">
                  <code className="text-xs font-mono text-neutral-800">{name}</code>
                  {!required && <span className="text-xs text-neutral-400">optional</span>}
                </div>
                <span className="text-xs text-neutral-400">{type}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {requiredDone && (
        <Link
          href="/"
          className="block text-center py-3 bg-neutral-900 text-white text-sm font-medium rounded-xl hover:bg-neutral-800 transition-colors"
        >
          Back to app
        </Link>
      )}
    </div>
  );
}
