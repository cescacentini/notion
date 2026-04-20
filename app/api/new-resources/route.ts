import { NextResponse } from "next/server";
import { getResourcesWithNoCards } from "@/lib/notion";

export async function GET() {
  try {
    const resources = await getResourcesWithNoCards();
    return NextResponse.json(resources);
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
