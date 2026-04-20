import { NextRequest, NextResponse } from "next/server";
import { getProjectTasks } from "@/lib/notion";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tasks = await getProjectTasks(id);
    return NextResponse.json(tasks);
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
