import StudySession from "@/components/StudySession";

export default async function StudyPage({
  searchParams,
}: {
  searchParams: Promise<{ resource?: string; name?: string }>;
}) {
  const { resource, name } = await searchParams;
  return <StudySession resource={resource} deckLabel={name} />;
}
