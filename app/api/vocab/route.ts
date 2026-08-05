import { NextRequest, NextResponse } from "next/server";
import { getDueVocab } from "@/lib/notion";

export async function GET(req: NextRequest) {
  try {
    const language = req.nextUrl.searchParams.get("language") ?? undefined;
    const cards = await getDueVocab(language);
    return NextResponse.json(cards);
  } catch (err) {
    console.error("[vocab]", err);
    return NextResponse.json({ error: "Failed to fetch vocab" }, { status: 500 });
  }
}
