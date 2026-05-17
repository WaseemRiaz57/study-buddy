import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";
import { authOptions } from "@/lib/authOptions";
import {
  calculateGlobalStudyHours,
  getUserAndProfile,
} from "@/lib/challenges";
import { awardUser } from "@/lib/gamificationEngine";
import { logActivity } from "@/lib/logActivity";
import { connectMongoDB } from "@/lib/mongodb";
import Challenge from "@/models/Challenge";
import UserChallengeProgress from "@/models/UserChallengeProgress";

export const dynamic = "force-dynamic";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id: challengeId } = await params;

    if (!session?.user?.id || !mongoose.Types.ObjectId.isValid(session.user.id)) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (!mongoose.Types.ObjectId.isValid(challengeId)) {
      return NextResponse.json(
        { message: "A valid challenge id is required." },
        { status: 400 }
      );
    }

    await connectMongoDB();

    const [challenge, { user, profile }] = await Promise.all([
      Challenge.findOne({ _id: challengeId, isActive: true }).lean(),
      getUserAndProfile(session.user.id),
    ]);

    if (!user) {
      return NextResponse.json({ message: "User not found." }, { status: 404 });
    }

    if (!challenge) {
      return NextResponse.json(
        { message: "Challenge not found." },
        { status: 404 }
      );
    }

    if (challenge.type === "elite" && !profile?.hasEliteChallenges) {
      return NextResponse.json(
        { message: "Unlock Elite Challenges before claiming this reward." },
        { status: 403 }
      );
    }

    const userObjectId = new mongoose.Types.ObjectId(session.user.id);
    let progress = await UserChallengeProgress.findOne({
      userId: userObjectId,
      challengeId: challenge._id,
    });

    if (!progress) {
      progress = await UserChallengeProgress.create({
        userId: userObjectId,
        challengeId: challenge._id,
      });
    }

    const globalValue =
      challenge.type === "global" ? await calculateGlobalStudyHours() : 0;
    const currentValue = Math.max(
      Number(progress.currentValue || 0),
      globalValue
    );
    const targetMetric = Number(challenge.targetMetric || 0);

    if (progress.isClaimed) {
      return NextResponse.json(
        { message: "This challenge reward has already been claimed." },
        { status: 409 }
      );
    }

    if (currentValue < targetMetric) {
      return NextResponse.json(
        { message: "Challenge is not complete yet." },
        { status: 400 }
      );
    }

    progress.currentValue = currentValue;
    progress.isCompleted = true;
    progress.isClaimed = true;
    progress.lastUpdated = new Date();
    await progress.save();

    const reward = await awardUser(session.user.id, "CHALLENGE_COMPLETED", {
      xp: Number(challenge.xpReward || 0),
      coins: 0,
    });

    await logActivity({
      actionType: "CHALLENGE_REWARD_CLAIMED",
      message: `${session.user.name || "A user"} claimed ${challenge.title} for ${challenge.xpReward} XP`,
      targetId: String(challenge._id),
    });

    return NextResponse.json({
      success: true,
      message: "Challenge reward claimed.",
      reward,
      progress: {
        currentValue: progress.currentValue,
        isCompleted: progress.isCompleted,
        isClaimed: progress.isClaimed,
        lastUpdated: progress.lastUpdated,
      },
    });
  } catch (error) {
    console.error("Claim challenge error:", error);
    return NextResponse.json(
      { message: "Failed to claim challenge reward." },
      { status: 500 }
    );
  }
}
