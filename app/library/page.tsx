import { getDueCount, getInProgressResources, getAllCards, getDeckStats, getRecentlyReviewed } from "@/lib/notion";
import LibraryClient from "@/components/LibraryClient";

export const dynamic = "force-dynamic";

function utcAddDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().split("T")[0];
}

function computeStats(allCards: Awaited<ReturnType<typeof getAllCards>>) {
  const today = new Date().toISOString().split("T")[0];
  const totalDue = allCards.filter((c) => !c.nextReview || c.nextReview <= today).length;
  const totalReviewed = allCards.filter((c) => c.lastReview).length;
  const heatmap: Record<string, number> = {};
  for (const card of allCards) {
    if (card.lastReview) heatmap[card.lastReview] = (heatmap[card.lastReview] || 0) + 1;
  }
  let streak = 0;
  const reviewDays = new Set(Object.keys(heatmap));
  const startOffset = reviewDays.has(today) ? 0 : 1;
  for (let i = startOffset; i < 366; i++) {
    if (reviewDays.has(utcAddDays(today, -i))) streak++;
    else break;
  }
  return { totalDue, totalReviewed, heatmap, streak };
}

export default async function LibraryPage() {
  const [dueCount, resources, allCards, decks, recentCards] = await Promise.all([
    getDueCount(),
    getInProgressResources(),
    getAllCards(),
    getDeckStats(),
    getRecentlyReviewed(8),
  ]);
  const stats = computeStats(allCards);

  return (
    <LibraryClient
      dueCount={dueCount}
      resources={resources}
      recentCards={recentCards}
      decks={decks}
      stats={{ streak: stats.streak, totalReviewed: stats.totalReviewed }}
    />
  );
}