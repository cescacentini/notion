import VocabSession from "@/components/VocabSession";

export default async function StudyVocabPage({
  searchParams,
}: {
  searchParams: Promise<{ language?: string; name?: string }>;
}) {
  const { language, name } = await searchParams;
  return <VocabSession language={language} label={name} />;
}
