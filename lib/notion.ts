const NOTION_API_KEY = process.env.NOTION_API_KEY!;
export const DATABASE_ID = process.env.NOTION_DATABASE_ID!;
const HABITS_DB   = "6d92cf60-331c-48db-aeed-76c7e484336e";
const TASKS_DB    = "1e3eea6c-05a6-4822-a7d1-f4b6cf80e8c8";
const RESOURCES_DB = "7ba24a8b-3c1b-42eb-ab9e-e301040ac368";
const SOCIAL_DB   = "85580ae9-1364-4e5f-a667-a2361cf25eb6";
const PROJECTS_DB = "a4e81701-9642-4210-b0d3-e2b146f93155";

const NOTION_VERSION = "2022-06-28";
const BASE = "https://api.notion.com/v1";

function headers() {
  return {
    Authorization: `Bearer ${NOTION_API_KEY}`,
    "Notion-Version": NOTION_VERSION,
    "Content-Type": "application/json",
  };
}

async function notionFetch(url: string, options?: RequestInit) {
  const res = await fetch(url, {
    ...options,
    headers: { ...headers(), ...(options?.headers ?? {}) },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Notion error: ${await res.text()}`);
  return res.json();
}

function extractText(rt: { plain_text: string }[]): string {
  return rt.map((t) => t.plain_text).join("");
}

// ─── Flashcards ────────────────────────────────────────────────────────────

export interface Flashcard {
  id: string;
  question: string;
  answer: string;
  deck: string;
  resourceIds: string[];
  easeFactor: number;
  interval: number;
  repetitions: number;
  nextReview: string | null;
  lastReview: string | null;
}

export interface DeckStat { id: string; name: string; total: number; due: number }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function pageToFlashcard(page: any): Flashcard {
  const p = page.properties;
  return {
    id: page.id,
    question: extractText(p.Question.title),
    answer: extractText(p.Answer.rich_text),
    deck: p.Deck?.select?.name ?? "",
    resourceIds: p.Resources?.relation?.map((r: { id: string }) => r.id) ?? [],
    easeFactor: p.EaseFactor.number ?? 2.5,
    interval: p.Interval.number ?? 0,
    repetitions: p.Repetitions.number ?? 0,
    nextReview: p.NextReview.date?.start ?? null,
    lastReview: p.LastReview?.date?.start ?? null,
  };
}

export async function getResourceTitles(ids: string[]): Promise<Record<string, string>> {
  const unique = [...new Set(ids)];
  const entries = await Promise.all(
    unique.map(async (id) => {
      const page = await notionFetch(`${BASE}/pages/${id}`);
      const p = page.properties;
      const title = extractText(p.Title?.title ?? p.Name?.title ?? []);
      return [id, title] as [string, string];
    })
  );
  return Object.fromEntries(entries);
}

async function queryAllCards(filter?: object): Promise<Flashcard[]> {
  const cards: Flashcard[] = [];
  let cursor: string | undefined;
  do {
    const body: Record<string, unknown> = { page_size: 100 };
    if (filter) body.filter = filter;
    if (cursor) body.start_cursor = cursor;
    const data = await notionFetch(`${BASE}/databases/${DATABASE_ID}/query`, {
      method: "POST",
      body: JSON.stringify(body),
    });
    cards.push(...data.results.map(pageToFlashcard));
    cursor = data.has_more ? data.next_cursor : undefined;
  } while (cursor);
  return cards;
}

export async function getAllCards(): Promise<Flashcard[]> {
  return queryAllCards();
}

export async function getDueCards(resourceId?: string): Promise<Flashcard[]> {
  const today = new Date().toISOString().split("T")[0];
  const dateFilter = {
    or: [
      { property: "NextReview", date: { is_empty: true } },
      { property: "NextReview", date: { on_or_before: today } },
    ],
  };
  const filter = resourceId && resourceId !== "all"
    ? { and: [dateFilter, { property: "Resources", relation: { contains: resourceId } }] }
    : dateFilter;
  return queryAllCards(filter);
}

export async function getDueCount(): Promise<number> {
  const cards = await getDueCards();
  return cards.length;
}

export async function getDeckStats(): Promise<DeckStat[]> {
  const all = await getAllCards();
  const today = new Date().toISOString().split("T")[0];

  // Collect all unique resource IDs
  const allResourceIds = [...new Set(all.flatMap((c) => c.resourceIds))];
  const titles = allResourceIds.length > 0 ? await getResourceTitles(allResourceIds) : {};

  const map = new Map<string, DeckStat>();

  const getOrCreate = (id: string, name: string) => {
    if (!map.has(id)) map.set(id, { id, name, total: 0, due: 0 });
    return map.get(id)!;
  };

  for (const card of all) {
    const isDue = !card.nextReview || card.nextReview <= today;
    if (card.resourceIds.length === 0) {
      const stat = getOrCreate("", "Uncategorized");
      stat.total++;
      if (isDue) stat.due++;
    } else {
      for (const rid of card.resourceIds) {
        const stat = getOrCreate(rid, titles[rid] ?? rid);
        stat.total++;
        if (isDue) stat.due++;
      }
    }
  }

  return Array.from(map.values()).sort((a, b) => b.due - a.due);
}

export async function updateCardSM2(
  pageId: string, easeFactor: number, interval: number,
  repetitions: number, nextReview: string
) {
  await notionFetch(`${BASE}/pages/${pageId}`, {
    method: "PATCH",
    body: JSON.stringify({
      properties: {
        EaseFactor: { number: easeFactor },
        Interval: { number: interval },
        Repetitions: { number: repetitions },
        NextReview: { date: { start: nextReview } },
        LastReview: { date: { start: new Date().toISOString().split("T")[0] } },
      },
    }),
  });
}

export async function createDeck(name: string): Promise<void> {
  await notionFetch(`${BASE}/pages`, {
    method: "POST",
    body: JSON.stringify({
      parent: { database_id: DATABASE_ID },
      properties: {
        Question: { title: [{ text: { content: "New card" } }] },
        Answer: { rich_text: [{ text: { content: "" } }] },
        Deck: { select: { name } },
      },
    }),
  });
}

// ─── Habits ────────────────────────────────────────────────────────────────

export const HABIT_KEYS = [
  { key: "Workout 30m",            label: "Workout" },
  { key: "Read 30m",               label: "Read" },
  { key: "Meditate 15m",           label: "Meditate" },
  { key: "Journal 15m",            label: "Journal" },
  { key: "play 20 minutes guitar", label: "Guitar" },
  { key: "wake up by 7am",         label: "Wake up 7am" },
  { key: "sleep by 12pm",          label: "Sleep 12pm" },
] as const;

export interface HabitsEntry {
  id: string;
  date: string;
  habits: { key: string; label: string; checked: boolean }[];
}

export async function getTodayHabits(): Promise<HabitsEntry | null> {
  const today = new Date().toISOString().split("T")[0];
  const data = await notionFetch(`${BASE}/databases/${HABITS_DB}/query`, {
    method: "POST",
    body: JSON.stringify({
      filter: { property: "Date", date: { equals: today } },
      page_size: 1,
    }),
  });
  if (!data.results.length) return null;
  const page = data.results[0];
  const p = page.properties;
  return {
    id: page.id,
    date: today,
    habits: HABIT_KEYS.map(({ key, label }) => ({
      key,
      label,
      checked: p[key]?.checkbox ?? false,
    })),
  };
}

export async function toggleHabit(
  pageId: string, habitKey: string, checked: boolean
): Promise<void> {
  await notionFetch(`${BASE}/pages/${pageId}`, {
    method: "PATCH",
    body: JSON.stringify({
      properties: { [habitKey]: { checkbox: checked } },
    }),
  });
}

// ─── Tasks ─────────────────────────────────────────────────────────────────

export interface Task {
  id: string;
  name: string;
  dueDate: string | null;
  doDate: string | null;
  priority: string | null;
  status: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function pageToTask(page: any): Task {
  const p = page.properties;
  return {
    id: page.id,
    name: extractText(p.Name.title),
    dueDate: p["Due date"]?.date?.start ?? null,
    doDate: p["Do date"]?.date?.start ?? null,
    priority: p.Priority?.select?.name ?? null,
    status: p.Done?.status?.name ?? "Not started",
  };
}

export async function getTodayTasks(): Promise<Task[]> {
  const today = new Date().toISOString().split("T")[0];

  const [doToday, overdue] = await Promise.all([
    // Scheduled for today
    notionFetch(`${BASE}/databases/${TASKS_DB}/query`, {
      method: "POST",
      body: JSON.stringify({
        filter: {
          and: [
            { property: "Do date", date: { equals: today } },
            { property: "Done", status: { does_not_equal: "Done" } },
          ],
        },
        page_size: 20,
      }),
    }),
    // Overdue (due date before today)
    notionFetch(`${BASE}/databases/${TASKS_DB}/query`, {
      method: "POST",
      body: JSON.stringify({
        filter: {
          and: [
            { property: "Due date", date: { before: today } },
            { property: "Done", status: { does_not_equal: "Done" } },
          ],
        },
        sorts: [{ property: "Due date", direction: "ascending" }],
        page_size: 10,
      }),
    }),
  ]);

  const seen = new Set<string>();
  const tasks: Task[] = [];
  for (const page of [...doToday.results, ...overdue.results]) {
    if (!seen.has(page.id)) { seen.add(page.id); tasks.push(pageToTask(page)); }
  }
  return tasks;
}

export async function markTaskDone(pageId: string): Promise<void> {
  await notionFetch(`${BASE}/pages/${pageId}`, {
    method: "PATCH",
    body: JSON.stringify({
      properties: { Done: { status: { name: "Done" } } },
    }),
  });
}

// ─── Resources ─────────────────────────────────────────────────────────────

export interface Resource {
  id: string;
  title: string;
  source: string | null;
  url: string | null;
  topics: string[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function pageToResource(page: any): Resource {
  const p = page.properties;
  return {
    id: page.id,
    title: extractText(p.Title.title),
    source: p.Source?.select?.name ?? null,
    url: p.URL?.url ?? null,
    topics: p.Topic?.multi_select?.map((t: { name: string }) => t.name) ?? [],
  };
}

export async function getInProgressResources(): Promise<Resource[]> {
  const data = await notionFetch(`${BASE}/databases/${RESOURCES_DB}/query`, {
    method: "POST",
    body: JSON.stringify({
      filter: { property: "Status", status: { equals: "In progress" } },
      sorts: [{ property: "Date added", direction: "descending" }],
      page_size: 20,
    }),
  });
  return data.results.map(pageToResource);
}

// ─── Social Posts ───────────────────────────────────────────────────────────

export interface SocialPost {
  id: string;
  name: string;
  status: string;
  caption: string;
}

export async function getTodaySocialPosts(): Promise<SocialPost[]> {
  const today = new Date().toISOString().split("T")[0];
  const data = await notionFetch(`${BASE}/databases/${SOCIAL_DB}/query`, {
    method: "POST",
    body: JSON.stringify({
      filter: { property: "Published Date", date: { equals: today } },
      page_size: 20,
    }),
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return data.results.map((page: any): SocialPost => {
    const p = page.properties;
    return {
      id: page.id,
      name: extractText(p.Title?.title ?? []),
      status: p.Status?.status?.name ?? "",
      caption: extractText(p.Caption?.rich_text ?? []),
    };
  });
}

// ─── Projects ──────────────────────────────────────────────────────────────

export interface Project {
  id: string;
  name: string;
  status: string;
  totalTasks: number;
  doneTasks: number;
}

export async function getActiveProjects(): Promise<Project[]> {
  const data = await notionFetch(`${BASE}/databases/${PROJECTS_DB}/query`, {
    method: "POST",
    body: JSON.stringify({
      filter: {
        or: [
          { property: "Status", status: { equals: "In progress" } },
          { property: "Status", status: { equals: "On Hold" } },
        ],
      },
      page_size: 20,
    }),
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const projects: Array<{ id: string; name: string; status: string; taskIds: string[] }> = data.results.map((page: any) => {
    const p = page.properties;
    return {
      id: page.id,
      name: extractText(p.Name?.title ?? []),
      status: p.Status?.status?.name ?? "",
      taskIds: p.Tasks?.relation?.map((r: { id: string }) => r.id) ?? [],
    };
  });

  const results = await Promise.all(
    projects.map(async (proj) => {
      const totalTasks = proj.taskIds.length;
      let doneTasks = 0;
      if (totalTasks > 0) {
        const doneData = await notionFetch(`${BASE}/databases/${TASKS_DB}/query`, {
          method: "POST",
          body: JSON.stringify({
            filter: {
              and: [
                { property: "Projects", relation: { contains: proj.id } },
                { property: "Done", status: { equals: "Done" } },
              ],
            },
            page_size: 100,
          }),
        });
        doneTasks = doneData.results.length;
      }
      return { id: proj.id, name: proj.name, status: proj.status, totalTasks, doneTasks };
    })
  );

  return results;
}
