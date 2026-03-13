import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectMongoDB } from "@/lib/mongodb";
import StudySession from "@/models/StudySession";
import User from "@/models/User";

// PATCH /api/study-buddy/mode — set chat/video mode and activate the session
export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { sessionId, mode } = await req.json();

    if (!sessionId || !["chat", "video"].includes(mode)) {
      return NextResponse.json(
        { message: "sessionId and mode ('chat' | 'video') are required." },
        { status: 400 }
      );
    }

    await connectMongoDB();

    const currentUser = await User.findOne({ email: session.user.email });
    if (!currentUser) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const studySession = await StudySession.findById(sessionId);
    if (!studySession) {
      return NextResponse.json(
        { message: "Session not found" },
        { status: 404 }
      );
    }

    const isParticipant =
      studySession.requesterId.toString() === currentUser._id.toString() ||
      studySession.receiverId.toString() === currentUser._id.toString();

    if (!isParticipant) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    studySession.selectedMode = mode;
    studySession.status = "active";
    await studySession.save();

    return NextResponse.json({
      message: `Mode set to ${mode}`,
      sessionId: studySession._id.toString(),
      mode,
    });
  } catch (error) {
    console.error("Mode Update Error:", error);
    return NextResponse.json(
      { message: "Failed to update mode." },
      { status: 500 }
    );
  }
}
