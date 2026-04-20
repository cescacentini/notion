import Link from "next/link";
import { getAllDatabases, DATABASE_ID, HABITS_DB, TASKS_DB, RESOURCES_DB, PROJECTS_DB, JOURNAL_DB } from "@/lib/notion";

export const dynamic = "force-dynamic";

function getNotionUrl(id: string): string {
  return `https://notion.so/${id.replace(/-/g, "")}`;
}

export default async function NotebooksPage() {
  const databases = await getAllDatabases();

  const sections = [
    {
      title: "Databases",
      items: databases.map((db) => ({
        id: db.id,
        name: db.title || "Untitled",
        url: getNotionUrl(db.id),
        desc: `${Object.keys(db.properties).length} properties`,
      })),
    },
    {
      title: "Quick Links",
      items: [
        { id: "home", name: "Dashboard", url: "https://notion.so/f8bdb3c869fc4b1ba227373e01f67c35", desc: "Your main workspace" },
        { id: "inbox", name: "Inbox", url: "https://notion.so", desc: "Capture ideas" },
      ],
    },
  ];

  return (
    <div className="min-h-full max-w-xl mx-auto px-5 py-8 flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Link href="/library" className="text-neutral-400 hover:text-neutral-700">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-xl font-semibold tracking-tight">Notebooks</h1>
      </div>

      <p className="text-sm text-neutral-500">Links to your Notion workspace</p>

      {sections.map((section) => (
        <div key={section.title}>
          <h2 className="font-medium text-sm text-neutral-500 mb-3">{section.title}</h2>
          <div className="flex flex-col gap-2">
            {section.items.map((item) => (
              <a
                key={item.id}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg hover:bg-neutral-100 transition-colors"
              >
                <div>
                  <p className="text-sm font-medium">{item.name}</p>
                  <p className="text-xs text-neutral-400">{item.desc}</p>
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-neutral-300">
                  <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" />
                </svg>
              </a>
            ))}
          </div>
        </div>
      ))}

      <div className="p-4 bg-neutral-900 text-white rounded-xl">
        <p className="text-sm font-medium mb-2">Open full Notion</p>
        <a
          href="https://notion.so"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-neutral-400 hover:text-white"
        >
          notion.so →
        </a>
      </div>
    </div>
  );
}