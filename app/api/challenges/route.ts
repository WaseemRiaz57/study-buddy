import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";
import { authOptions } from "@/lib/authOptions";
import {
  calculateGlobalStudyHours,
  getProgressPercentage,
  getProfileStats,
  getUserAndProfile,
} from "@/lib/challenges";
import { connectMongoDB } from "@/lib/mongodb";
import Challenge from "@/models/Challenge";
import UserChallengeProgress from "@/models/UserChallengeProgress";

export const dynamic = "force-dynamic";

function serializeChallenge({
  challenge,
  progress,
  hasEliteChallenges,
  globalStudyHours,
}: {
  challenge: any;
  progress: any;
  hasEliteChallenges: boolean;
  globalStudyHours: number;
}) {
  const targetMetric = Number(challenge.targetMetric || 0);
  const storedValue = Number(progress?.currentValue || 0);
  const currentValue =
    challenge.type === "global" ? Math.max(storedValue, globalStudyHours) : storedValue;
  const isCompleted = currentValue >= targetMetric || Boolean(progress?.isCompleted);
  const isClaimed = Boolean(progress?.isClaimed);
  const isLocked = challenge.type === "elite" && !hasEliteChallenges;

  return {
    id: String(challenge._id),
    title: challenge.title || "",
    description: challenge.description || "",
    type: challenge.type,
    targetMetric,
    xpReward: Number(challenge.xpReward || 0),
    isActive: Boolean(challenge.isActive),
    isLocked,
    progress: {
      currentValue,
      targetMetric,
      percentage: getProgressPercentage(currentValue, targetMetric),
      isCompleted,
      isClaimed,
      lastUpdated: progress?.lastUpdated || null,
    },
    createdAt: challenge.createdAt || null,
  };
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || !mongoose.Types.ObjectId.isValid(session.user.id)) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await connectMongoDB();

    const userObjectId = new mongoose.Types.ObjectId(session.user.id);
    const [{ user, profile }, challenges, globalStudyHours] = await Promise.all([
      getUserAndProfile(session.user.id),
      Challenge.find({ isActive: true }).sort({ type: 1, createdAt: -1 }).lean(),
      calculateGlobalStudyHours(),
    ]);

    if (!user) {
      return NextResponse.json({ message: "User not found." }, { status: 404 });
    }

    const challengeIds = challenges.map((challenge) => challenge._id);
    const progressRows = challengeIds.length
      ? await UserChallengeProgress.find({
          userId: userObjectId,
          challengeId: { $in: challengeIds },
        }).lean()
      : [];
    const progressByChallenge = new Map(
      progressRows.map((progress) => [String(progress.challengeId), progress])
    );
    const stats = getProfileStats(profile);

    const serializedChallenges = challenges.map((challenge) =>
      serializeChallenge({
        challenge,
        progress: progressByChallenge.get(String(challenge._id)),
        hasEliteChallenges: stats.hasEliteChallenges,
        globalStudyHours,
      })
    );

    return NextResponse.json({
      challenges: serializedChallenges,
      stats,
      globalStats: {
        totalStudyHours: globalStudyHours,
      },
    });
  } catch (error) {
    console.error("Fetch challenges error:", error);
    return NextResponse.json(
      { message: "Failed to fetch challenges." },
      { status: 500 }
    );
  }
}
