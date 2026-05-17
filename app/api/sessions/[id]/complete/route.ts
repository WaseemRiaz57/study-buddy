import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";
import { authOptions } from "@/lib/authOptions";
import { awardUser } from "@/lib/gamificationEngine";
import { trackProgress } from "@/lib/challengeTracker";
import { connectMongoDB } from "@/lib/mongodb";
import MentorProfile from "@/models/MentorProfile";
import MentorSession from "@/models/MentorSession";
import Notification from "@/models/Notification";
import User from "@/models/User";

function isAllowedRole(role: unknown) {
  const normalizedRole = String(role ?? "").toLowerCase();
  return (
    normalizedRole === "teacher" ||
    normalizedRole === "mentor" ||
    normalizedRole === "admin"
  );
}

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (!isAllowedRole(session.user.role)) {
      return NextResponse.json(
        { message: "Forbidden. Only teachers or admins can complete sessions." },
        { status: 403 }
      );
    }

    const { id } = await params;

    if (
      !mongoose.Types.ObjectId.isValid(session.user.id) ||
      !mongoose.Types.ObjectId.isValid(id)
    ) {
      return NextResponse.json(
        { message: "Valid session and user ids are required." },
        { status: 400 }
      );
    }

    await connectMongoDB();

    const mentorProfile = await MentorProfile.findOne({
      userId: session.user.id,
    })
      .select("hourlyRate")
      .lean();

    const sessionQuery: Record<string, unknown> = {
      _id: id,
      status: { $in: ["payment_verified", "accepted"] },
    };
    const userRole = String(session.user.role ?? "").toLowerCase();

    if (userRole === "teacher" || userRole === "mentor") {
      sessionQuery.mentorId = session.user.id;
    }

    const mentorSession = await MentorSession.findOneAndUpdate(
      sessionQuery,
      { $set: { status: "completed" } },
      { new: true, runValidators: true }
    );

    if (!mentorSession) {
      return NextResponse.json(
        { message: "Verified session not found." },
        { status: 404 }
      );
    }

    const rateSource =
      userRole === "teacher" || userRole === "mentor"
        ? mentorProfile
        : await MentorProfile.findOne({ userId: mentorSession.mentorId })
            .select("hourlyRate")
            .lean();
    const hourlyRate = Number(rateSource?.hourlyRate ?? 0);
    const sessionEarnings = Math.max(
      0,
      Math.round(((hourlyRate * mentorSession.duration) / 60) * 100) / 100
    );

    const mentorUser = await User.findById(mentorSession.mentorId)
      .select("name")
      .lean();
    const mentorName = mentorUser?.name || "your mentor";

    const [updatedMentorProfile, studentReward, teacherSessionProgress] = await Promise.all([
      MentorProfile.findOneAndUpdate(
        { userId: mentorSession.mentorId },
        {
          $setOnInsert: { userId: mentorSession.mentorId },
          $inc: { totalEarnings: sessionEarnings },
        },
        { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
      ),
      awardUser(String(mentorSession.studentId), "COMPLETED_SESSION"),
      trackProgress(String(mentorSession.studentId), "teacher_session", 1),
    ]);

    await Promise.all([
      Notification.create({
        recipientId: mentorSession.studentId,
        senderId: mentorSession.mentorId,
        type: "system",
        title: "Session Completed",
        message: `Your session with ${mentorName} has concluded. ${studentReward.xpAwarded} XP and ${studentReward.coinsAwarded} coins were added to your profile!`,
        read: false,
        metadata: {
          sessionId: String(mentorSession._id),
          xpAwarded: studentReward.xpAwarded,
          coinsAwarded: studentReward.coinsAwarded,
          earningsAwarded: sessionEarnings,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: "Session completed successfully.",
      session: mentorSession,
      rewards: {
        mentorEarningsAdded: sessionEarnings,
        mentorTotalEarnings: updatedMentorProfile?.totalEarnings ?? 0,
        studentXpAdded: studentReward.xpAwarded,
        studentCoinsAdded: studentReward.coinsAwarded,
        studentXp: studentReward.profile.xp,
        studentCoins: studentReward.profile.coins,
        studentStreak: studentReward.profile.streak,
        challengeProgress: teacherSessionProgress,
      },
    });
  } catch (error) {
    console.error("Complete mentor session error:", error);
    return NextResponse.json(
      { message: "Failed to complete session." },
      { status: 500 }
    );
  }
}


