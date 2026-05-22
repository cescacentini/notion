import StudySession from "@/components/StudySession";

export default async function StudyPage({
  searchParams,
}: {
  searchParams: Promise<{ resource?: string; name?: string; tag?: string }>;
}) {
  const { resource, name, tag } = await searchParams;
  return <StudySession resource={resource} deckLabel={name ?? tag} tag={tag} />;
}
