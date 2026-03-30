import { NextRequest, NextResponse } from "next/server";
import { getDueCards } from "@/lib/notion";

export async function GET(req: NextRequest) {
  try {
    const resource = req.nextUrl.searchParams.get("resource") ?? undefined;
    const cards = await getDueCards(resource);
    return NextResponse.json(cards);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch cards" }, { status: 500 });
  }
}
