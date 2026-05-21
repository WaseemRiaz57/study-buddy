import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectMongoDB } from "@/lib/mongodb";
import StudySession from "@/models/StudySession";
import BuddyMatch from "@/models/BuddyMatch";
import Notification from "@/models/Notification";
import User from "@/models/User";
import { emitUserNotification } from "@/lib/study-room-socket";

// PATCH /api/study-buddy/respond — User B accepts or rejects a pending session
export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { sessionId, action } = await req.json();

    if (!sessionId || !["accept", "reject"].includes(action)) {
      return NextResponse.json(
        { message: "sessionId and action ('accept' | 'reject') are required." },
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

    // Only the receiver can respond
    if (studySession.receiverId.toString() !== currentUser._id.toString()) {
      return NextResponse.json(
        { message: "You are not authorized to respond to this request." },
        { status: 403 }
      );
    }

    if (studySession.status !== "pending") {
      return NextResponse.json(
        { message: "This session is no longer pending." },
        { status: 409 }
      );
    }

    studySession.status = action === "accept" ? "accepted" : "rejected";
    await studySession.save();

    if (action === "accept") {
      const requester = await User.findById(
        studySession.requesterId,
        "name image"
      ).lean();

      // ── Update BuddyMatch → "Connected" if one exists ───────────
      await BuddyMatch.updateMany(
        {
          $or: [
            { studentId: studySession.requesterId, matchedPeerId: studySession.receiverId },
            { studentId: studySession.receiverId, matchedPeerId: studySession.requesterId },
          ],
          status: "Pending",
        },
        { status: "Connected" }
      );

      // ── Dispatch notification to requester (FR-12) ───────────────
      const notification = await Notification.create({
        recipientId: studySession.requesterId,
        userId: studySession.requesterId,
        senderId: currentUser._id,
        type: "buddy_accepted",
        title: "Buddy Request Accepted!",
        message: `${currentUser.name} accepted your study buddy request${studySession.subject ? ` for ${studySession.subject}` : ""}.`,
        read: false,
        metadata: {
          sessionId: studySession._id.toString(),
          subject: studySession.subject,
        },
      });

      emitUserNotification(String(studySession.requesterId), notification.toObject());

      return NextResponse.json({
        message: "Session accepted!",
        sessionId: studySession._id.toString(),
        peer: {
          name: (requester as any)?.name || "Study Buddy",
          image: (requester as any)?.image || "",
        },
      });
    }

    const notification = await Notification.create({
      recipientId: studySession.requesterId,
      userId: studySession.requesterId,
      senderId: currentUser._id,
      type: "system",
      title: "Study Buddy Request Declined",
      message: `${currentUser.name || "Your study buddy"} declined your study request.`,
      read: false,
      metadata: {
        sessionId: studySession._id.toString(),
        subject: studySession.subject,
      },
    });

    emitUserNotification(String(studySession.requesterId), notification.toObject());

    return NextResponse.json({ message: "Session rejected." });
  } catch (error) {
    console.error("Respond Error:", error);
    return NextResponse.json(
      { message: "Failed to respond." },
      { status: 500 }
    );
  }
}


