import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";
import { authOptions } from "@/lib/authOptions";
import { connectMongoDB } from "@/lib/mongodb";
import MentorSession from "@/models/MentorSession";
import Notification from "@/models/Notification";

type SessionReviewStatus = "accepted" | "declined";

function normalizeStatus(status: unknown): SessionReviewStatus | null {
  const normalizedStatus = String(status ?? "").trim().toLowerCase();

  if (normalizedStatus === "accepted" || normalizedStatus === "declined") {
    return normalizedStatus;
  }

  return null;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userRole = String(session.user.role ?? "").toLowerCase();

    if (userRole !== "teacher" && userRole !== "mentor") {
      return NextResponse.json(
        { message: "Forbidden. This feature is only available to mentors." },
        { status: 403 }
      );
    }

    const { id } = await params;

    if (
      !mongoose.Types.ObjectId.isValid(session.user.id) ||
      !mongoose.Types.ObjectId.isValid(id)
    ) {
      return NextResponse.json(
        { message: "Valid session and mentor ids are required." },
        { status: 400 }
      );
    }

    const body = (await request.json()) as { status?: unknown };
    const nextStatus = normalizeStatus(body.status);

    if (!nextStatus) {
      return NextResponse.json(
        { message: "status must be either 'accepted' or 'declined'." },
        { status: 400 }
      );
    }

    await connectMongoDB();

    const update =
      nextStatus === "accepted"
        ? { status: "accepted", roomId: id }
        : { status: "declined", roomId: "" };

    const mentorSession = await MentorSession.findOneAndUpdate(
      {
        _id: id,
        mentorId: session.user.id,
        status: "pending",
      },
      { $set: update },
      { new: true, runValidators: true }
    );

    if (!mentorSession) {
      return NextResponse.json(
        { message: "Pending session request not found." },
        { status: 404 }
      );
    }

    const mentorName = session.user.name || "your mentor";
    const notificationMessage =
      nextStatus === "accepted"
        ? `Your session with ${mentorName} has been accepted! Join the room now.`
        : `Sorry, your session request with ${mentorName} was declined.`;

    await Notification.create({
      recipientId: mentorSession.studentId,
      senderId: new mongoose.Types.ObjectId(session.user.id),
      type: "system",
      title:
        nextStatus === "accepted"
          ? "Session Request Accepted"
          : "Session Request Declined",
      message: notificationMessage,
      read: false,
      metadata: {
        sessionId: String(mentorSession._id),
        status: nextStatus,
        roomId: nextStatus === "accepted" ? String(mentorSession._id) : "",
      },
    });

    await mentorSession.populate("studentId", "name image email");

    return NextResponse.json({
      success: true,
      message:
        nextStatus === "accepted"
          ? "Session accepted."
          : "Session declined.",
      session: mentorSession,
    });
  } catch (error) {
    console.error("Update mentor session status error:", error);
    return NextResponse.json(
      { message: "Failed to update session status." },
      { status: 500 }
    );
  }
}


