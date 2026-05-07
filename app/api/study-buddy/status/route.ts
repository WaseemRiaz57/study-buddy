import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { requireRole } from "@/lib/auth-guard";
import { connectMongoDB } from "@/lib/mongodb";
import { setStudentOnline, setStudentOffline } from "@/lib/redis";
import StudySession from "@/models/StudySession";
import User from "@/models/User";
import mongoose from "mongoose";

type LeanStudySession = {
  _id: { toString(): string };
  requesterId: { toString(): string };
  receiverId: { toString(): string };
  status: string;
  selectedMode?: "chat" | "video" | null;
};

type LeanPeer = {
  name?: string;
  image?: string;
};

// GET /api/study-buddy/status?sessionId=... — User A polls to check if User B responded
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("sessionId");

    if (!sessionId || !mongoose.Types.ObjectId.isValid(sessionId)) {
      return NextResponse.json(
        { message: "A valid sessionId query param is required." },
        { status: 400 }
      );
    }

    await connectMongoDB();

    const currentUser = await User.findOne({ email: session.user.email });
    if (!currentUser) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const studySession = (await StudySession.findById(sessionId).lean()) as
      | LeanStudySession
      | null;
    if (!studySession) {
      return NextResponse.json(
        { message: "Session not found" },
        { status: 404 }
      );
    }

    // Determine who the "other" user is
    const isRequester =
      studySession.requesterId.toString() === currentUser._id.toString();
    const isReceiver =
      studySession.receiverId.toString() === currentUser._id.toString();

    if (!isRequester && !isReceiver) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const peerId = isRequester
      ? studySession.receiverId
      : studySession.requesterId;

    const peer = (await User.findById(peerId, "name image").lean()) as LeanPeer | null;

    return NextResponse.json({
      sessionId: studySession._id.toString(),
      status: studySession.status,
      selectedMode: studySession.selectedMode,
      peer: {
        name: peer?.name || "Study Buddy",
        image: peer?.image || "",
      },
    });
  } catch (error) {
    console.error("Status Error:", error);
    return NextResponse.json(
      { message: "Failed to fetch session status." },
      { status: 500 }
    );
  }
}

/**
 * POST /api/study-buddy/status
 * Body: { online: boolean }
 *
 * Sets the student's online status in Redis (primary) and MongoDB (fallback).
 * The front-end should call this as a heartbeat (~every 4 min) to stay "online".
 * Restricted to students only.
 */
export async function POST(req: Request) {
  const { error, session } = await requireRole("student");
  if (error) return error;

  try {
    const { online } = await req.json();
    const studentId = session!.user.id;

    // Update Redis (primary)
    if (online) {
      await setStudentOnline(studentId);
    } else {
      await setStudentOffline(studentId);
    }

    // Update MongoDB fallback
    await connectMongoDB();
    await User.findByIdAndUpdate(studentId, { isOnline: !!online });

    return NextResponse.json(
      { message: `Status set to ${online ? "online" : "offline"}.` },
      { status: 200 }
    );
  } catch (err) {
    console.error("Online Status Error:", err);
    return NextResponse.json(
      { message: "Failed to update online status." },
      { status: 500 }
    );
  }
}
