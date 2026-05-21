import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth-guard";
import { connectMongoDB } from "@/lib/mongodb";
import StudySession from "@/models/StudySession";
import BuddyMatch from "@/models/BuddyMatch";
import User from "@/models/User";
import Notification from "@/models/Notification";
import { emitUserNotification } from "@/lib/study-room-socket";

function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// POST /api/study-buddy/request — Student creates a pending BuddyMatch + StudySession
export async function POST(req: Request) {
  try {
    // ── Role check (students only) ────────────────────────────────
    const { error, session } = await requireRole("student");
    if (error) return error;

    const { targetUserId, subject, topic } = await req.json();
    const normalizedTargetUserId = String(targetUserId || "").trim();
    const normalizedSubject = String(subject || "General").trim().slice(0, 100) || "General";
    const normalizedTopic = String(topic || "").trim().slice(0, 160);

    if (!normalizedTargetUserId) {
      return NextResponse.json(
        { message: "targetUserId is required" },
        { status: 400 }
      );
    }

    const studentId = session!.user.id;

    await connectMongoDB();

    const currentUser = await User.findById(studentId);
    if (!currentUser) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // targetUserId can be an email or _id — resolve to User document
    const targetUser = await User.findOne({
      $or: [
        { email: normalizedTargetUserId.toLowerCase() },
        ...(normalizedTargetUserId.match(/^[0-9a-fA-F]{24}$/)
          ? [{ _id: normalizedTargetUserId }]
          : []),
      ],
    });

    if (!targetUser) {
      return NextResponse.json(
        { message: "Target user not found" },
        { status: 404 }
      );
    }

    if (targetUser.role !== "student") {
      return NextResponse.json(
        { message: "Matched peer is not a student." },
        { status: 400 }
      );
    }

    if (currentUser._id.toString() === targetUser._id.toString()) {
      return NextResponse.json(
        { message: "Cannot send a request to yourself" },
        { status: 400 }
      );
    }

    // Cancel any stale pending sessions from this requester to this receiver
    await StudySession.updateMany(
      {
        requesterId: currentUser._id,
        receiverId: targetUser._id,
        status: "pending",
      },
      { status: "rejected" }
    );

    // ── Create BuddyMatch record with "Pending" status ───────────
    const matchSubject = normalizedSubject;

    // Check for existing pending match to avoid duplicates
    const existingMatch = await BuddyMatch.findOne({
      studentId: currentUser._id,
      matchedPeerId: targetUser._id,
      subject: { $regex: new RegExp(`^${escapeRegex(matchSubject)}$`, "i") },
      status: "Pending",
    });

    let buddyMatch;
    if (!existingMatch) {
      buddyMatch = await BuddyMatch.create({
        studentId: currentUser._id,
        matchedPeerId: targetUser._id,
        subject: matchSubject,
        status: "Pending",
      });
    } else {
      buddyMatch = existingMatch;
    }

    // ── Create StudySession (existing flow) ────────────────────────
    const newSession = await StudySession.create({
      requesterId: currentUser._id,
      receiverId: targetUser._id,
      status: "pending",
      subject: normalizedSubject,
      topic: normalizedTopic,
    });

    const notification = await Notification.create({
      userId: targetUser._id,
      recipientId: targetUser._id,
      senderId: currentUser._id,
      type: "buddy_request",
      title: "New Study Buddy Request",
      message: `${currentUser.name || "A student"} wants to study ${normalizedSubject} with you.`,
      read: false,
      metadata: {
        sessionId: newSession._id.toString(),
        matchId: buddyMatch._id.toString(),
        subject: normalizedSubject,
      },
    });

    emitUserNotification(String(targetUser._id), notification.toObject());

    return NextResponse.json(
      {
        message: "Request sent!",
        sessionId: newSession._id.toString(),
        matchId: buddyMatch._id.toString(),
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    // Handle duplicate key error from compound index
    if (err && typeof err === "object" && "code" in err && err.code === 11000) {
      return NextResponse.json(
        { message: "Duplicate buddy request." },
        { status: 409 }
      );
    }
    console.error("Study Buddy Request Error:", err);
    return NextResponse.json(
      { message: "Failed to send request." },
      { status: 500 }
    );
  }
}


