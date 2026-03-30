import { NextResponse } from "next/server";
import { getInProgressResources } from "@/lib/notion";

export async function GET() {
  try {
    const resources = await getInProgressResources();
    return NextResponse.json(resources);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
