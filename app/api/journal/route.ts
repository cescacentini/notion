import { NextResponse } from "next/server";
import { getTodayJournalPage, getPageTextBlocks } from "@/lib/notion";

export async function GET() {
  try {
    const page = await getTodayJournalPage();
    if (!page) return NextResponse.json({ entry: null });
    const blocks = await getPageTextBlocks(page.id);
    return NextResponse.json({ entry: { id: page.id, date: page.date, blocks } });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
