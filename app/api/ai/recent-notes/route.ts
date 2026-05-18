import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";
import { authOptions } from "@/lib/authOptions";
import { connectMongoDB } from "@/lib/mongodb";
import AIContent from "@/models/AIContent";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || !mongoose.Types.ObjectId.isValid(session.user.id)) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(Math.max(Number(searchParams.get("limit") || 2), 1), 5);

    await connectMongoDB();

    const notes = await AIContent.find({
      userId: session.user.id,
      type: { $in: ["notes", "summarizer"] },
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .select("prompt generatedText type createdAt")
      .lean();

    return NextResponse.json({
      notes: notes.map((note) => ({
        id: String(note._id),
        title: String(note.prompt || "Generated AI Note").slice(0, 80),
        type: note.type,
        snippet: String(note.generatedText || "").replace(/\s+/g, " ").slice(0, 180),
        createdAt: note.createdAt,
      })),
    });
  } catch (error) {
    console.error("Recent AI notes fetch error:", error);
    return NextResponse.json(
      { message: "Failed to load recent AI notes." },
      { status: 500 }
    );
  }
}
