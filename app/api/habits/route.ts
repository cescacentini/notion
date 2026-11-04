import { NextResponse } from "next/server";
import { createTodayHabits, getTodayHabits } from "@/lib/notion";

export async function GET() {
  try {
    const entry = await getTodayHabits();
    return NextResponse.json(entry);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function POST() {
  try {
    const entry = await createTodayHabits();
    return NextResponse.json(entry);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
