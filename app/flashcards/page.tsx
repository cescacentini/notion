import { getDeckStats, getTagStats, getAllCards } from "@/lib/notion";
import Dashboard from "@/components/Dashboard";

export const dynamic = "force-dynamic";

function utcAddDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().split("T")[0];
}

function computeStats(allCards: Awaited<ReturnType<typeof getAllCards>>) {
  const today = new Date().toISOString().split("T")[0];

  const totalDue = allCards.filter(
    (c) => !c.nextReview || c.nextReview <= today
  ).length;

  const heatmap: Record<string, number> = {};
  for (const card of allCards) {
    if (card.lastReview) {
      heatmap[card.lastReview] = (heatmap[card.lastReview] || 0) + 1;
    }
  }

  const reviewDays = new Set(Object.keys(heatmap));
  let streak = 0;
  const startOffset = reviewDays.has(today) ? 0 : 1;
  for (let i = startOffset; i < 366; i++) {
    const key = utcAddDays(today, -i);
    if (reviewDays.has(key)) streak++;
    else break;
  }

  const totalReviewed = allCards.filter((c) => c.lastReview).length;

  const forecast: { date: string; label: string; count: number }[] = [];
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  for (let i = 0; i < 7; i++) {
    const key = utcAddDays(today, i);
    const dow = new Date(key + "T12:00:00Z").getUTCDay();
    const count = allCards.filter((c) => {
      if (!c.nextReview) return i === 0;
      return i === 0 ? c.nextReview <= key : c.nextReview === key;
    }).length;
    forecast.push({ date: key, label: i === 0 ? "Today" : i === 1 ? "Tmrw" : dayNames[dow], count });
  }

  return { totalDue, heatmap, streak, totalReviewed, forecast };
}

export default async function FlashcardsPage() {
  const [decks, tagStats, allCards] = await Promise.all([getDeckStats(), getTagStats(), getAllCards()]);
  const stats = computeStats(allCards);
  return <Dashboard decks={decks} tagStats={tagStats} allCards={allCards} {...stats} />;
}
