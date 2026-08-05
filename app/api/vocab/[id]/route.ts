import { NextRequest, NextResponse } from "next/server";
import { updateVocabSM2 } from "@/lib/notion";
import { sm2 } from "@/lib/sm2";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { rating, easeFactor, interval, repetitions } = await req.json();
    const result = sm2(rating, easeFactor, interval, repetitions);
    await updateVocabSM2(id, result.easeFactor, result.interval, result.repetitions, result.nextReview);
    return NextResponse.json(result);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to update vocab card" }, { status: 500 });
  }
}
