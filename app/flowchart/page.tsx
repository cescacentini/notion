import { getAllDatabases, DATABASE_ID, HABITS_DB, TASKS_DB, RESOURCES_DB, PROJECTS_DB, JOURNAL_DB, SOCIAL_DB } from "@/lib/notion";
import Link from "next/link";

export const dynamic = "force-dynamic";

function getNotionDbUrl(id: string): string {
  return `https://notion.so/${id.replace(/-/g, "")}`;
}

interface DbInfo { name: string; color: string; icon: React.ReactNode }

function buildDbInfoMap(): Map<string, DbInfo> {
  const map = new Map<string, DbInfo>();

  const add = (id: string | undefined, info: DbInfo) => {
    if (id) map.set(id, info);
  };

  add(DATABASE_ID, {
    name: "Flashcards",
    color: "bg-orange-100 text-orange-700",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="2" y="6" width="20" height="14" rx="2" />
        <path d="M2 10h20M7 3l5 3 5-3" />
      </svg>
    ),
  });
  add(RESOURCES_DB, {
    name: "Resources",
    color: "bg-purple-100 text-purple-700",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
        <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
      </svg>
    ),
  });
  add(HABITS_DB, {
    name: "Habits",
    color: "bg-green-100 text-green-700",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M9 12l2 2 4-4" />
        <circle cx="12" cy="12" r="9" />
      </svg>
    ),
  });
  add(TASKS_DB, {
    name: "Tasks",
    color: "bg-blue-100 text-blue-700",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path d="M9 12l2 2 4-4" />
      </svg>
    ),
  });
  add(PROJECTS_DB, {
    name: "Projects",
    color: "bg-yellow-100 text-yellow-700",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
      </svg>
    ),
  });
  add(JOURNAL_DB, {
    name: "Journal",
    color: "bg-pink-100 text-pink-700",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
      </svg>
    ),
  });
  add(SOCIAL_DB, {
    name: "Content",
    color: "bg-rose-100 text-rose-700",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
        <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
      </svg>
    ),
  });

  return map;
}

export default async function FlowchartPage() {
  const [databases, dbInfoMap] = await Promise.all([
    getAllDatabases(),
    Promise.resolve(buildDbInfoMap()),
  ]);

  return (
    <div className="min-h-full max-w-xl mx-auto px-5 py-8 flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Link href="/" className="text-neutral-400 hover:text-neutral-700">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-xl font-semibold tracking-tight">Flowchart</h1>
      </div>

      <p className="text-sm text-neutral-500">Your Notion system. Click to open in Notion.</p>

      <div className="grid grid-cols-2 gap-3">
        {databases.map((db) => {
          const info = dbInfoMap.get(db.id) ?? {
            name: db.title || "Database",
            color: "bg-neutral-100 text-neutral-700",
            icon: null,
          };
          return (
            <div key={db.id} className={`p-4 rounded-xl border border-neutral-100 ${info.color}`}>
              <div className="flex items-center gap-2 mb-2">
                {info.icon}
                <span className="font-medium text-sm">{info.name}</span>
              </div>
              <p className="text-xs opacity-70">{Object.keys(db.properties).length} properties</p>
              <a
                href={getNotionDbUrl(db.id)}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center text-xs hover:underline"
              >
                Open in Notion
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="ml-1">
                  <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" />
                </svg>
              </a>
            </div>
          );
        })}
      </div>

      <Link href="/" className="text-center text-sm text-neutral-400 hover:text-neutral-600">
        ← Back to home
      </Link>
    </div>
  );
}
