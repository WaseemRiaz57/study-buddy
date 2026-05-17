import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectMongoDB } from "@/lib/mongodb";
import MentorProfile from "@/models/MentorProfile";
import StudentProfile from "@/models/StudentProfile";
import User from "@/models/User";

export const dynamic = "force-dynamic";

type Timeframe = "weekly" | "monthly" | "all-time";

const LEADERBOARD_LIMIT = 100;

function getInitials(name: string) {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "SB"
  );
}

function normalizeTimeframe(value: string | null): Timeframe {
  const normalized = String(value || "").trim().toLowerCase();

  if (normalized === "weekly") return "weekly";
  if (normalized === "monthly") return "monthly";
  return "all-time";
}

function getScoreField(timeframe: Timeframe) {
  if (timeframe === "weekly") return "weeklyXP";
  if (timeframe === "monthly") return "monthlyXP";
  return "xp";
}

function buildBadges(role: string, streak: number, rank: number) {
  const badges = [];

  if (rank === 1) badges.push("Top Scholar");
  if (role === "mentor") badges.push("Mentor");
  if (streak >= 7) badges.push("Streak King");
  if (streak >= 14) badges.push("Consistency");

  return badges;
}

function normalizeProfile(profile: any, scoreField: string) {
  const user = profile.userId;
  const name = user?.name || "Scholar";
  const score = Number(profile?.[scoreField] || 0);
  const totalXP = Number(profile?.xp || 0);

  if (!user?._id || user.isLeaderboardBanned === true) {
    return null;
  }

  return {
    userId: String(user._id),
    name,
    avatar: user.image || user.profileImage || "",
    initials: getInitials(name),
    role: user.role || "student",
    xp: score,
    totalXP,
    weeklyXP: Number(profile?.weeklyXP || 0),
    monthlyXP: Number(profile?.monthlyXP || 0),
    coins: Number(profile?.coins || 0),
    streak: Number(profile?.streak || 0),
  };
}

function buildRankData(entries: any[], currentUserId: string) {
  const currentIndex = entries.findIndex((entry) => entry.userId === currentUserId);

  if (currentIndex === -1) {
    return {
      rank: entries.length + 1,
      xpToNextRank: entries.length ? Number(entries[entries.length - 1].xp || 0) : 0,
      nextRankXp: entries.length ? Number(entries[entries.length - 1].xp || 0) : 0,
      progressToNextRank: 0,
    };
  }

  const current = entries[currentIndex];
  const nextRankUser = currentIndex > 0 ? entries[currentIndex - 1] : null;
  const nextRankXp = nextRankUser ? Number(nextRankUser.xp || 0) : Number(current.xp || 0);
  const xpToNextRank = nextRankUser
    ? Math.max(0, nextRankXp - Number(current.xp || 0))
    : 0;
  const progressToNextRank = nextRankUser && nextRankXp > 0
    ? Math.min(100, Math.round((Number(current.xp || 0) / nextRankXp) * 100))
    : 100;

  return {
    rank: currentIndex + 1,
    xpToNextRank,
    nextRankXp,
    progressToNextRank,
  };
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await connectMongoDB();

    const { searchParams } = new URL(request.url);
    const timeframe = normalizeTimeframe(
      searchParams.get("timeframe") || searchParams.get("range")
    );
    const scoreField = getScoreField(timeframe);
    const userSelect = "name image profileImage role isLeaderboardBanned";

    const [studentProfiles, mentorProfiles] = await Promise.all([
      StudentProfile.find({})
        .select("userId xp weeklyXP monthlyXP coins streak")
        .populate("userId", userSelect)
        .lean(),
      MentorProfile.find({})
        .select("userId xp weeklyXP monthlyXP coins streak")
        .populate("userId", userSelect)
        .lean(),
    ]);

    const rankedEntries = [...studentProfiles, ...mentorProfiles]
      .map((profile: any) => normalizeProfile(profile, scoreField))
      .filter(Boolean)
      .sort(
        (a: any, b: any) =>
          Number(b.xp || 0) - Number(a.xp || 0) ||
          Number(b.streak || 0) - Number(a.streak || 0) ||
          Number(b.totalXP || 0) - Number(a.totalXP || 0)
      )
      .map((entry: any, index) => ({
        ...entry,
        rank: index + 1,
        badges: buildBadges(entry.role, entry.streak, index + 1),
      }));

    const currentUserId = session.user.id;
    const rankData = buildRankData(rankedEntries, currentUserId);
    let currentUser = rankedEntries.find((entry) => entry.userId === currentUserId);

    if (!currentUser) {
      const user = await User.findById(currentUserId)
        .select("name image profileImage role isLeaderboardBanned")
        .lean();

      if (user && user.isLeaderboardBanned !== true) {
        const name = user.name || session.user.name || "User";
        currentUser = {
          userId: currentUserId,
          name,
          avatar: user.image || user.profileImage || session.user.image || "",
          initials: getInitials(name),
          role: user.role || session.user.role || "student",
          xp: 0,
          totalXP: 0,
          weeklyXP: 0,
          monthlyXP: 0,
          coins: 0,
          streak: 0,
          rank: rankData.rank,
          badges: [],
        };
      }
    }

    return NextResponse.json({
      timeframe,
      leaderboard: rankedEntries.slice(0, LEADERBOARD_LIMIT),
      currentUser: currentUser
        ? {
            ...currentUser,
            rank: rankData.rank,
            xpToNextRank: rankData.xpToNextRank,
            nextRankXp: rankData.nextRankXp,
            progressToNextRank: rankData.progressToNextRank,
          }
        : null,
      currentUserRank: rankData,
    });
  } catch (error) {
    console.error("Fetch leaderboard error:", error);
    return NextResponse.json(
      { message: "Failed to fetch leaderboard." },
      { status: 500 }
    );
  }
}
