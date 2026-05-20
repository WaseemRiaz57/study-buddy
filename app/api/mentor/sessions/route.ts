import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";
import { authOptions } from "@/lib/authOptions";
import { connectMongoDB } from "@/lib/mongodb";
import MentorSession from "@/models/MentorSession";

const MIN_DURATION_MINUTES = 15;
const MAX_DURATION_MINUTES = 240;

export async function GET() {
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

    if (!mongoose.Types.ObjectId.isValid(session.user.id)) {
      return NextResponse.json(
        { message: "Invalid authenticated user id." },
        { status: 400 }
      );
    }

    await connectMongoDB();

    const sessions = await MentorSession.find({ mentorId: session.user.id })
      .select(
        "studentId mentorId subject scheduledAt duration type status paymentStatus paymentReceipt roomId createdAt updatedAt"
      )
      .populate("studentId", "name profileImage")
      .sort({ scheduledAt: 1 })
      .lean();

    return NextResponse.json(
      sessions.map((mentorSession) => ({
        ...mentorSession,
        student: mentorSession.studentId,
      }))
    );
  } catch (error) {
    console.error("Fetch mentor sessions error:", error);
    return NextResponse.json(
      { message: "Failed to fetch mentor sessions" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
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

    const body = await request.json().catch(() => ({}));
    const studentId = String(body.studentId || "");
    const subject = String(body.subject || "").trim();
    const scheduledAt = new Date(String(body.scheduledAt || ""));
    const duration = Number(body.duration || 60);

    if (
      !mongoose.Types.ObjectId.isValid(session.user.id) ||
      !mongoose.Types.ObjectId.isValid(studentId)
    ) {
      return NextResponse.json(
        { message: "Valid mentor and student ids are required." },
        { status: 400 }
      );
    }

    if (!subject || subject.length > 120) {
      return NextResponse.json(
        { message: "Subject must be between 1 and 120 characters." },
        { status: 400 }
      );
    }

    if (Number.isNaN(scheduledAt.getTime())) {
      return NextResponse.json(
        { message: "A valid scheduled date is required." },
        { status: 400 }
      );
    }

    if (
      !Number.isFinite(duration) ||
      duration < MIN_DURATION_MINUTES ||
      duration > MAX_DURATION_MINUTES
    ) {
      return NextResponse.json(
        {
          message: `Duration must be between ${MIN_DURATION_MINUTES} and ${MAX_DURATION_MINUTES} minutes.`,
        },
        { status: 400 }
      );
    }

    await connectMongoDB();

    const connectedSession = await MentorSession.findOne({
      mentorId: session.user.id,
      studentId,
      status: { $in: ["accepted", "completed", "payment_verified"] },
    }).select("_id");

    if (!connectedSession) {
      return NextResponse.json(
        { message: "You can only schedule sessions with connected students." },
        { status: 403 }
      );
    }

    const mentorSession = await MentorSession.create({
      mentorId: session.user.id,
      studentId,
      subject,
      scheduledAt,
      duration,
      type: "scheduled",
      status: "accepted",
      paymentStatus: "unpaid",
    });

    return NextResponse.json(
      {
        message: "Session scheduled successfully.",
        session: mentorSession,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create mentor session error:", error);
    return NextResponse.json(
      { message: "Failed to schedule session." },
      { status: 500 }
    );
  }
}


