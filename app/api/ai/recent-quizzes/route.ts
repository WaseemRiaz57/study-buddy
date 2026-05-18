import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";
import { authOptions } from "@/lib/authOptions";
import { connectMongoDB } from "@/lib/mongodb";
import Quiz from "@/models/Quiz";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function normalizeRole(role: unknown) {
  return String(role || "").trim().toLowerCase();
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || !mongoose.Types.ObjectId.isValid(session.user.id)) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const role = normalizeRole(session.user.role);
    if (role !== "teacher" && role !== "mentor") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(Math.max(Number(searchParams.get("limit") || 3), 1), 5);

    await connectMongoDB();

    const quizzes = await Quiz.find({ userId: session.user.id })
      .sort({ createdAt: -1 })
      .limit(limit)
      .select("title subject difficulty questionType questions createdAt")
      .lean();

    return NextResponse.json({
      quizzes: quizzes.map((quiz) => ({
        id: String(quiz._id),
        title: quiz.title || quiz.subject || "Generated Quiz",
        difficulty: quiz.difficulty || "medium",
        questionType: quiz.questionType || "mcq",
        questionCount: Array.isArray(quiz.questions) ? quiz.questions.length : 0,
        createdAt: quiz.createdAt,
      })),
    });
  } catch (error) {
    console.error("Recent quiz generations fetch error:", error);
    return NextResponse.json(
      { message: "Failed to load recent quiz generations." },
      { status: 500 }
    );
  }
}
