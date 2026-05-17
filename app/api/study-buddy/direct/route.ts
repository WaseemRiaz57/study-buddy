import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectMongoDB } from "@/lib/mongodb";
import StudyProfile from "@/models/StudyProfile";
import StudySession from "@/models/StudySession";
import User from "@/models/User";

// POST /api/study-buddy/direct — create a session with a specific user
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { targetUserId } = await req.json();
    const normalizedTargetUserId = String(targetUserId || "").trim().toLowerCase();

    if (!normalizedTargetUserId) {
      return NextResponse.json(
        { message: "targetUserId is required" },
        { status: 400 }
      );
    }

    await connectMongoDB();

    const currentUser = await User.findOne({ email: session.user.email });
    if (!currentUser) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // targetUserId is an email — resolve to User _id
    const targetUser = await User.findOne({ email: normalizedTargetUserId });
    if (!targetUser) {
      return NextResponse.json(
        { message: "Target user not found" },
        { status: 404 }
      );
    }

    if (currentUser._id.toString() === targetUser._id.toString()) {
      return NextResponse.json(
        { message: "Cannot create a session with yourself" },
        { status: 400 }
      );
    }

    if (targetUser.role !== "student") {
      return NextResponse.json(
        { message: "Target user is not available for study buddy sessions." },
        { status: 400 }
      );
    }

    const targetProfile = await StudyProfile.findOne({ userId: normalizedTargetUserId });

    const newSession = await StudySession.create({
      requesterId: currentUser._id,
      receiverId: targetUser._id,
      subject: targetProfile?.currentSubject || "",
      topic: targetProfile?.currentTopic || "",
      status: "pending",
    });

    return NextResponse.json({
      status: "connected",
      sessionId: newSession._id.toString(),
      peer: {
        name: targetProfile?.name || targetUser.name,
        image: targetProfile?.image || targetUser.image || "",
        tags: targetProfile?.tags || [],
        userId: normalizedTargetUserId,
      },
    });
  } catch (error) {
    console.error("Error in direct connect:", error);
    return NextResponse.json(
      { message: "Error creating direct session" },
      { status: 500 }
    );
  }
}


