import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";
import { authOptions } from "@/lib/authOptions";
import { connectMongoDB } from "@/lib/mongodb";
import MentorProfile from "@/models/MentorProfile";
import MentorReview from "@/models/MentorReview";
import MentorSession from "@/models/MentorSession";

function getPopulatedId(value: unknown) {
  if (value && typeof value === "object" && "_id" in value) {
    return String(value._id);
  }

  return String(value ?? "");
}

export async function GET() {
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

    if (!mongoose.Types.ObjectId.isValid(session.user.id)) {
      return NextResponse.json(
        { message: "Valid student id is required." },
        { status: 400 }
      );
    }

    await connectMongoDB();

    const mentorSessions = await MentorSession.find({ studentId: session.user.id })
      .populate("mentorId", "name image email")
      .sort({ scheduledAt: -1 })
      .lean();

    const sessionIds = mentorSessions.map((mentorSession) => mentorSession._id);
    const reviewedSessionIds = await MentorReview.find({
      sessionId: { $in: sessionIds },
      studentId: session.user.id,
    })
      .select("sessionId")
      .lean();

    const reviewedBySessionId = new Set(
      reviewedSessionIds.map((review) => String(review.sessionId))
    );
    const mentorIds = [
      ...new Set(mentorSessions.map((mentorSession) => getPopulatedId(mentorSession.mentorId))),
    ];
    const mentorProfiles = await MentorProfile.find({
      userId: { $in: mentorIds },
    })
      .select("userId bankName accountTitle accountNumber hourlyRate")
      .lean();
    const mentorProfileByUserId = new Map(
      mentorProfiles.map((profile) => [String(profile.userId), profile])
    );

    return NextResponse.json(
      mentorSessions.map((mentorSession) => ({
        ...mentorSession,
        mentorProfile:
          mentorProfileByUserId.get(getPopulatedId(mentorSession.mentorId)) ?? null,
        reviewSubmitted: reviewedBySessionId.has(String(mentorSession._id)),
      }))
    );
  } catch (error) {
    console.error("Fetch student mentor sessions error:", error);
    return NextResponse.json(
      { message: "Failed to fetch sessions" },
      { status: 500 }
    );
  }
}
