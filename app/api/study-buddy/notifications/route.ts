import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectMongoDB } from "@/lib/mongodb";
import StudySession from "@/models/StudySession";
import User from "@/models/User";

// GET /api/study-buddy/notifications — User B polls for pending incoming requests
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await connectMongoDB();

    const currentUser = await User.findOne({ email: session.user.email });
    if (!currentUser) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const pendingSessions = await StudySession.find({
      receiverId: currentUser._id,
      status: "pending",
    })
      .populate("requesterId", "name email image")
      .sort({ createdAt: -1 })
      .lean();

    const notifications = pendingSessions.map((s: any) => ({
      sessionId: s._id.toString(),
      requester: {
        id: s.requesterId._id.toString(),
        name: s.requesterId.name,
        email: s.requesterId.email,
        image: s.requesterId.image || "",
      },
      subject: s.subject,
      topic: s.topic,
      createdAt: s.createdAt,
    }));

    return NextResponse.json({ notifications });
  } catch (error) {
    console.error("Notifications Error:", error);
    return NextResponse.json(
      { message: "Failed to fetch notifications." },
      { status: 500 }
    );
  }
}
