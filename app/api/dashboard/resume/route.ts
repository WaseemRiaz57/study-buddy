import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";
import { authOptions } from "@/lib/authOptions";
import { connectMongoDB } from "@/lib/mongodb";
import AIContent from "@/models/AIContent";
import StudyRoom from "@/models/StudyRoom";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || !mongoose.Types.ObjectId.isValid(session.user.id)) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await connectMongoDB();

    const userObjectId = new mongoose.Types.ObjectId(session.user.id);
    const [latestContent, latestStudyRoom] = await Promise.all([
      AIContent.findOne({ userId: session.user.id })
        .sort({ createdAt: -1 })
        .select("prompt type createdAt")
        .lean(),
      StudyRoom.findOne({
        $or: [{ createdBy: userObjectId }, { participants: userObjectId }],
        status: "active",
      })
        .sort({ updatedAt: -1 })
        .select("roomId title updatedAt createdAt")
        .lean(),
    ]);

    if (!latestContent && !latestStudyRoom) {
      return NextResponse.json({ resume: null });
    }

    const contentDate = latestContent?.createdAt
      ? new Date(latestContent.createdAt).getTime()
      : 0;
    const roomDate = latestStudyRoom?.updatedAt
      ? new Date(latestStudyRoom.updatedAt).getTime()
      : 0;

    if (latestStudyRoom && roomDate > contentDate) {
      return NextResponse.json({
        resume: {
          id: String(latestStudyRoom._id),
          title: latestStudyRoom.title || "Latest study room",
          type: "study-room",
          href: `/dashboard/study-rooms/${latestStudyRoom.roomId}`,
          createdAt: latestStudyRoom.updatedAt || latestStudyRoom.createdAt,
        },
      });
    }

    return NextResponse.json({
      resume: {
        id: String(latestContent._id),
        title: String(latestContent.prompt || "Latest AI note").slice(0, 120),
        type: latestContent.type,
        href: `/dashboard/notes/${latestContent._id}`,
        createdAt: latestContent.createdAt,
      },
    });
  } catch (error) {
    console.error("Dashboard resume fetch error:", error);
    return NextResponse.json(
      { message: "Failed to load resume item." },
      { status: 500 }
    );
  }
}
