import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";
import { authOptions } from "@/lib/authOptions";
import {
  buildGlobalMilestones,
  buildPersonalRewardMilestones,
  calculateGlobalStudyHours,
  getGlobalEventEngagement,
  getProgressPercentage,
} from "@/lib/challenges";
import { connectMongoDB } from "@/lib/mongodb";
import Challenge from "@/models/Challenge";

export const dynamic = "force-dynamic";

function buildTickerItems(topContributors: any[], squadOnline: any[]) {
  const contributorItems = topContributors.map(
    (contributor) =>
      `${contributor.name} contributed ${contributor.contributionHours.toLocaleString()} hours`
  );
  const squadItems = squadOnline.map((member) => `${member.name} is active now`);

  return [...contributorItems, ...squadItems].slice(0, 12);
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || !mongoose.Types.ObjectId.isValid(session.user.id)) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await connectMongoDB();

    const [globalChallenge, globalStudyHours, engagement] = await Promise.all([
      Challenge.findOne({ type: "global", isActive: true })
        .sort({ createdAt: -1 })
        .lean(),
      calculateGlobalStudyHours(),
      getGlobalEventEngagement(session.user.id),
    ]);

    const targetMetric = Math.max(1, Number(globalChallenge?.targetMetric || globalStudyHours || 1));
    const progressPercentage = getProgressPercentage(globalStudyHours, targetMetric);
    const milestones = buildGlobalMilestones(targetMetric).map((milestone) => ({
      ...milestone,
      isReached: globalStudyHours >= milestone.value,
    }));
    const personalRewards = buildPersonalRewardMilestones(
      engagement.currentUserContribution,
      targetMetric
    );

    return NextResponse.json({
      event: {
        id: globalChallenge?._id ? String(globalChallenge._id) : "",
        title: globalChallenge?.title || "Great Convergence",
        description:
          globalChallenge?.description ||
          "Every study hour moves the community closer to the global event goal.",
        current: globalStudyHours,
        goal: targetMetric,
        progress: progressPercentage,
        xpReward: Number(globalChallenge?.xpReward || 0),
      },
      squadOnline: engagement.squadOnline,
      activeCount: engagement.activeCount,
      topContributors: engagement.topContributors,
      contributorCount: engagement.contributorCount,
      currentUserContribution: engagement.currentUserContribution,
      personalRewards,
      milestones,
      tickerItems: buildTickerItems(
        engagement.topContributors,
        engagement.squadOnline
      ),
    });
  } catch (error) {
    console.error("Fetch global challenge event error:", error);
    return NextResponse.json(
      { message: "Failed to fetch global challenge event." },
      { status: 500 }
    );
  }
}
