import mongoose from "mongoose";
import { checkBadgeEligibility } from "@/lib/badgeEngine";
import { connectMongoDB } from "@/lib/mongodb";
import Challenge from "@/models/Challenge";
import UserChallengeProgress from "@/models/UserChallengeProgress";
import UserMetric from "@/models/UserMetric";

type TrackingResult = {
  challengeId: string;
  title: string;
  metricLabel: string;
  previousValue: number;
  currentValue: number;
  targetMetric: number;
  isCompleted: boolean;
};

export async function trackProgress(
  userId: string,
  metricLabel: string,
  incrementAmount = 1
) {
  const normalizedMetric = String(metricLabel || "").trim();
  const increment = Number(incrementAmount);

  if (
    !mongoose.Types.ObjectId.isValid(userId) ||
    !normalizedMetric ||
    !Number.isFinite(increment) ||
    increment <= 0
  ) {
    return [];
  }

  await connectMongoDB();

  const userObjectId = new mongoose.Types.ObjectId(userId);
  const metricRow = await UserMetric.findOneAndUpdate(
    { userId: userObjectId, metricLabel: normalizedMetric },
    {
      $inc: { totalValue: increment },
      $setOnInsert: { userId: userObjectId, metricLabel: normalizedMetric },
    },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  ).lean();
  const totalMetricValue = Number(metricRow?.totalValue || 0);

  await checkBadgeEligibility(userId, normalizedMetric, totalMetricValue);

  const matchingChallenges = await Challenge.find({
    isActive: true,
    metricLabel: normalizedMetric,
  })
    .select("_id")
    .lean();
  const matchingChallengeIds = matchingChallenges.map(
    (challenge) => challenge._id
  );

  if (!matchingChallengeIds.length) {
    return [];
  }

  await UserChallengeProgress.bulkWrite(
    matchingChallengeIds.map((challengeId) => ({
      updateOne: {
        filter: { userId: userObjectId, challengeId },
        update: {
          $setOnInsert: {
            userId: userObjectId,
            challengeId,
            currentValue: 0,
            isCompleted: false,
            isClaimed: false,
            lastUpdated: new Date(),
          },
        },
        upsert: true,
      },
    })),
    { ordered: false }
  );

  const progressRows = await UserChallengeProgress.find({
    userId: userObjectId,
    challengeId: { $in: matchingChallengeIds },
    isCompleted: false,
  }).populate({
    path: "challengeId",
    match: { isActive: true, metricLabel: normalizedMetric },
  });

  const updates: TrackingResult[] = [];

  for (const progress of progressRows) {
    const challenge = progress.challengeId as any;

    if (!challenge?._id) continue;

    const previousValue = Number(progress.currentValue || 0);
    const currentValue = previousValue + increment;
    const targetMetric = Number(challenge.targetMetric || 0);
    const isCompleted = currentValue >= targetMetric;

    progress.currentValue = currentValue;
    progress.isCompleted = isCompleted;
    progress.lastUpdated = new Date();
    await progress.save();

    updates.push({
      challengeId: String(challenge._id),
      title: challenge.title || "",
      metricLabel: challenge.metricLabel || normalizedMetric,
      previousValue,
      currentValue,
      targetMetric,
      isCompleted,
    });
  }

  return updates;
}

