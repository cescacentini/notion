const NOTION_API_KEY = process.env.NOTION_API_KEY!;
export const DATABASE_ID   = process.env.NOTION_DATABASE_ID!;
export const RESOURCES_DB  = process.env.NOTION_RESOURCES_DB;
export const TASKS_DB      = process.env.NOTION_TASKS_DB;
export const SOCIAL_DB     = process.env.NOTION_SOCIAL_DB;
export const PROJECTS_DB   = process.env.NOTION_PROJECTS_DB;
export const JOURNAL_DB    = process.env.NOTION_JOURNAL_DB;
export const VOCAB_DB      = process.env.NOTION_VOCAB_DB;

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
  deck: string;      // first tag or legacy Deck select, kept for compat
  tags: string[];    // all Tags multi_select values
  resourceIds: string[];
  easeFactor: number;
  interval: number;
  repetitions: number;
  nextReview: string | null;
  lastReview: string | null;
}

export interface DeckStat {
  id: string;
  name: string;
  total: number;
  due: number;
  source: string | null;
  topics: string[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function pageToFlashcard(page: any): Flashcard {
  const p = page.properties;
  // Tags multi_select (preferred) — falls back to legacy Deck select
  const tags: string[] = p.Tags?.multi_select?.map((t: { name: string }) => t.name) ?? [];
  const legacyDeck: string = p.Deck?.select?.name ?? "";
  const allTags = tags.length > 0 ? tags : (legacyDeck ? [legacyDeck] : []);
  return {
    id: page.id,
    question: extractText(p.Question.title),
    answer: extractText(p.Answer.rich_text),
    deck: allTags[0] ?? "",
    tags: allTags,
    resourceIds: p.Resources?.relation?.map((r: { id: string }) => r.id) ?? [],
    easeFactor: p.EaseFactor?.number ?? 2.5,
    interval: p.Interval?.number ?? 0,
    repetitions: p.Repetitions?.number ?? 0,
    nextReview: p.NextReview?.date?.start ?? null,
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

interface ResourceDetails { title: string; source: string | null; topics: string[] }

async function getResourceDetails(ids: string[]): Promise<Record<string, ResourceDetails>> {
  const unique = [...new Set(ids)];
  const entries = await Promise.all(
    unique.map(async (id) => {
      const page = await notionFetch(`${BASE}/pages/${id}`);
      const p = page.properties;
      return [id, {
        title:  extractText(p.Title?.title ?? p.Name?.title ?? []),
        source: p.Source?.select?.name ?? null,
        topics: p.Topic?.multi_select?.map((t: { name: string }) => t.name) ?? [],
      }] as [string, ResourceDetails];
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

export async function getResourcesWithNoCards(): Promise<Resource[]> {
  const resources = await getInProgressResources();
  const checks = await Promise.all(
    resources.map(async (r) => {
      const data = await notionFetch(`${BASE}/databases/${DATABASE_ID}/query`, {
        method: "POST",
        body: JSON.stringify({
          filter: { property: "Resources", relation: { contains: r.id } },
          page_size: 1,
        }),
      });
      return { resource: r, hasCards: data.results.length > 0 };
    })
  );
  return checks.filter((c) => !c.hasCards).map((c) => c.resource);
}

export async function getDueCards(resourceId?: string, tag?: string): Promise<Flashcard[]> {
  const today = new Date().toISOString().split("T")[0];
  const dateFilter = {
    or: [
      { property: "NextReview", date: { is_empty: true } },
      { property: "NextReview", date: { on_or_before: today } },
    ],
  };
  let filter: object;
  if (resourceId && resourceId !== "all") {
    filter = { and: [dateFilter, { property: "Resources", relation: { contains: resourceId } }] };
  } else if (tag === "Untagged") {
    filter = {
      and: [
        dateFilter,
        { property: "Tags", multi_select: { is_empty: true } },
        { property: "Deck", select: { is_empty: true } },
      ],
    };
  } else if (tag) {
    filter = {
      and: [
        dateFilter,
        {
          or: [
            { property: "Tags", multi_select: { contains: tag } },
            { property: "Deck", select: { equals: tag } },
          ],
        },
      ],
    };
  } else {
    filter = dateFilter;
  }
  return queryAllCards(filter);
}

export async function getTagStats(): Promise<DeckStat[]> {
  const all = await getAllCards();
  const today = new Date().toISOString().split("T")[0];
  const map = new Map<string, DeckStat>();
  for (const card of all) {
    const isDue = !card.nextReview || card.nextReview <= today;
    const cardTags = card.tags.length > 0 ? card.tags : ["Untagged"];
    for (const tag of cardTags) {
      if (!map.has(tag)) map.set(tag, { id: tag, name: tag, total: 0, due: 0, source: null, topics: [] });
      const stat = map.get(tag)!;
      stat.total++;
      if (isDue) stat.due++;
    }
  }
  return Array.from(map.values()).sort((a, b) => b.due - a.due);
}

export async function getDueCount(): Promise<number> {
  const today = new Date().toISOString().split("T")[0];
  const data = await notionFetch(`${BASE}/databases/${DATABASE_ID}/query`, {
    method: "POST",
    body: JSON.stringify({
      filter: {
        or: [
          { property: "NextReview", date: { is_empty: true } },
          { property: "NextReview", date: { on_or_before: today } },
        ],
      },
      page_size: 100,
    }),
  });
  return data.results.length;
}

export async function getRecentlyReviewed(limit = 10): Promise<Flashcard[]> {
  const allCards = await getAllCards();
  return allCards
    .filter((c) => c.lastReview)
    .sort((a, b) => new Date(b.lastReview!).getTime() - new Date(a.lastReview!).getTime())
    .slice(0, limit);
}

export async function getPageContent(pageId: string): Promise<string[]> {
  const data = await notionFetch(`${BASE}/blocks/${pageId}/children?page_size=100`);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data.results as any[])
    .filter((b: any) => b[b.type]?.rich_text)
    .map((b: any) => {
      const richText = b[b.type].rich_text;
      return richText?.map((t: { plain_text: string }) => t.plain_text).join("") ?? "";
    })
    .filter(Boolean);
}

export async function getDeckStats(): Promise<DeckStat[]> {
  const all = await getAllCards();
  const today = new Date().toISOString().split("T")[0];

  const allResourceIds = [...new Set(all.flatMap((c) => c.resourceIds))];
  const details = allResourceIds.length > 0 ? await getResourceDetails(allResourceIds) : {};

  const map = new Map<string, DeckStat>();
  const getOrCreate = (id: string, name: string, source: string | null, topics: string[]) => {
    if (!map.has(id)) map.set(id, { id, name, total: 0, due: 0, source, topics });
    return map.get(id)!;
  };

  for (const card of all) {
    const isDue = !card.nextReview || card.nextReview <= today;
    if (card.resourceIds.length === 0) {
      const stat = getOrCreate("", "Uncategorized", null, []);
      stat.total++;
      if (isDue) stat.due++;
    } else {
      for (const rid of card.resourceIds) {
        const d = details[rid];
        const stat = getOrCreate(rid, d?.title ?? rid, d?.source ?? null, d?.topics ?? []);
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
        EaseFactor:  { number: easeFactor },
        Interval:    { number: interval },
        Repetitions: { number: repetitions },
        NextReview:  { date: { start: nextReview } },
        LastReview:  { date: { start: new Date().toISOString().split("T")[0] } },
      },
    }),
  });
}

export async function getResourceById(id: string): Promise<Resource> {
  const page = await notionFetch(`${BASE}/pages/${id}`);
  return pageToResource(page);
}

export async function createFlashcard(input: {
  question: string;
  answer: string;
  resourceId: string;
  tags?: string[];
}): Promise<void> {
  const properties: Record<string, unknown> = {
    Question:  { title: [{ text: { content: input.question } }] },
    Answer:    { rich_text: [{ text: { content: input.answer } }] },
    Resources: { relation: [{ id: input.resourceId }] },
  };
  if (input.tags && input.tags.length > 0) {
    properties.Tags = { multi_select: input.tags.map((name) => ({ name })) };
  }
  await notionFetch(`${BASE}/pages`, {
    method: "POST",
    body: JSON.stringify({ parent: { database_id: DATABASE_ID }, properties }),
  });
}

export async function createDeck(name: string): Promise<void> {
  await notionFetch(`${BASE}/pages`, {
    method: "POST",
    body: JSON.stringify({
      parent: { database_id: DATABASE_ID },
      properties: {
        Question: { title: [{ text: { content: "New card" } }] },
        Answer:   { rich_text: [{ text: { content: "" } }] },
        Deck:     { select: { name } },
      },
    }),
  });
}

// ─── Habits ────────────────────────────────────────────────────────────────
// Daily habit ticks are checkbox properties on each day's Journal page.

export interface HabitKey { key: string; label: string }

export interface HabitsEntry {
  id: string;
  date: string;
  habits: { key: string; label: string; checked: boolean }[];
}

async function getHabitKeys(): Promise<HabitKey[]> {
  if (!JOURNAL_DB) return [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const schema = await notionFetch(`${BASE}/databases/${JOURNAL_DB}`);
  return Object.entries(schema.properties as Record<string, { type: string }>)
    .filter(([, prop]) => prop.type === "checkbox")
    .map(([name]) => ({ key: name, label: name }));
}

export async function getTodayHabits(): Promise<HabitsEntry | null> {
  if (!JOURNAL_DB) return null;
  const today = new Date().toISOString().split("T")[0];

  const [habitKeys, data] = await Promise.all([
    getHabitKeys(),
    notionFetch(`${BASE}/databases/${JOURNAL_DB}/query`, {
      method: "POST",
      body: JSON.stringify({
        filter: { property: "Date", date: { equals: today } },
        page_size: 1,
      }),
    }),
  ]);

  if (!data.results.length) return null;
  const page = data.results[0];
  const p = page.properties;
  return {
    id: page.id,
    date: today,
    habits: habitKeys.map(({ key, label }) => ({
      key,
      label,
      checked: p[key]?.checkbox ?? false,
    })),
  };
}

export async function createTodayHabits(): Promise<HabitsEntry | null> {
  if (!JOURNAL_DB) return null;
  const existing = await getTodayHabits();
  if (existing) return existing;

  const today = new Date().toISOString().split("T")[0];
  const [habitKeys, page] = await Promise.all([
    getHabitKeys(),
    notionFetch(`${BASE}/pages`, {
      method: "POST",
      body: JSON.stringify({
        parent: { database_id: JOURNAL_DB },
        properties: {
          Name: { title: [{ text: { content: today } }] },
          Date: { date: { start: today } },
        },
      }),
    }),
  ]);
  return {
    id: page.id,
    date: today,
    habits: habitKeys.map(({ key, label }) => ({ key, label, checked: false })),
  };
}

export async function toggleHabit(
  pageId: string, habitKey: string, checked: boolean
): Promise<void> {
  if (!JOURNAL_DB) return;
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
    doDate:  p["Do date"]?.date?.start ?? null,
    priority: p.Priority?.select?.name ?? null,
    status:   p.Done?.status?.name ?? "Not started",
  };
}

export async function getTodayTasks(): Promise<Task[]> {
  if (!TASKS_DB) return [];
  const today = new Date().toISOString().split("T")[0];

  const [doToday, dueToday, overdue] = await Promise.all([
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
    notionFetch(`${BASE}/databases/${TASKS_DB}/query`, {
      method: "POST",
      body: JSON.stringify({
        filter: {
          and: [
            { property: "Due date", date: { equals: today } },
            { property: "Done", status: { does_not_equal: "Done" } },
          ],
        },
        page_size: 10,
      }),
    }),
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
  for (const page of [...dueToday.results, ...overdue.results]) {
    if (!seen.has(page.id)) { seen.add(page.id); tasks.push(pageToTask(page)); }
  }
  return tasks;
}

export async function markTaskDone(pageId: string): Promise<void> {
  if (!TASKS_DB) return;
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
    url:    p.URL?.url ?? null,
    topics: p.Topic?.multi_select?.map((t: { name: string }) => t.name) ?? [],
  };
}

export async function getInProgressResources(): Promise<Resource[]> {
  if (!RESOURCES_DB) return [];
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

export async function getAllResources(): Promise<Resource[]> {
  if (!RESOURCES_DB) return [];
  const data = await notionFetch(`${BASE}/databases/${RESOURCES_DB}/query`, {
    method: "POST",
    body: JSON.stringify({
      sorts: [{ property: "Date added", direction: "descending" }],
      page_size: 50,
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
  if (!SOCIAL_DB) return [];
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
      name:    extractText(p.Name?.title ?? p.Title?.title ?? []),
      status:  p.Status?.status?.name ?? "",
      caption: extractText(p.Caption?.rich_text ?? []),
    };
  });
}

// ─── Projects ──────────────────────────────────────────────────────────────

export interface Project {
  id: string;
  name: string;
  status: string;
  priority: string | null;
  startDate: string | null;
  dueDate: string | null;
  goalIds: string[];
  totalTasks: number;
  doneTasks: number;
}

export interface GoalOverview {
  id: string;
  name: string;
  type: string | null;
  startDate: string | null;
  byWhen: string | null;
  status: string;
  progress: number | null;
  doneProjects: number;
  totalProjects: number;
  activeProjects: Project[];
}

export interface ProjectsOverview {
  goals: GoalOverview[];
  withoutGoal: Project[];
}

const ACTIVE_PROJECT_STATUSES = ["In progress", "On Hold"];
const CLOSED_GOAL_STATUSES = ["Done", "abandoned"];
const PRIORITY_ORDER = ["Urgent", "High", "Medium", "Low"];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function queryAllPages(databaseId: string, query: object = {}): Promise<any[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pages: any[] = [];
  let cursor: string | undefined;
  do {
    const data = await notionFetch(`${BASE}/databases/${databaseId}/query`, {
      method: "POST",
      body: JSON.stringify({ ...query, page_size: 100, ...(cursor ? { start_cursor: cursor } : {}) }),
    });
    pages.push(...data.results);
    cursor = data.has_more ? data.next_cursor : undefined;
  } while (cursor);
  return pages;
}

function compareProjects(a: Project, b: Project): number {
  const rank = (priority: string | null) => {
    const i = PRIORITY_ORDER.indexOf(priority ?? "");
    return i === -1 ? PRIORITY_ORDER.length : i;
  };
  return (
    ACTIVE_PROJECT_STATUSES.indexOf(a.status) - ACTIVE_PROJECT_STATUSES.indexOf(b.status) ||
    rank(a.priority) - rank(b.priority) ||
    (a.dueDate ?? "9999").localeCompare(b.dueDate ?? "9999")
  );
}

function projectProgress(project: Project): number {
  if (project.status === "Completed") return 1;
  return project.totalTasks > 0 ? project.doneTasks / project.totalTasks : 0;
}

export async function getProjectsOverview(): Promise<ProjectsOverview> {
  if (!PROJECTS_DB) return { goals: [], withoutGoal: [] };

  const schema = await notionFetch(`${BASE}/databases/${PROJECTS_DB}`);
  const goalsDb: string | undefined = schema.properties.Goals?.relation?.database_id;

  const [projectPages, taskPages, goalPages] = await Promise.all([
    queryAllPages(PROJECTS_DB, { filter: { property: "Status", status: { does_not_equal: "Abandoned" } } }),
    TASKS_DB
      ? queryAllPages(TASKS_DB, { filter: { property: "Projects", relation: { is_not_empty: true } } })
      : Promise.resolve([]),
    goalsDb ? queryAllPages(goalsDb) : Promise.resolve([]),
  ]);

  // Counted from the tasks themselves: a page's relation property stops at 25 items.
  const taskCounts = new Map<string, { total: number; done: number }>();
  for (const task of taskPages) {
    const isDone = task.properties.Done?.status?.name === "Done";
    for (const { id } of task.properties.Projects?.relation ?? []) {
      const counts = taskCounts.get(id) ?? { total: 0, done: 0 };
      counts.total++;
      if (isDone) counts.done++;
      taskCounts.set(id, counts);
    }
  }

  const projects: Project[] = projectPages.map((page) => {
    const p = page.properties;
    const counts = taskCounts.get(page.id);
    return {
      id: page.id,
      name: extractText(p.Name?.title ?? []),
      status: p.Status?.status?.name ?? "",
      priority: p.Priority?.select?.name ?? null,
      startDate: p["Due Date"]?.date?.start ?? null,
      // A date range in Notion is due at its end.
      dueDate: p["Due Date"]?.date?.end ?? p["Due Date"]?.date?.start ?? null,
      goalIds: p.Goals?.relation?.map((r: { id: string }) => r.id) ?? [],
      totalTasks: counts?.total ?? 0,
      doneTasks: counts?.done ?? 0,
    };
  });
  const isActive = (project: Project) => ACTIVE_PROJECT_STATUSES.includes(project.status);

  const goals: GoalOverview[] = goalPages
    .filter((page) => !CLOSED_GOAL_STATUSES.includes(page.properties.Status?.status?.name))
    .map((page) => {
      const p = page.properties;
      const linked = projects.filter((project) => project.goalIds.includes(page.id));
      return {
        id: page.id,
        name: extractText(p.Name?.title ?? []),
        type: p.type?.select?.name ?? null,
        startDate: p["by when"]?.date?.start ?? null,
        byWhen: p["by when"]?.date?.end ?? p["by when"]?.date?.start ?? null,
        status: p.Status?.status?.name ?? "",
        progress: linked.length > 0
          ? linked.reduce((sum, project) => sum + projectProgress(project), 0) / linked.length
          : null,
        doneProjects: linked.filter((project) => project.status === "Completed").length,
        totalProjects: linked.length,
        activeProjects: linked.filter(isActive).sort(compareProjects),
      };
    })
    .sort((a, b) => (a.byWhen ?? "9999").localeCompare(b.byWhen ?? "9999"));

  const openGoalIds = new Set(goals.map((goal) => goal.id));
  const withoutGoal = projects
    .filter((project) => isActive(project) && !project.goalIds.some((id) => openGoalIds.has(id)))
    .sort(compareProjects);

  return { goals, withoutGoal };
}

export async function getProjectResources(projectId: string): Promise<Resource[]> {
  const page = await notionFetch(`${BASE}/pages/${projectId}`);
  const ids: string[] = page.properties.Resources?.relation?.map((r: { id: string }) => r.id) ?? [];
  return Promise.all(ids.map(getResourceById));
}

export async function getProjectTasks(projectId: string): Promise<Task[]> {
  if (!TASKS_DB) return [];
  const data = await notionFetch(`${BASE}/databases/${TASKS_DB}/query`, {
    method: "POST",
    body: JSON.stringify({
      filter: { property: "Projects", relation: { contains: projectId } },
      sorts: [{ property: "Done", direction: "ascending" }],
      page_size: 50,
    }),
  });
  return data.results.map(pageToTask);
}

export async function getActiveProjectsCount(): Promise<number> {
  if (!PROJECTS_DB) return 0;
  const data = await notionFetch(`${BASE}/databases/${PROJECTS_DB}/query`, {
    method: "POST",
    body: JSON.stringify({
      filter: {
        or: [
          { property: "Status", status: { equals: "In progress" } },
          { property: "Status", status: { equals: "On Hold" } },
        ],
      },
      page_size: 100,
    }),
  });
  return data.results.length;
}

// ─── Journal ───────────────────────────────────────────────────────────────

export interface JournalPage {
  id: string;
  date: string;
}

export async function getTodayJournalPage(): Promise<JournalPage | null> {
  if (!JOURNAL_DB) return null;
  const today = new Date().toISOString().split("T")[0];
  try {
    const data = await notionFetch(`${BASE}/databases/${JOURNAL_DB}/query`, {
      method: "POST",
      body: JSON.stringify({
        filter: { property: "Date", date: { equals: today } },
        page_size: 1,
      }),
    });
    if (!data.results.length) return null;
    return { id: data.results[0].id, date: today };
  } catch {
    return null;
  }
}

export async function getPageTextBlocks(pageId: string): Promise<string[]> {
  const data = await notionFetch(`${BASE}/blocks/${pageId}/children?page_size=100`);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data.results as any[]).flatMap((b) => {
    const richText = b[b.type]?.rich_text as { plain_text: string }[] | undefined;
    if (!richText) return [];
    const text = extractText(richText);
    return text ? [text] : [];
  });
}

export async function appendImageBlock(pageId: string, fileUploadId: string): Promise<void> {
  await notionFetch(`${BASE}/blocks/${pageId}/children`, {
    method: "PATCH",
    body: JSON.stringify({
      children: [{
        type: "image",
        image: { type: "file_upload", file_upload: { id: fileUploadId } },
      }],
    }),
  });
}

export async function appendJournalBlock(pageId: string, text: string): Promise<void> {
  await notionFetch(`${BASE}/blocks/${pageId}/children`, {
    method: "PATCH",
    body: JSON.stringify({
      children: [{
        object: "block",
        type: "paragraph",
        paragraph: { rich_text: [{ type: "text", text: { content: text } }] },
      }],
    }),
  });
}

export interface NotionDatabase {
  id: string;
  title: string;
  properties: Record<string, { type: string; name: string }>;
}

export async function getAllDatabases(): Promise<NotionDatabase[]> {
  const dbIds = [
    DATABASE_ID,
    RESOURCES_DB,
    TASKS_DB,
    SOCIAL_DB,
    PROJECTS_DB,
    JOURNAL_DB,
  ].filter(Boolean) as string[];

  const results = await Promise.allSettled(
    dbIds.map(async (dbId) => {
      const schema = await notionFetch(`${BASE}/databases/${dbId}`);
      const props: Record<string, { type: string; name: string }> = {};
      for (const [key, val] of Object.entries(schema.properties as Record<string, { type: string; name: string }>)) {
        props[key] = { type: val.type, name: val.name };
      }
      return {
        id: dbId,
        title: extractText(schema.title ?? []),
        properties: props,
      };
    })
  );

  return results
    .filter((r): r is PromiseFulfilledResult<NotionDatabase> => r.status === "fulfilled")
    .map((r) => r.value);
}

// ─── Vocabulary ────────────────────────────────────────────────────────────

export interface VocabCard {
  id: string;
  word: string;
  translation: string;
  language: string;
  example: string;
  tags: string[];
  easeFactor: number;
  interval: number;
  repetitions: number;
  nextReview: string | null;
  lastReview: string | null;
}

export interface VocabLanguageStat {
  language: string;
  total: number;
  due: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function pageToVocabCard(page: any): VocabCard {
  const p = page.properties;
  return {
    id: page.id,
    word:        extractText(p.Word?.title ?? []),
    translation: extractText(p.Translation?.rich_text ?? []),
    language:    p.Language?.select?.name ?? "Other",
    example:     extractText(p.Example?.rich_text ?? []),
    tags:        p.Tags?.multi_select?.map((t: { name: string }) => t.name) ?? [],
    easeFactor:  p.EaseFactor?.number ?? 2.5,
    interval:    p.Interval?.number ?? 0,
    repetitions: p.Repetitions?.number ?? 0,
    nextReview:  p.NextReview?.date?.start ?? null,
    lastReview:  p.LastReview?.date?.start ?? null,
  };
}

async function queryAllVocab(filter?: object): Promise<VocabCard[]> {
  if (!VOCAB_DB) return [];
  const cards: VocabCard[] = [];
  let cursor: string | undefined;
  do {
    const body: Record<string, unknown> = { page_size: 100 };
    if (filter) body.filter = filter;
    if (cursor) body.start_cursor = cursor;
    const data = await notionFetch(`${BASE}/databases/${VOCAB_DB}/query`, {
      method: "POST",
      body: JSON.stringify(body),
    });
    cards.push(...data.results.map(pageToVocabCard));
    cursor = data.has_more ? data.next_cursor : undefined;
  } while (cursor);
  return cards;
}

export async function getDueVocab(language?: string): Promise<VocabCard[]> {
  if (!VOCAB_DB) return [];
  const today = new Date().toISOString().split("T")[0];
  const dateFilter = {
    or: [
      { property: "NextReview", date: { is_empty: true } },
      { property: "NextReview", date: { on_or_before: today } },
    ],
  };
  const filter = language && language !== "all"
    ? { and: [dateFilter, { property: "Language", select: { equals: language } }] }
    : dateFilter;
  return queryAllVocab(filter);
}

export async function getVocabLanguageStats(): Promise<VocabLanguageStat[]> {
  if (!VOCAB_DB) return [];
  const all = await queryAllVocab();
  const today = new Date().toISOString().split("T")[0];
  const map = new Map<string, VocabLanguageStat>();
  for (const card of all) {
    const lang = card.language || "Other";
    if (!map.has(lang)) map.set(lang, { language: lang, total: 0, due: 0 });
    const stat = map.get(lang)!;
    stat.total++;
    if (!card.nextReview || card.nextReview <= today) stat.due++;
  }
  return Array.from(map.values()).sort((a, b) => b.due - a.due);
}

export async function getVocabDueCount(): Promise<number> {
  if (!VOCAB_DB) return 0;
  const cards = await getDueVocab();
  return cards.length;
}

export async function updateVocabSM2(
  pageId: string, easeFactor: number, interval: number,
  repetitions: number, nextReview: string
): Promise<void> {
  await notionFetch(`${BASE}/pages/${pageId}`, {
    method: "PATCH",
    body: JSON.stringify({
      properties: {
        EaseFactor:  { number: easeFactor },
        Interval:    { number: interval },
        Repetitions: { number: repetitions },
        NextReview:  { date: { start: nextReview } },
        LastReview:  { date: { start: new Date().toISOString().split("T")[0] } },
      },
    }),
  });
}

export async function createVocabCard(input: {
  word: string;
  translation: string;
  language: string;
  example?: string;
  tags?: string[];
}): Promise<void> {
  if (!VOCAB_DB) throw new Error("NOTION_VOCAB_DB not configured");
  const properties: Record<string, unknown> = {
    Word:        { title: [{ text: { content: input.word } }] },
    Translation: { rich_text: [{ text: { content: input.translation } }] },
    Language:    { select: { name: input.language } },
  };
  if (input.example) properties.Example = { rich_text: [{ text: { content: input.example } }] };
  if (input.tags?.length) properties.Tags = { multi_select: input.tags.map((n) => ({ name: n })) };
  await notionFetch(`${BASE}/pages`, {
    method: "POST",
    body: JSON.stringify({ parent: { database_id: VOCAB_DB }, properties }),
  });
}
