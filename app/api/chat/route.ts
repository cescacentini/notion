import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are a helpful tutor. Answer questions about the user's learning material. 
Be concise and clear. Use examples when helpful.`;

export async function POST(req: NextRequest) {
  try {
    const { message, topic, cardQuestion, cardAnswer } = await req.json();

    if (!message?.trim()) {
      return NextResponse.json({ error: "Message required" }, { status: 400 });
    }

    let contextPrompt = topic
      ? `The user is studying "${topic}".`
      : "The user is reviewing flashcards.";
    if (cardQuestion) {
      contextPrompt += ` The current card asks: "${cardQuestion}"`;
      if (cardAnswer) contextPrompt += ` The answer is: "${cardAnswer}"`;
      contextPrompt += `. Help the user understand this concept.`;
    } else {
      contextPrompt += ` Answer their question helpfully.`;
    }

    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 512,
      system: `${SYSTEM_PROMPT}\n\n${contextPrompt}`,
      messages: [{ role: "user", content: message }],
    });

    const answer = response.content[0].type === "text" 
      ? response.content[0].text 
      : "No answer";

    return NextResponse.json({ answer });
  } catch (err) {
    console.error("[chat]", err);
    return NextResponse.json({ error: "AI error" }, { status: 500 });
  }
}