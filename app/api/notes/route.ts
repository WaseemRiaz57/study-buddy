import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

const OLLAMA_ENDPOINT = process.env.OLLAMA_GENERATE_URL || "http://143.244.133.231:11434/api/generate";
const MAX_PROMPT_CHARS = 8000;

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const userPrompt = String(body?.prompt || "").trim();

    if (!userPrompt) {
      return NextResponse.json({ message: "Prompt is required" }, { status: 400 });
    }

    if (userPrompt.length > MAX_PROMPT_CHARS) {
      return NextResponse.json(
        { message: `Prompt must be ${MAX_PROMPT_CHARS} characters or fewer.` },
        { status: 400 }
      );
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
      return NextResponse.json(
        { message: "Failed to get response from AI server" },
        { status: ollamaResponse.status }
      );
    }

    const data = await ollamaResponse.json();

    return NextResponse.json({ response: data?.response ?? "", data });
  } catch {
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}


