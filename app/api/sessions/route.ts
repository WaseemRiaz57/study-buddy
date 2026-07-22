import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";
import { authOptions } from "@/lib/authOptions";
import { connectMongoDB } from "@/lib/mongodb";
import MentorProfile from "@/models/MentorProfile";
import MentorReview from "@/models/MentorReview";
import MentorSession from "@/models/MentorSession";

const DEFAULT_ACTIVITY_LIMIT = 30;
const MAX_ACTIVITY_LIMIT = 50;

function getPopulatedId(value: unknown) {
  if (value && typeof value === "object" && "_id" in value) {
    return String(value._id);
  }

  return String(value ?? "");
}

function getActivityLimit(request: Request) {
  const requestedLimit = Number(new URL(request.url).searchParams.get("limit"));

  if (!Number.isInteger(requestedLimit) || requestedLimit < 1) {
    return DEFAULT_ACTIVITY_LIMIT;
  }

  return Math.min(requestedLimit, MAX_ACTIVITY_LIMIT);
}

export async function GET(request: Request) {
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

    const activityLimit = getActivityLimit(request);

    const mentorSessions = await MentorSession.find({
      $or: [
        { studentId: session.user.id },
        { students: session.user.id }
      ]
    })
      .select(
        "mentorId subject scheduledAt duration type status roomId isSessionStarted actualStartTime createdAt updatedAt"
      )
      .populate("mentorId", "name image profileImage avatar")
      .sort({ scheduledAt: -1 })
      .limit(activityLimit)
      .maxTimeMS(8000)
      .lean();

    const sessionIds = mentorSessions.map((mentorSession) => mentorSession._id);
    const mentorIds = [
      ...new Set(mentorSessions.map((mentorSession) => getPopulatedId(mentorSession.mentorId))),
    ];
    const [reviewedSessionIds, mentorProfiles] = await Promise.all([
      MentorReview.find({
        sessionId: { $in: sessionIds },
        studentId: session.user.id,
      })
        .select("sessionId")
        .maxTimeMS(5000)
        .lean(),
      MentorProfile.find({
        userId: { $in: mentorIds },
      })
        .select("userId bankName accountTitle accountNumber hourlyRate")
        .maxTimeMS(5000)
        .lean(),
    ]);

    const reviewedBySessionId = new Set(
      reviewedSessionIds.map((review) => String(review.sessionId))
    );
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


