import Groq from "groq-sdk";

export type AIGenerationType = "notes" | "summarizer" | "quiz";
export type NotesDetailLevel = "brief" | "standard" | "comprehensive";
export type NotesOutputFormat = "bullets" | "paragraphs";
export type QuizDifficulty = "easy" | "medium" | "hard";
export type QuizQuestionType = "mcq" | "short" | "long";

export type QuizQuestion = {
  question: string;
  options?: string[];
  correctOption?: string;
  suggestedAnswer?: string;
  explanation: string;
};

export type GenerateContentParams =
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

export type GeneratedContentResult =
  | { type: "notes" | "summarizer"; text: string }
  | { type: "quiz"; questions: QuizQuestion[]; rawText: string };

type GenerateAIContentOptions = {
  detailLevel?: NotesDetailLevel;
  outputFormat?: NotesOutputFormat;
  additionalContext?: string;
  numberOfQuestions?: number;
  questionType?: QuizQuestionType;
  topic?: string;
};

const GROQ_MODEL = "llama-3.3-70b-versatile";
const MAX_SOURCE_CHARS = 25000;

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

function trimSource(value: string) {
  return value.trim().slice(0, MAX_SOURCE_CHARS);
}

function assertGroqConfigured() {
  if (!process.env.GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY is not configured.");
  }
}

function buildNotesSystemPrompt() {
  return [
    "You are StudyBuddy AI Studio, an expert academic tutor and curriculum designer.",
    "Return highly structured, SEO/AEO optimized Markdown only.",
    "Use clear heading hierarchy, concise bullet points, bold emphasis for key terms, and practical examples where useful.",
    "Do not include markdown code fences unless the user explicitly asks for code.",
  ].join(" ");
}

function getQuestionTypeInstruction(questionType: QuizQuestionType) {
  if (questionType === "short") {
    return {
      label: "short-answer questions",
      schema:
        '{"questions":[{"question":"...","suggestedAnswer":"...","explanation":"..."}]}',
      instruction:
        "Do not include options or correctOption. Each suggestedAnswer must be concise and suitable for quick grading.",
    };
  }

  if (questionType === "long") {
    return {
      label: "long-form subjective questions",
      schema:
        '{"questions":[{"question":"...","suggestedAnswer":"...","explanation":"..."}]}',
      instruction:
        "Do not include options or correctOption. Each suggestedAnswer must be a structured model answer with the key points expected in a strong response.",
    };
  }

  return {
    label: "multiple-choice questions",
    schema:
      '{"questions":[{"question":"...","options":["...","...","...","..."],"correctOption":"...","explanation":"..."}]}',
    instruction: "Each correctOption must exactly match one value from options.",
  };
}

function buildQuizSystemPrompt(expectedCount: number, questionType: QuizQuestionType) {
  const typeInstruction = getQuestionTypeInstruction(questionType);

  return [
    "You are StudyBuddy AI Studio, an expert quiz generator for mentors.",
    "Return only a valid JSON object with this exact shape:",
    typeInstruction.schema,
    `The questions array must contain exactly ${expectedCount} items.`,
    `Generate ${typeInstruction.label}.`,
    typeInstruction.instruction,
    "Do not include markdown fences, prose, comments, or any extra keys.",
  ].join(" ");
}

