import mongoose from "mongoose";
import { awardUser } from "@/lib/gamificationEngine";
import { connectMongoDB } from "@/lib/mongodb";
import Badge from "@/models/Badge";
import Notification from "@/models/Notification";
import UserBadge from "@/models/UserBadge";

export type BadgeAwardResult = {
  badgeId: string;
  title: string;
  xpBonus: number;
  coinBonus: number;
};

function normalizeMetric(metricLabel: unknown) {
  return String(metricLabel || "").trim().toLowerCase();
}

export async function checkBadgeEligibility(
  userId: string,
  metricLabel: string,
  totalValue: number
): Promise<BadgeAwardResult[]> {
  const normalizedMetric = normalizeMetric(metricLabel);
  const normalizedTotal = Number(totalValue);

  if (
    !mongoose.Types.ObjectId.isValid(userId) ||
    !normalizedMetric ||
    !Number.isFinite(normalizedTotal) ||
    normalizedTotal <= 0
  ) {
    return [];
  }

  await connectMongoDB();

  const userObjectId = new mongoose.Types.ObjectId(userId);
  const badges = await Badge.find({
    isActive: true,
    metricLabel: normalizedMetric,
    targetValue: { $lte: normalizedTotal },
  }).lean();

  if (!badges.length) return [];

  const badgeIds = badges.map((badge) => badge._id);
  const earnedRows = await UserBadge.find({
    userId: userObjectId,
    badgeId: { $in: badgeIds },
  })
    .select("badgeId")
    .lean();
  const earnedBadgeIds = new Set(
    earnedRows.map((row) => String(row.badgeId))
  );
  const awards: BadgeAwardResult[] = [];

  for (const badge of badges) {
    if (earnedBadgeIds.has(String(badge._id))) continue;

    try {
      await UserBadge.create({
        userId: userObjectId,
        badgeId: badge._id,
        earnedAt: new Date(),
      });
    } catch (error) {
      if (
        error &&
        typeof error === "object" &&
        "code" in error &&
        error.code === 11000
      ) {
        continue;
      }

      throw error;
    }

    const xpBonus = Math.max(0, Number(badge.xpBonus || 0));
    const coinBonus = Math.max(0, Number(badge.coinBonus || 0));

    if (xpBonus > 0 || coinBonus > 0) {
      await awardUser(userId, "CHALLENGE_COMPLETED", {
        xp: xpBonus,
        coins: coinBonus,
      });
    }

    await Notification.create({
      userId: userObjectId,
      recipientId: userObjectId,
      senderId: null,
      type: "system",
      title: "New Badge Unlocked",
      message: `New Badge Unlocked: ${badge.title}! 🏆`,
      read: false,
      metadata: {
        badgeId: String(badge._id),
        metricLabel: normalizedMetric,
        totalValue: normalizedTotal,
        xpBonus,
        coinBonus,
      },
    });

    awards.push({
      badgeId: String(badge._id),
      title: badge.title || "",
      xpBonus,
      coinBonus,
    });
  }

  return awards;
}
