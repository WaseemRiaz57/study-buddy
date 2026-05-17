import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { logActivity } from "@/lib/logActivity";
import { connectMongoDB } from "@/lib/mongodb";
import Challenge, { type ChallengeType } from "@/models/Challenge";
import Notification from "@/models/Notification";
import User from "@/models/User";
import UserChallengeProgress from "@/models/UserChallengeProgress";

export const dynamic = "force-dynamic";

const CHALLENGE_TYPES: ChallengeType[] = ["daily", "weekly", "global", "elite"];

function isAdminRole(role: unknown) {
  return String(role ?? "").toLowerCase() === "admin";
}

async function requireAdmin() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return {
      session: null,
      error: NextResponse.json({ message: "Unauthorized" }, { status: 401 }),
    };
  }

  if (!isAdminRole(session.user.role)) {
    return {
      session: null,
      error: NextResponse.json({ message: "Forbidden" }, { status: 403 }),
    };
  }

  return { session, error: null };
}

function normalizeType(value: unknown): ChallengeType {
  const normalized = String(value || "").trim().toLowerCase();
  return CHALLENGE_TYPES.includes(normalized as ChallengeType)
    ? (normalized as ChallengeType)
    : "daily";
}

function normalizeChallengePayload(body: any) {
  const title = String(body.title || "").trim();
  const description = String(body.description || "").trim();
  const type = normalizeType(body.type);
  const targetMetric = Math.max(1, Math.floor(Number(body.targetMetric || 1)));
  const metricLabel = String(body.metricLabel || "items").trim().slice(0, 40);
  const xpReward = Math.max(0, Math.floor(Number(body.xpReward || 0)));
  const coinsReward = Math.max(0, Math.floor(Number(body.coinsReward || 0)));
  const isActive =
    typeof body.isActive === "boolean" ? body.isActive : true;

  return {
    title,
    description,
    type,
    targetMetric,
    metricLabel: metricLabel || "items",
    xpReward,
    coinsReward,
    isActive,
  };
}

function validateChallengePayload(payload: ReturnType<typeof normalizeChallengePayload>) {
  if (payload.title.length < 3 || payload.title.length > 140) {
    return "Title must be between 3 and 140 characters.";
  }

  if (payload.description.length < 5 || payload.description.length > 500) {
    return "Description must be between 5 and 500 characters.";
  }

  return "";
}

function serializeChallenge(challenge: any, completions: number, totalEligible: number) {
  const completionPercentage =
    totalEligible > 0
      ? Math.min(100, Math.round((completions / totalEligible) * 100))
      : 0;

  return {
    id: String(challenge._id),
    title: challenge.title || "",
    description: challenge.description || "",
    type: challenge.type || "daily",
    targetMetric: Number(challenge.targetMetric || 1),
    metricLabel: challenge.metricLabel || "items",
    xpReward: Number(challenge.xpReward || 0),
    coinsReward: Number(challenge.coinsReward || 0),
    isActive: Boolean(challenge.isActive),
    completions,
    totalEligible,
    completionPercentage,
    xpDistributed: Number(challenge.xpReward || 0) * completions,
    createdAt: challenge.createdAt || null,
    updatedAt: challenge.updatedAt || null,
  };
}

export async function GET() {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    await connectMongoDB();

    const [challenges, completedProgress, totalEligible] = await Promise.all([
      Challenge.find({}).sort({ createdAt: -1 }).lean(),
      UserChallengeProgress.find({ isCompleted: true })
        .select("challengeId")
        .lean(),
      User.countDocuments({
        role: { $ne: "admin" },
        status: { $ne: "suspended" },
      }),
    ]);

    const completionMap = new Map<string, number>();

    for (const progress of completedProgress) {
      const key = String(progress.challengeId || "");
      completionMap.set(key, (completionMap.get(key) || 0) + 1);
    }

    const enrichedChallenges = challenges.map((challenge) =>
      serializeChallenge(
        challenge,
        completionMap.get(String(challenge._id)) || 0,
        totalEligible
      )
    );
    const totalCompletions = completedProgress.length;
    const xpDistributed = enrichedChallenges.reduce(
      (sum, challenge) => sum + challenge.xpDistributed,
      0
    );

    return NextResponse.json({
      stats: {
        activeChallenges: enrichedChallenges.filter(
          (challenge) => challenge.isActive
        ).length,
        totalCompletions,
        xpDistributed,
        totalEligible,
      },
      challenges: enrichedChallenges,
    });
  } catch (error) {
    console.error("Fetch admin challenges error:", error);
    return NextResponse.json(
      { message: "Failed to fetch challenges." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { error, session } = await requireAdmin();
    if (error) return error;

    const body = await request.json().catch(() => ({}));
    const payload = normalizeChallengePayload(body);
    const validationError = validateChallengePayload(payload);

    if (validationError) {
      return NextResponse.json({ message: validationError }, { status: 400 });
    }

    await connectMongoDB();

    const challenge = await Challenge.create(payload);
    const recipients = await User.find({
      role: { $ne: "admin" },
      status: { $ne: "suspended" },
    })
      .select("_id")
      .lean();

    if (recipients.length) {
      await Notification.insertMany(
        recipients.map((user) => ({
          userId: user._id,
          recipientId: user._id,
          senderId: null,
          type: "challenge",
          title: "New Challenge Unlocked! 🏆",
          message: `A new quest: ${challenge.title} is now available. Complete it to earn rewards!`,
          read: false,
          metadata: {
            challengeId: String(challenge._id),
            challengeType: challenge.type,
          },
        })),
        { ordered: false }
      );
    }

    await logActivity({
      actionType: "CHALLENGE_CREATED",
      message: `Admin created a new challenge: ${challenge.title}`,
      targetId: String(challenge._id),
    });

    return NextResponse.json(
      {
        success: true,
        message: "Challenge created successfully.",
        challenge: serializeChallenge(challenge, 0, 0),
        adminId: session?.user?.id || "",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create admin challenge error:", error);
    return NextResponse.json(
      { message: "Failed to create challenge." },
      { status: 500 }
    );
  }
}
