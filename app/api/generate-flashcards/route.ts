import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getResourceById, createFlashcard } from "@/lib/notion";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function buildPrompt(r: { title: string; source: string | null; topics: string[] }): string {
  const lines = [`Resource: "${r.title}"`];
  if (r.source) lines.push(`Source type: ${r.source}`);
  if (r.topics.length) lines.push(`Topics: ${r.topics.join(", ")}`);

  return `You are a spaced-repetition flashcard expert. Generate exactly 10 flashcards for the following learning resource.

${lines.join("\n")}

Rules:
- Each card tests one atomic concept (one fact, one definition, one mechanism)
- Questions are specific and unambiguous
- Answers are concise (1–3 sentences max)
- Vary question styles: definition, "what is", "how does", "why", fill-in-the-blank
- Do not repeat facts across cards

Respond ONLY with a valid JSON array (no markdown fences, no explanation):
[{"question": "...", "answer": "..."}, ...]`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { resourceId } = body;

    if (!resourceId || typeof resourceId !== "string") {
      return NextResponse.json({ error: "resourceId required" }, { status: 400 });
    }

    const resource = await getResourceById(resourceId);

    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2048,
      messages: [{ role: "user", content: buildPrompt(resource) }],
    });

    const raw = message.content[0].type === "text" ? message.content[0].text : "";

    // Strip markdown code fences if present
    const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();

    let cards: { question: string; answer: string }[];
    try {
      cards = JSON.parse(cleaned);
    } catch {
      return NextResponse.json({ error: "AI returned invalid JSON", raw }, { status: 502 });
    }

    if (!Array.isArray(cards) || cards.length === 0) {
      return NextResponse.json({ error: "AI returned empty response" }, { status: 502 });
    }

    // Sequential creation to stay within Notion rate limits
    let created = 0;
    for (const card of cards) {
      if (!card.question?.trim() || !card.answer?.trim()) continue;
      await createFlashcard({
        question: card.question.trim(),
        answer: card.answer.trim(),
        resourceId,
      });
      created++;
    }

    return NextResponse.json({ created, resourceId, resourceName: resource.title });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[generate-flashcards]", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
