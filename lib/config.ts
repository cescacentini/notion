export const OPTIONAL_SECTIONS = [
  "resources",
  "habits",
  "tasks",
  "projects",
  "social",
] as const;

export type OptionalSection = (typeof OPTIONAL_SECTIONS)[number];
export type SectionId = "flashcards" | OptionalSection;

const SECTION_ENV: Record<OptionalSection, string | undefined> = {
  resources: process.env.NOTION_RESOURCES_DB,
  habits:    process.env.NOTION_HABITS_DB,
  tasks:     process.env.NOTION_TASKS_DB,
  projects:  process.env.NOTION_PROJECTS_DB,
  social:    process.env.NOTION_SOCIAL_DB,
};

export function isConfigured(): boolean {
  return !!(process.env.NOTION_API_KEY && process.env.NOTION_DATABASE_ID);
}

export function isSectionAvailable(section: OptionalSection): boolean {
  return !!SECTION_ENV[section];
}

export function getAvailableSections(): SectionId[] {
  const sections: SectionId[] = ["flashcards"];
  for (const s of OPTIONAL_SECTIONS) {
    if (SECTION_ENV[s]) sections.push(s);
  }
  return sections;
}
