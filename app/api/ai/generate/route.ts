import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";
import { authOptions } from "@/lib/authOptions";
import {
  buildAIContentPrompt,
  generateAIContent,
  parseQuizQuestions,
  type AIGenerationType,
  type GenerateContentParams,
  type NotesDetailLevel,
  type NotesOutputFormat,
  type QuizDifficulty,
  type QuizQuestionType,
} from "@/lib/aiService";
import { connectMongoDB } from "@/lib/mongodb";
import { getUserSubscriptionPlan, todayUsageWindow, upgradeRequiredResponse } from "@/lib/subscriptionAccess";
import { trackProgress } from "@/lib/challengeTracker";
import AIContent from "@/models/AIContent";
import AINote from "@/models/AINote";
import Quiz from "@/models/Quiz";
import UsageCounter from "@/models/UsageCounter";
// @ts-expect-error - pdf-parse-fork ships CommonJS types that do not line up with this Next.js build.
import pdf from "pdf-parse-fork";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024;
const MAX_TEXT_CHARS = 25000;
const VALID_TYPES = new Set<AIGenerationType>(["notes", "summarizer", "quiz"]);
const VALID_QUESTION_TYPES = new Set<QuizQuestionType>(["mcq", "short", "long"]);

type GenerateRequestPayload = {
  type: AIGenerationType;
  topic?: string;
  detailLevel?: NotesDetailLevel;
  additionalContext?: string;
  outputFormat?: NotesOutputFormat;
  pastedText?: string;
  difficulty?: QuizDifficulty;
  questionType?: QuizQuestionType;
  numberOfQuestions?: number;
  uploadedText?: string;
};

function normalizeRole(role: unknown) {
  return String(role || "student").trim().toLowerCase();
}

function isTeacherRole(role: unknown) {
  const normalized = normalizeRole(role);
  return normalized === "teacher" || normalized === "mentor";
}

