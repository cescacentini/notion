import { NextRequest, NextResponse } from "next/server";
import { appendJournalBlock } from "@/lib/notion";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { text } = await req.json();
    if (!text?.trim()) {
      return NextResponse.json({ error: "text required" }, { status: 400 });
    }
    await appendJournalBlock(id, text.trim());
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[journal/append]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
