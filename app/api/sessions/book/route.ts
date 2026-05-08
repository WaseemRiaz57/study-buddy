import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";
import { authOptions } from "@/lib/authOptions";
import { connectMongoDB } from "@/lib/mongodb";
import MentorSession from "@/models/MentorSession";
import User from "@/models/User";

const MIN_DURATION_MINUTES = 15;
const MAX_DURATION_MINUTES = 240;

function parseScheduledAt(value: unknown) {
  const date = new Date(String(value ?? ""));
  return Number.isNaN(date.getTime()) ? null : date;
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userRole = String(session.user.role ?? "").toLowerCase();

    if (userRole !== "student") {
      return NextResponse.json(
        { message: "Forbidden. This feature is only available to students." },
        { status: 403 }
      );
    }

    const { mentorId, subject, scheduledAt, duration } = await request.json();
    const normalizedSubject = String(subject ?? "").trim();
    const normalizedDuration = Number(duration);
    const normalizedScheduledAt = parseScheduledAt(scheduledAt);

    if (
      !mongoose.Types.ObjectId.isValid(session.user.id) ||
      !mongoose.Types.ObjectId.isValid(String(mentorId ?? ""))
    ) {
      return NextResponse.json(
        { message: "Valid student and mentor ids are required." },
        { status: 400 }
      );
    }

    if (!normalizedSubject || normalizedSubject.length > 120) {
      return NextResponse.json(
        { message: "Subject must be between 1 and 120 characters." },
        { status: 400 }
      );
    }

    if (!normalizedScheduledAt) {
      return NextResponse.json(
        { message: "A valid scheduledAt date is required." },
        { status: 400 }
      );
    }

    if (
      !Number.isFinite(normalizedDuration) ||
      normalizedDuration < MIN_DURATION_MINUTES ||
      normalizedDuration > MAX_DURATION_MINUTES
    ) {
      return NextResponse.json(
        {
          message: `Duration must be between ${MIN_DURATION_MINUTES} and ${MAX_DURATION_MINUTES} minutes.`,
        },
        { status: 400 }
      );
    }

    await connectMongoDB();

    const mentor = await User.findOne({
      _id: mentorId,
      role: "mentor",
    }).select("_id");

    if (!mentor) {
      return NextResponse.json(
        { message: "Mentor not found." },
        { status: 404 }
      );
    }

    const bookedSession = await MentorSession.create({
      studentId: session.user.id,
      mentorId,
      subject: normalizedSubject,
      scheduledAt: normalizedScheduledAt,
      duration: normalizedDuration,
      status: "pending",
      paymentStatus: "unpaid",
    });

    return NextResponse.json(
      {
        message: "Session booked successfully!",
        session: bookedSession,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Book mentor session error:", error);
    return NextResponse.json(
      { message: "Failed to book mentor session" },
      { status: 500 }
    );
  }
}
