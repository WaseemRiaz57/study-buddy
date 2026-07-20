import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";
import { authOptions } from "@/lib/authOptions";
import { awardUser } from "@/lib/gamificationEngine";
import { trackProgress } from "@/lib/challengeTracker";
import { connectMongoDB } from "@/lib/mongodb";
import { isMentorRole, LEGACY_MENTOR_SESSION_METRIC } from "@/lib/roles";
import {
  emitSessionCompleted,
  emitUserNotification,
} from "@/lib/study-room-socket";
import MentorProfile from "@/models/MentorProfile";
import MentorSession from "@/models/MentorSession";
import Notification from "@/models/Notification";
import User from "@/models/User";

function isAllowedRole(role: unknown) {
  const normalizedRole = String(role ?? "").toLowerCase();
  return isMentorRole(normalizedRole) || normalizedRole === "admin";
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
        { message: "Forbidden. Only mentors or admins can complete sessions." },
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
      status: { $in: ["payment_verified", "accepted", "active"] },
    };
    const userRole = String(session.user.role ?? "").toLowerCase();

    if (isMentorRole(userRole)) {
      sessionQuery.mentorId = session.user.id;
    }

    const existingSession = await MentorSession.findOne(sessionQuery);

    if (!existingSession) {
      return NextResponse.json(
        { message: "Verified session not found." },
        { status: 404 }
      );
    }

    if (
      isMentorRole(userRole) &&
      !existingSession.mentorJoinedAt
    ) {
      return NextResponse.json(
        { message: "Join the session room before marking it completed." },
        { status: 403 }
      );
    }

    existingSession.status = "completed";
    existingSession.isSessionStarted = false;
    existingSession.completedAt = new Date();
    const mentorSession = await existingSession.save();

    const rateSource =
      isMentorRole(userRole)
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

    const [updatedMentorProfile, studentReward, mentorReward, mentorSessionProgress] = await Promise.all([
      MentorProfile.findOneAndUpdate(
        { userId: mentorSession.mentorId },
        {
          $setOnInsert: { userId: mentorSession.mentorId },
          $inc: { totalEarnings: sessionEarnings },
        },
        { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
      ),
      awardUser(String(mentorSession.studentId), "COMPLETED_SESSION"),
      awardUser(String(mentorSession.mentorId), "MENTOR_SESSION_COMPLETE"),
      Promise.all([
        trackProgress(String(mentorSession.studentId), "mentor_session", 1),
        trackProgress(String(mentorSession.studentId), LEGACY_MENTOR_SESSION_METRIC, 1),
        trackProgress(String(mentorSession.studentId), "completed_session", 1),
      ]).then((results) => results.flat()),
    ]);

    const studentNotification = await Notification.create({
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
      });

    emitUserNotification(String(mentorSession.studentId), studentNotification.toObject());
    emitSessionCompleted(String(mentorSession.studentId), {
      sessionId: String(mentorSession._id),
      mentorName,
      subject: mentorSession.subject,
    });

    return NextResponse.json({
      success: true,
      message: "Session completed successfully.",
      session: mentorSession,
      rewards: {
        mentorEarningsAdded: sessionEarnings,
        mentorTotalEarnings: updatedMentorProfile?.totalEarnings ?? 0,
        mentorXpAdded: mentorReward.xpAwarded,
        mentorCoinsAdded: mentorReward.coinsAwarded,
        mentorXp: mentorReward.profile.xp,
        mentorCoins: mentorReward.profile.coins,
        mentorStreak: mentorReward.profile.streak,
        studentXpAdded: studentReward.xpAwarded,
        studentCoinsAdded: studentReward.coinsAwarded,
        studentXp: studentReward.profile.xp,
        studentCoins: studentReward.profile.coins,
        studentStreak: studentReward.profile.streak,
        challengeProgress: mentorSessionProgress,
      },
      reward: mentorReward,
    });
  } catch (error) {
    console.error("Complete mentor session error:", error);
    return NextResponse.json(
      { message: "Failed to complete session." },
      { status: 500 }
    );
  }
}


