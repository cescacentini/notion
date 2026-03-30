import { NextResponse } from "next/server";
import { getTodaySocialPosts } from "@/lib/notion";

export async function GET() {
  try {
    const posts = await getTodaySocialPosts();
    return NextResponse.json(posts);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch social posts" }, { status: 500 });
  }
}