function buildContentFromParams(params: GenerateContentParams) {
  if (params.type === "notes") {
    return [
      params.topic ? `Topic: ${params.topic}` : "",
      `Detail level: ${params.detailLevel}.`,
      `Output format: ${params.outputFormat}.`,
      params.additionalContext ? `Additional context: ${params.additionalContext}` : "",
      params.uploadedText ? `Source material:\n${trimSource(params.uploadedText)}` : "",
    ]
      .filter(Boolean)
      .join("\n\n");
  }

  if (params.type === "summarizer") {
    return [
      "Summarize this source material.",
      `Source material:\n${trimSource(params.uploadedText || params.pastedText)}`,
    ].join("\n\n");
  }

  return [
    params.topic ? `Topic: ${params.topic}` : "",
    `Difficulty: ${params.difficulty}.`,
    `Question type: ${params.questionType}.`,
    `Number of questions: ${params.numberOfQuestions}.`,
    params.uploadedText ? `Source material:\n${trimSource(params.uploadedText)}` : "",
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

export function parseQuizQuestions(rawText: string, expectedCount?: number): QuizQuestion[] {
  const parsed = JSON.parse(stripJsonFences(rawText));
  const questions = Array.isArray(parsed) ? parsed : parsed?.questions;

  if (!Array.isArray(questions)) {
    throw new Error("Groq returned an invalid quiz format.");
  }

  return questions.slice(0, expectedCount).map((item, index) => {
    const options = Array.isArray(item?.options)
      ? item.options.map((option: unknown) => String(option || "").trim()).filter(Boolean)
      : [];
    const correctOption = String(item?.correctOption || "").trim();
    const suggestedAnswer = String(item?.suggestedAnswer || "").trim();

    if (!String(item?.question || "").trim()) {
      throw new Error(`Quiz question ${index + 1} is incomplete.`);
    }

    if (options.length > 0 && (!correctOption || !options.includes(correctOption))) {
      throw new Error(`Quiz question ${index + 1} has a correctOption that is not in options.`);
    }

    if (options.length === 0 && !suggestedAnswer) {
      throw new Error(`Quiz question ${index + 1} is missing a suggested answer.`);
    }

    return {
      question: String(item.question).trim(),
      ...(options.length > 0 ? { options, correctOption } : { suggestedAnswer }),
      explanation: String(item?.explanation || "").trim(),
    };
  });
}

export async function generateAIContent(
  content: string,
  type: AIGenerationType,
  difficulty?: QuizDifficulty,
  options: GenerateAIContentOptions = {}
) {
  assertGroqConfigured();

  const isQuiz = type === "quiz";
  const questionType = options.questionType || "mcq";
  const numberOfQuestions = Math.min(
    20,
    Math.max(1, Math.floor(Number(options.numberOfQuestions || 5)))
  );

  const systemPrompt = isQuiz
    ? buildQuizSystemPrompt(numberOfQuestions, questionType)
    : buildNotesSystemPrompt();
  const userPrompt = isQuiz
    ? [
        content,
        difficulty ? `Difficulty: ${difficulty}.` : "",
        `Generate exactly ${numberOfQuestions} ${getQuestionTypeInstruction(questionType).label}.`,
      ]
        .filter(Boolean)
        .join("\n\n")
    : content;

  const completion = await groq.chat.completions.create({
    model: GROQ_MODEL,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: isQuiz ? 0.2 : 0.4,
    response_format: isQuiz ? { type: "json_object" } : undefined,
  });

  const output = completion.choices[0]?.message?.content?.trim();

  if (!output) {
    throw new Error("Groq returned an empty response.");
  }

  if (isQuiz) {
    return JSON.stringify({ questions: parseQuizQuestions(output, numberOfQuestions) });
  }

  return output;
}

export async function generateContent(
  params: GenerateContentParams
): Promise<GeneratedContentResult> {
  const rawContent = await generateAIContent(
    buildContentFromParams(params),
    params.type,
    params.type === "quiz" ? params.difficulty : undefined,
    params.type === "notes"
      ? {
          detailLevel: params.detailLevel,
          outputFormat: params.outputFormat,
          additionalContext: params.additionalContext,
          topic: params.topic,
        }
      : params.type === "quiz"
        ? {
            numberOfQuestions: params.numberOfQuestions,
            questionType: params.questionType,
            topic: params.topic,
          }
        : {}
  );

  if (params.type === "quiz") {
    return {
      type: "quiz",
      questions: parseQuizQuestions(rawContent, params.numberOfQuestions),
      rawText: rawContent,
    };
  }

  return { type: params.type, text: rawContent };
}

export function buildAIContentPrompt(params: GenerateContentParams) {
  return buildContentFromParams(params);
}
