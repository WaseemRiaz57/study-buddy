import { NextResponse } from "next/server";

const OLLAMA_URL = "http://143.244.133.231:11434/api/generate";

export const runtime = "nodejs";

type OutputMode = "bullets" | "paragraphs" | "mcq" | "direct" | "unknown";

type IncomingPayload = {
  userPrompt: string;
  extractedFileText: string;
  outputMode: OutputMode;
};

async function extractTextFromFile(file: File): Promise<string> {
  const filename = file.name.toLowerCase();
  const buffer = Buffer.from(await file.arrayBuffer());

  if (filename.endsWith(".txt") || file.type === "text/plain") {
    return buffer.toString("utf-8");
  }

  if (filename.endsWith(".pdf") || file.type === "application/pdf") {
    const pdfParse = (await import("pdf-parse")).default;
    const parsed = await pdfParse(buffer);
    return parsed.text || "";
  }

  if (
    filename.endsWith(".docx") ||
    file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    const mammoth = await import("mammoth");
    const parsed = await mammoth.extractRawText({ buffer });
    return parsed.value || "";
  }

  throw new Error("Unsupported file type");
}

async function parseIncomingRequest(req: Request): Promise<IncomingPayload> {
  const contentType = req.headers.get("content-type") || "";

  if (contentType.includes("multipart/form-data")) {
    const formData = await req.formData();
    const userPrompt = String(formData.get("userPrompt") || "").trim();
    const rawOutputMode = String(formData.get("outputMode") || "").trim().toLowerCase();
    const outputMode: OutputMode =
      rawOutputMode === "bullets" ||
      rawOutputMode === "paragraphs" ||
      rawOutputMode === "mcq" ||
      rawOutputMode === "direct"
        ? rawOutputMode
        : "unknown";
    const fileEntry = formData.get("file");

    if (!(fileEntry instanceof File)) {
      return { userPrompt, extractedFileText: "", outputMode };
    }

    try {
      const text = (await extractTextFromFile(fileEntry)).trim();
      return { userPrompt, extractedFileText: text, outputMode };
    } catch (err) {
      console.error("File extraction failed:", err);
      return { userPrompt, extractedFileText: "", outputMode };
    }
  }

  const body = await req.json();
  const userPrompt = String(body?.userPrompt || "").trim();
  const rawOutputMode = String(body?.outputMode || "").trim().toLowerCase();
  const outputMode: OutputMode =
    rawOutputMode === "bullets" ||
    rawOutputMode === "paragraphs" ||
    rawOutputMode === "mcq" ||
    rawOutputMode === "direct"
      ? rawOutputMode
      : "unknown";
  return { userPrompt, extractedFileText: "", outputMode };
}

function buildSystemPrompt(outputMode: OutputMode, hasFileText: boolean): string {
  const baseRules = [
    "You are an educational content assistant.",
    "Follow the user instructions exactly.",
  ];

  if (hasFileText) {
    baseRules.push(
      "If uploaded file text is provided, treat it as the primary source of information for notes, summaries, and quizzes.",
      "Use the file text first and only supplement with user context when needed."
    );
  }

  if (outputMode === "paragraphs") {
    baseRules.push("DO NOT use bullet points or numbered lists. Write only in continuous prose paragraphs.");
  }

  if (outputMode === "mcq") {
    baseRules.push("Generate questions with 4 options (A, B, C, D) and indicate the correct answer.");
  }

  if (outputMode === "direct") {
    baseRules.push("Provide only questions without options.");
  }

  return baseRules.join("\n");
}

export async function POST(req: Request) {
  try {
    const { userPrompt, extractedFileText, outputMode } = await parseIncomingRequest(req);

    if (!userPrompt || typeof userPrompt !== "string") {
      return NextResponse.json({ message: "userPrompt is required" }, { status: 400 });
    }

    const hasFileText = extractedFileText.length > 0;
    const systemPrompt = buildSystemPrompt(outputMode, hasFileText);

    const formattedPrompt = hasFileText
      ? [
          "Uploaded file text (primary source):",
          extractedFileText,
          "",
          "User instructions:",
          userPrompt,
        ].join("\n")
      : userPrompt;

    const ollamaResponse = await fetch(OLLAMA_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama3.2",
        system: systemPrompt,
        prompt: formattedPrompt,
        stream: true,
      }),
    });

    if (!ollamaResponse.ok) {
      const details = await ollamaResponse.text();
      return NextResponse.json(
        { message: "Failed to generate content", details },
        { status: ollamaResponse.status }
      );
    }

    if (!ollamaResponse.body) {
      return NextResponse.json({ message: "No stream returned by AI server" }, { status: 502 });
    }

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    const reader = ollamaResponse.body.getReader();

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        let buffer = "";

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() ?? "";

            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed) continue;

              try {
                const parsed = JSON.parse(trimmed) as { response?: string; done?: boolean };
                if (parsed.response) {
                  controller.enqueue(encoder.encode(parsed.response));
                }
                if (parsed.done) {
                  controller.close();
                  return;
                }
              } catch {
                continue;
              }
            }
          }

          if (buffer.trim()) {
            try {
              const parsed = JSON.parse(buffer.trim()) as { response?: string };
              if (parsed.response) {
                controller.enqueue(encoder.encode(parsed.response));
              }
            } catch {
            }
          }

          controller.close();
        } catch {
          controller.error(new Error("Stream processing failed"));
        } finally {
          reader.releaseLock();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
      },
    });
  } catch {
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}