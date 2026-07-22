import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";
import { authOptions } from "@/lib/authOptions";
import { isMentorRole } from "@/lib/roles";
import { connectMongoDB } from "@/lib/mongodb";
import { emitUserNotification } from "@/lib/study-room-socket";
import MentorSession from "@/models/MentorSession";
import Notification from "@/models/Notification";

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userRole = String(session.user.role ?? "").toLowerCase();
    if (!isMentorRole(userRole)) {
      return NextResponse.json(
        { message: "Forbidden. Only mentors can verify payments." },
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

    await connectMongoDB();

    const mentorSession = await MentorSession.findOneAndUpdate(
      {
        _id: id,
        mentorId: session.user.id,
        status: "payment_pending",
        paymentReceipt: { $ne: "" },
      },
      {
        $set: {
          status: "payment_verified",
          paymentStatus: "paid",
          roomId: id,
        },
      },
      { new: true, runValidators: true }
    ).populate("studentId", "name image email");

    if (!mentorSession) {
      return NextResponse.json(
        { message: "Payment receipt pending verification not found." },
        { status: 404 }
      );
    }

    const populatedStudent = mentorSession.studentId as unknown as {
      _id?: mongoose.Types.ObjectId;
    };
    const studentId = String(populatedStudent?._id || mentorSession.studentId);
    try {
      const notification = await Notification.create({
        recipientId: studentId,
        senderId: session.user.id,
        type: "system",
        title: "Payment Verified",
        message: `Your payment for ${mentorSession.subject} was verified by your Mentor.`,
        read: false,
        metadata: {
          sessionId: String(mentorSession._id),
          status: "payment_verified",
          roomId: String(mentorSession._id),
        },
      });
      emitUserNotification(studentId, notification.toObject());
    } catch (notificationError) {
      console.error("Payment verification notification error:", notificationError);
    }

    return NextResponse.json({
      success: true,
      message: "Payment verified successfully.",
      session: mentorSession,
    });
  } catch (error) {
    console.error("Verify payment error:", error);
    return NextResponse.json(
      { message: "Failed to verify payment." },
      { status: 500 }
    );
  }
}


