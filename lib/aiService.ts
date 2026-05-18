import { GoogleGenerativeAI } from "@google/generative-ai";

export type AIGenerationType = "notes" | "summarizer" | "quiz";
export type NotesDetailLevel = "brief" | "standard" | "comprehensive";
export type NotesOutputFormat = "bullets" | "paragraphs";
export type QuizDifficulty = "easy" | "medium" | "hard";
export type QuizQuestionType = "mcq";

export type QuizQuestion = {
  question: string;
  options: string[];
  correctOption: string;
  explanation: string;
};

type GenerateContentParams =
  | {
      type: "notes";
      topic: string;
      detailLevel: NotesDetailLevel;
      additionalContext?: string;
      outputFormat: NotesOutputFormat;
      uploadedText?: string;
    }
  | {
      type: "summarizer";
      pastedText: string;
      uploadedText?: string;
    }
  | {
      type: "quiz";
      topic: string;
      difficulty: QuizDifficulty;
      questionType: QuizQuestionType;
      numberOfQuestions: number;
      uploadedText?: string;
    };

type GeneratedContentResult =
  | { type: "notes" | "summarizer"; text: string }
  | { type: "quiz"; questions: QuizQuestion[]; rawText: string };

const DEFAULT_MODEL_NAME = "gemini-2.5-flash";
const FALLBACK_MODEL_NAMES = ["gemini-2.0-flash", "gemini-2.5-pro", "gemini-2.0-flash-lite"];
const MAX_SOURCE_CHARS = 50000;

function getGenAI() {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }

  return new GoogleGenerativeAI(apiKey);
}

async function generateWithGemini(prompt: string) {
  const genAI = getGenAI();
  const configuredModel = process.env.GEMINI_MODEL?.trim();
  const modelNames = Array.from(
    new Set([configuredModel, DEFAULT_MODEL_NAME, ...FALLBACK_MODEL_NAMES].filter(Boolean))
  ) as string[];
  const errors: string[] = [];

  for (const modelName of modelNames) {
    try {
      return await genAI
        .getGenerativeModel({ model: modelName })
        .generateContent(prompt);
    } catch (error) {
      errors.push(
        `${modelName}: ${error instanceof Error ? error.message : "Unknown Gemini error"}`
      );
    }
  }

  const lastError = errors[errors.length - 1];
  if (lastError) {
    throw new Error(`Gemini generation failed for all configured models. ${lastError}`);
  }

  throw new Error("Gemini generation failed because no model candidates were configured.");
}

function trimSource(value: string) {
  return value.trim().slice(0, MAX_SOURCE_CHARS);
}

function buildPrompt(params: GenerateContentParams) {
  if (params.type === "notes") {
    const sourceText = trimSource(params.uploadedText || "");
    return [
      "You are StudyBuddy AI Studio, a professional education assistant.",
      "Create beautifully formatted Markdown study notes.",
      "Use clear headings, bold key terms, and well-structured lists where appropriate.",
      params.outputFormat === "paragraphs"
        ? "Use paragraph-first prose. Avoid long bullet lists unless a short list improves clarity."
        : "Use concise bullet points with nested structure where helpful.",
      `Detail level: ${params.detailLevel}.`,
      params.topic ? `Topic: ${params.topic}` : "",
      params.additionalContext ? `Additional context: ${params.additionalContext}` : "",
      sourceText ? `Uploaded source text:\n${sourceText}` : "",
      "Return Markdown only.",
    ]
      .filter(Boolean)
      .join("\n\n");
  }

  if (params.type === "summarizer") {
    const sourceText = trimSource(params.uploadedText || params.pastedText);
    return [
      "You are StudyBuddy AI Studio, a professional education assistant.",
      "Summarize the supplied content as beautifully formatted Markdown.",
      "Use headers, bold terms, short lists, and a compact key-takeaways section.",
      "Do not invent facts outside the supplied text.",
      `Source text:\n${sourceText}`,
      "Return Markdown only.",
    ].join("\n\n");
  }

  const sourceText = trimSource(params.uploadedText || "");
  return [
    "You are StudyBuddy AI Studio, a professional quiz generator for teachers.",
    `Create exactly ${params.numberOfQuestions} ${params.difficulty} multiple-choice questions.`,
    params.topic ? `Subject/topic: ${params.topic}` : "",
    sourceText ? `Uploaded source text:\n${sourceText}` : "",
    "Return a raw JSON array only. Do not wrap it in markdown code blocks. Do not include prose before or after the JSON.",
    'Each item must match this schema: {"question":"string","options":["string","string","string","string"],"correctOption":"string","explanation":"string"}.',
    "The correctOption value must exactly match one of the options.",
  ]
    .filter(Boolean)
    .join("\n\n");
}

function stripJsonFences(value: string) {
  return value
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

function parseQuiz(rawText: string, expectedCount: number): QuizQuestion[] {
  const parsed = JSON.parse(stripJsonFences(rawText));

  if (!Array.isArray(parsed)) {
    throw new Error("Gemini returned an invalid quiz format.");
  }

  return parsed.slice(0, expectedCount).map((item, index) => {
    const options = Array.isArray(item?.options)
      ? item.options.map((option: unknown) => String(option || "").trim()).filter(Boolean)
      : [];
    const correctOption = String(item?.correctOption || "").trim();

    if (!String(item?.question || "").trim() || options.length < 2 || !correctOption) {
      throw new Error(`Quiz question ${index + 1} is incomplete.`);
    }

    return {
      question: String(item.question).trim(),
      options,
      correctOption,
      explanation: String(item?.explanation || "").trim(),
    };
  });
}

export async function generateContent(
  params: GenerateContentParams
): Promise<GeneratedContentResult> {
  const prompt = buildPrompt(params);
  const result = await generateWithGemini(prompt);
  const text = result.response.text().trim();

  if (!text) {
    throw new Error("Gemini returned an empty response.");
  }

  if (params.type === "quiz") {
    return {
      type: "quiz",
      questions: parseQuiz(text, params.numberOfQuestions),
      rawText: text,
    };
  }

  return { type: params.type, text };
}
