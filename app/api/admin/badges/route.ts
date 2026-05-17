import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { logActivity } from "@/lib/logActivity";
import { connectMongoDB } from "@/lib/mongodb";
import Badge, { type BadgeRarity } from "@/models/Badge";
import UserBadge from "@/models/UserBadge";

export const dynamic = "force-dynamic";

const RARITIES: BadgeRarity[] = ["common", "rare", "legendary"];

function isAdminRole(role: unknown) {
  return String(role ?? "").toLowerCase() === "admin";
}

async function requireAdmin() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return {
      error: NextResponse.json({ message: "Unauthorized" }, { status: 401 }),
    };
  }

  if (!isAdminRole(session.user.role)) {
    return {
      error: NextResponse.json({ message: "Forbidden" }, { status: 403 }),
    };
  }

  return { error: null };
}

function normalizeRarity(value: unknown): BadgeRarity {
  const normalized = String(value || "").trim().toLowerCase();
  return RARITIES.includes(normalized as BadgeRarity)
    ? (normalized as BadgeRarity)
    : "common";
}

function normalizeMetric(value: unknown) {
  return String(value || "").trim().toLowerCase().slice(0, 80);
}

function sanitizeBadgeInput(body: any) {
  return {
    title: String(body.title || "").trim().slice(0, 120),
    description: String(body.description || "").trim().slice(0, 500),
    icon: String(body.icon || "Award").trim().slice(0, 80),
    rarity: normalizeRarity(body.rarity),
    metricLabel: normalizeMetric(body.metricLabel),
    targetValue: Math.max(1, Math.round(Number(body.targetValue || 1))),
    xpBonus: Math.max(0, Math.round(Number(body.xpBonus || 0))),
    coinBonus: Math.max(0, Math.round(Number(body.coinBonus || 0))),
    isActive: Boolean(body.isActive ?? true),
  };
}

function serializeBadge(badge: any, earnedCount = 0) {
  return {
    id: String(badge._id),
    title: badge.title || "",
    description: badge.description || "",
    icon: badge.icon || "Award",
    rarity: badge.rarity || "common",
    metricLabel: badge.metricLabel || "",
    targetValue: Number(badge.targetValue || 0),
    xpBonus: Number(badge.xpBonus || 0),
    coinBonus: Number(badge.coinBonus || 0),
    isActive: Boolean(badge.isActive),
    earnedCount,
    createdAt: badge.createdAt || null,
    updatedAt: badge.updatedAt || null,
  };
}

async function getEarnedCountMap() {
  const counts = await UserBadge.aggregate<{ _id: unknown; count: number }>([
    { $group: { _id: "$badgeId", count: { $sum: 1 } } },
  ]);

  return new Map(counts.map((row) => [String(row._id), row.count]));
}

export async function GET() {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    await connectMongoDB();

    const [badges, earnedCountMap] = await Promise.all([
      Badge.find({}).sort({ createdAt: -1 }).lean(),
      getEarnedCountMap(),
    ]);

    return NextResponse.json({
      badges: badges.map((badge) =>
        serializeBadge(badge, earnedCountMap.get(String(badge._id)) || 0)
      ),
      stats: {
        totalBadges: badges.length,
        activeBadges: badges.filter((badge) => badge.isActive).length,
        totalEarned: [...earnedCountMap.values()].reduce(
          (sum, value) => sum + value,
          0
        ),
      },
    });
  } catch (error) {
    console.error("Fetch admin badges error:", error);
    return NextResponse.json(
      { message: "Failed to fetch badges." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const body = await request.json().catch(() => ({}));
    const input = sanitizeBadgeInput(body);

    if (input.title.length < 3) {
      return NextResponse.json(
        { message: "Badge title must be at least 3 characters." },
        { status: 400 }
      );
    }

    if (input.description.length < 10) {
      return NextResponse.json(
        { message: "Badge description must be at least 10 characters." },
        { status: 400 }
      );
    }

    if (!input.metricLabel) {
      return NextResponse.json(
        { message: "Metric label is required." },
        { status: 400 }
      );
    }

    await connectMongoDB();

    const badge = await Badge.create(input);

    await logActivity({
      actionType: "BADGE_CREATED",
      message: `Admin created badge: ${badge.title}`,
      targetId: String(badge._id),
    });

    return NextResponse.json(
      {
        success: true,
        message: "Badge created.",
        badge: serializeBadge(badge, 0),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create badge error:", error);
    return NextResponse.json(
      { message: "Failed to create badge." },
      { status: 500 }
    );
  }
}
