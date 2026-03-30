import { NextResponse } from "next/server";
import { getTodayTasks } from "@/lib/notion";

export async function GET() {
  try {
    const tasks = await getTodayTasks();
    return NextResponse.json(tasks);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
