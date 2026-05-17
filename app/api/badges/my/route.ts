import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";
import { authOptions } from "@/lib/authOptions";
import { connectMongoDB } from "@/lib/mongodb";
import Badge from "@/models/Badge";
import UserBadge from "@/models/UserBadge";
import UserMetric from "@/models/UserMetric";

export const dynamic = "force-dynamic";

function serializeBadge({
  badge,
  earnedAt,
  currentValue,
}: {
  badge: any;
  earnedAt: Date | null;
  currentValue: number;
}) {
  const targetValue = Math.max(1, Number(badge.targetValue || 1));
  const progressPercentage = Math.min(
    100,
    Math.round((Math.max(0, currentValue) / targetValue) * 100)
  );

  return {
    id: String(badge._id),
    title: badge.title || "",
    name: badge.title || "",
    description: badge.description || "",
    icon: badge.icon || "Award",
    rarity: badge.rarity || "common",
    metricLabel: badge.metricLabel || "",
    targetValue,
    xpBonus: Number(badge.xpBonus || 0),
    coinBonus: Number(badge.coinBonus || 0),
    earned: Boolean(earnedAt),
    earnedAt,
    earnedDate: earnedAt
      ? new Intl.DateTimeFormat("en", {
          month: "short",
          year: "numeric",
        }).format(new Date(earnedAt))
      : "",
    currentValue,
    progressPercentage,
    progress: {
      current: currentValue,
      total: targetValue,
      label: `${Math.min(currentValue, targetValue).toLocaleString()}/${targetValue.toLocaleString()} ${badge.metricLabel || "progress"}`,
    },
  };
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (!mongoose.Types.ObjectId.isValid(session.user.id)) {
      return NextResponse.json(
        { message: "Valid user id is required." },
        { status: 400 }
      );
    }

    await connectMongoDB();

    const userObjectId = new mongoose.Types.ObjectId(session.user.id);
    const [badges, earnedRows, metricRows] = await Promise.all([
      Badge.find({ isActive: true }).sort({ rarity: -1, targetValue: 1 }).lean(),
      UserBadge.find({ userId: userObjectId }).select("badgeId earnedAt").lean(),
      UserMetric.find({ userId: userObjectId }).select("metricLabel totalValue").lean(),
    ]);

    const earnedMap = new Map(
      earnedRows.map((row) => [String(row.badgeId), row.earnedAt || row.createdAt])
    );
    const metricMap = new Map(
      metricRows.map((row) => [
        String(row.metricLabel || "").toLowerCase(),
        Number(row.totalValue || 0),
      ])
    );
    const mappedBadges = badges.map((badge) =>
      serializeBadge({
        badge,
        earnedAt: earnedMap.get(String(badge._id)) || null,
        currentValue: metricMap.get(String(badge.metricLabel || "").toLowerCase()) || 0,
      })
    );

    const earnedBadges = mappedBadges.filter((badge) => badge.earned);
    const lockedBadges = mappedBadges.filter((badge) => !badge.earned);

    return NextResponse.json({
      badges: mappedBadges,
      earnedBadges,
      lockedBadges,
      stats: {
        totalBadges: mappedBadges.length,
        earnedCount: earnedBadges.length,
        lockedCount: lockedBadges.length,
        completionPercentage:
          mappedBadges.length > 0
            ? Math.round((earnedBadges.length / mappedBadges.length) * 100)
            : 0,
      },
    });
  } catch (error) {
    console.error("Fetch user badges error:", error);
    return NextResponse.json(
      { message: "Failed to fetch badges." },
      { status: 500 }
    );
  }
}
