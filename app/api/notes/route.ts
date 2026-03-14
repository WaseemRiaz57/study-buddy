import { NextResponse } from "next/server";

const OLLAMA_ENDPOINT = "http://143.244.133.231:11434/api/generate";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const userPrompt = body?.prompt;

    if (!userPrompt || typeof userPrompt !== "string") {
      return NextResponse.json({ message: "Prompt is required" }, { status: 400 });
    }

    const ollamaResponse = await fetch(OLLAMA_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama3.2",
        prompt: userPrompt,
        stream: false,
      }),
    });

    if (!ollamaResponse.ok) {
      const errorText = await ollamaResponse.text();
      return NextResponse.json(
        { message: "Failed to get response from AI server", details: errorText },
        { status: ollamaResponse.status }
      );
    }

    const data = await ollamaResponse.json();

    return NextResponse.json({ response: data?.response ?? "", data });
  } catch {
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}