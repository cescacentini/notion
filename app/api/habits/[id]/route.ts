import { NextRequest, NextResponse } from "next/server";
import { toggleHabit } from "@/lib/notion";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { habitKey, checked } = await req.json();
    await toggleHabit(id, habitKey, checked);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