function titleFromText(value: string, fallback: string) {
  const heading = value.match(/^#\s+(.+)$/m)?.[1]?.trim();
  return (heading || fallback).slice(0, 160);
}

async function extractTextFromFile(file: File) {
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error("File exceeds the 15MB limit.");
  }

  const filename = file.name.toLowerCase();
  const buffer = Buffer.from(await file.arrayBuffer());

  if (
    filename.endsWith(".txt") ||
    filename.endsWith(".md") ||
    filename.endsWith(".markdown") ||
    file.type.startsWith("text/")
  ) {
    return buffer.toString("utf8");
  }

  if (filename.endsWith(".pdf") || file.type === "application/pdf") {
    const parsed = await pdf(buffer);
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

  throw new Error("Unsupported file type. Upload TXT, Markdown, PDF, or DOCX.");
}

async function parsePayload(request: Request): Promise<GenerateRequestPayload> {
  const contentType = request.headers.get("content-type") || "";

  if (!contentType.includes("multipart/form-data")) {
    const body = await request.json().catch(() => ({}));
    return {
      type: String(body?.type || "notes") as AIGenerationType,
      topic: String(body?.topic || "").trim(),
      detailLevel: String(body?.detailLevel || "standard") as NotesDetailLevel,
      additionalContext: String(body?.additionalContext || "").trim(),
      outputFormat: String(body?.outputFormat || "bullets") as NotesOutputFormat,
      pastedText: String(body?.pastedText || "").trim(),
      difficulty: String(body?.difficulty || "medium") as QuizDifficulty,
      questionType: String(body?.questionType || "mcq") as QuizQuestionType,
      numberOfQuestions: Number(body?.numberOfQuestions || 5),
      uploadedText: String(body?.uploadedText || "").trim().slice(0, MAX_TEXT_CHARS),
    };
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const uploadedText =
    file instanceof File ? (await extractTextFromFile(file)).trim() : "";

  return {
    type: String(formData.get("type") || "notes") as AIGenerationType,
    topic: String(formData.get("topic") || "").trim(),
    detailLevel: String(formData.get("detailLevel") || "standard") as NotesDetailLevel,
    additionalContext: String(formData.get("additionalContext") || "").trim(),
    outputFormat: String(formData.get("outputFormat") || "bullets") as NotesOutputFormat,
    pastedText: String(formData.get("pastedText") || "").trim(),
    difficulty: String(formData.get("difficulty") || "medium") as QuizDifficulty,
    questionType: String(formData.get("questionType") || "mcq") as QuizQuestionType,
    numberOfQuestions: Number(formData.get("numberOfQuestions") || 5),
    uploadedText: uploadedText.slice(0, MAX_TEXT_CHARS),
  };
}

function validatePayload(payload: GenerateRequestPayload) {
  if (!VALID_TYPES.has(payload.type)) {
    throw new Error("Invalid generation type.");
  }

  if (payload.type === "notes" && !payload.topic && !payload.uploadedText) {
    throw new Error("Enter a topic or upload source material.");
  }

  if (payload.type === "summarizer" && !payload.pastedText && !payload.uploadedText) {
    throw new Error("Paste text or upload a file to summarize.");
  }

  if (payload.type === "quiz" && !payload.topic && !payload.uploadedText) {
    throw new Error("Enter a quiz topic or upload source material.");
  }

  if (payload.type === "quiz") {
    payload.numberOfQuestions = Math.min(
      20,
      Math.max(1, Math.floor(Number(payload.numberOfQuestions || 5)))
    );
    payload.questionType = VALID_QUESTION_TYPES.has(payload.questionType || "mcq")
      ? payload.questionType
      : "mcq";
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || !mongoose.Types.ObjectId.isValid(session.user.id)) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await connectMongoDB();

    const payload = await parsePayload(request);
    validatePayload(payload);

    if (payload.type === "quiz" && !isTeacherRole(session.user.role)) {
      return NextResponse.json(
        { message: "Quiz Builder is available to teacher accounts only." },
        { status: 403 }
      );
    }

    const plan = await getUserSubscriptionPlan(session.user.id);
    const dailyLimit = plan.limits.aiGenerationsPerDay;

    if (dailyLimit !== null) {
      const usage = await UsageCounter.findOne({
        userId: session.user.id,
        feature: "ai_generation",
        windowStart: todayUsageWindow(),
      })
        .select("count")
        .lean();

      if (Number(usage?.count || 0) >= dailyLimit) {
        return NextResponse.json(
          upgradeRequiredResponse(
            `Your ${plan.name} plan includes ${dailyLimit} AI generations per day. Upgrade to continue generating.`
          ),
          { status: 403 }
        );
      }
    }

    const userObjectId = new mongoose.Types.ObjectId(session.user.id);
    const generationParams: GenerateContentParams =
      payload.type === "notes"
        ? {
            type: "notes",
            topic: payload.topic || "",
            detailLevel: payload.detailLevel || "standard",
            additionalContext: payload.additionalContext || "",
            outputFormat: payload.outputFormat || "bullets",
            uploadedText: payload.uploadedText || "",
          }
        : payload.type === "summarizer"
          ? {
              type: "summarizer",
              pastedText: payload.pastedText || "",
              uploadedText: payload.uploadedText || "",
            }
          : {
              type: "quiz",
              topic: payload.topic || "",
              difficulty: payload.difficulty || "medium",
              questionType: payload.questionType || "mcq",
              numberOfQuestions: payload.numberOfQuestions || 5,
              uploadedText: payload.uploadedText || "",
            };

    let generatedContent: string;

    try {
      generatedContent = await generateAIContent(
        buildAIContentPrompt(generationParams),
        generationParams.type,
        generationParams.type === "quiz" ? generationParams.difficulty : undefined,
        generationParams.type === "notes"
          ? {
              detailLevel: generationParams.detailLevel,
              outputFormat: generationParams.outputFormat,
              additionalContext: generationParams.additionalContext,
              topic: generationParams.topic,
            }
          : generationParams.type === "quiz"
            ? {
                numberOfQuestions: generationParams.numberOfQuestions,
                questionType: generationParams.questionType,
                topic: generationParams.topic,
              }
            : {}
      );
    } catch (error) {
      console.error("Groq AI generation error:", error);
      throw error;
    }

    await UsageCounter.findOneAndUpdate(
      {
        userId: userObjectId,
        feature: "ai_generation",
        windowStart: todayUsageWindow(),
      },
      { $inc: { count: 1 } },
      { upsert: true, setDefaultsOnInsert: true }
    );

    if (generationParams.type === "quiz") {
      const questions = parseQuizQuestions(
        generatedContent,
        generationParams.numberOfQuestions
      );
      const subject = payload.topic || "Generated Quiz";
      const quiz = await Quiz.create({
        userId: userObjectId,
        title: subject,
        subject,
        difficulty: generationParams.difficulty,
        questionType: generationParams.questionType,
        questions,
      });

      await AINote.create({
        userId: session.user.email || session.user.id,
        title: subject,
        content: JSON.stringify(questions, null, 2),
        type: "quiz",
      });

      await trackProgress(session.user.id, "ai_generations", 1);

      return NextResponse.json({
        type: "quiz",
        quizId: String(quiz._id),
        questions,
      });
    }

    const prompt =
      payload.type === "notes"
        ? payload.topic || payload.uploadedText || "Uploaded source material"
        : payload.pastedText || payload.uploadedText || "Uploaded source material";
    const savedContent = await AIContent.create({
      userId: userObjectId,
      prompt: String(prompt).slice(0, 12000),
      generatedText: generatedContent,
      type: generationParams.type,
    });

    await AINote.create({
      userId: session.user.email || session.user.id,
      title: titleFromText(
        generatedContent,
        payload.type === "notes" ? payload.topic || "Generated Notes" : "Generated Summary"
      ),
      content: generatedContent,
      type: payload.type,
    });

    await trackProgress(session.user.id, "ai_generations", 1);

    return NextResponse.json({
      type: generationParams.type,
      contentId: String(savedContent._id),
      text: generatedContent,
    });
  } catch (error) {
    console.error("AI generation route error:", error);
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Failed to generate AI content.",
      },
      { status: 500 }
    );
  }
}
