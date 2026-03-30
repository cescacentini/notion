import { NextResponse } from "next/server";
import { getTodayHabits } from "@/lib/notion";

export async function GET() {
  try {
    const entry = await getTodayHabits();
    return NextResponse.json(entry);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
