import { NextRequest, NextResponse } from "next/server";
import { getDeckStats, createDeck } from "@/lib/notion";

export async function GET() {
  try {
    const stats = await getDeckStats();
    return NextResponse.json(stats);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch decks" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { name } = await req.json();
    if (!name?.trim()) {
      return NextResponse.json({ error: "Name required" }, { status: 400 });
    }
    await createDeck(name.trim());
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to create deck" }, { status: 500 });
  }
}
