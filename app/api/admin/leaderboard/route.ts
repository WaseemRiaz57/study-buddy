import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";
import { authOptions } from "@/lib/authOptions";
import { logActivity } from "@/lib/logActivity";
import { connectMongoDB } from "@/lib/mongodb";
import MentorProfile from "@/models/MentorProfile";
import StudentProfile from "@/models/StudentProfile";
import User from "@/models/User";

export const dynamic = "force-dynamic";

type Timeframe = "weekly" | "monthly" | "all-time";
type AdminRoleFilter = "students" | "mentors" | "all";

function isAdminRole(role: unknown) {
  return String(role ?? "").toLowerCase() === "admin";
}

function normalizeTimeframe(value: string | null): Timeframe {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "weekly") return "weekly";
  if (normalized === "monthly") return "monthly";
  if (
    normalized === "all time" ||
    normalized === "all-time" ||
    normalized === "all_time"
  ) {
    return "all-time";
  }
  return "all-time";
}

function normalizeRole(value: string | null): AdminRoleFilter {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "students" || normalized === "student") return "students";
  if (
    normalized === "mentors" ||
    normalized === "mentor"
  ) {
    return "mentors";
  }
  return "all";
}

function getScoreField(timeframe: Timeframe) {
  if (timeframe === "weekly") return "weeklyXP";
  if (timeframe === "monthly") return "monthlyXP";
  return "xp";
}

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

function serializeProfile(profile: any, scoreField: string, rank: number) {
  const user = profile.userId || {};
  const name = user.name || "Unknown User";
  const totalXP = Number(profile.xp || 0);
  const timeframeXP = Number(profile[scoreField] || 0);
  const trendDelta = Math.abs(Number(profile.weeklyXP || 0) - Number(profile.monthlyXP || 0));

  return {
    id: String(user._id || ""),
    profileId: String(profile._id || ""),
    rank,
    name,
    avatar: user.image || user.profileImage || "",
    initials: getInitials(name),
    role: user.role || "student",
    totalXP,
    timeframeXP,
    weeklyXP: Number(profile.weeklyXP || 0),
    monthlyXP: Number(profile.monthlyXP || 0),
    streak: Number(profile.streak || 0),
    trend: Number(profile.weeklyXP || 0) >= 0 ? "up" : "down",
    trendDelta,
    flagged: user.isLeaderboardBanned === true,
  };
}

export async function GET(request: Request) {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    await connectMongoDB();

    const { searchParams } = new URL(request.url);
    const timeframe = normalizeTimeframe(searchParams.get("timeframe"));
    const role = normalizeRole(searchParams.get("role"));
    const scoreField = getScoreField(timeframe);
    const userSelect = "name image profileImage role isLeaderboardBanned";

    const profileQueries: Promise<any[]>[] = [];

    if (role === "students" || role === "all") {
      profileQueries.push(
        StudentProfile.find({})
          .select("userId xp weeklyXP monthlyXP streak")
          .populate("userId", userSelect)
          .lean()
      );
    }

    if (role === "mentors" || role === "all") {
      profileQueries.push(
        MentorProfile.find({})
          .select("userId xp weeklyXP monthlyXP streak")
          .populate("userId", userSelect)
          .lean()
      );
    }

    const profileGroups = await Promise.all(profileQueries);
    const profiles = profileGroups.flat().filter((profile) => profile.userId);
    const sorted = profiles.sort(
      (a, b) =>
        Number(b[scoreField] || 0) - Number(a[scoreField] || 0) ||
        Number(b.xp || 0) - Number(a.xp || 0) ||
        Number(b.streak || 0) - Number(a.streak || 0)
    );
    const leaderboard = sorted
      .slice(0, 100)
      .map((profile, index) => serializeProfile(profile, scoreField, index + 1));
    const totalXP = profiles.reduce(
      (sum, profile) => sum + Number(profile[scoreField] || 0),
      0
    );
    const activeStreaks = profiles.filter((profile) => Number(profile.streak || 0) > 0)
      .length;
    const flagged = profiles.filter(
      (profile) => profile.userId?.isLeaderboardBanned === true
    ).length;

    return NextResponse.json({
      leaderboard,
      stats: {
        totalXP,
        activeStreaks,
        flagged,
      },
    });
  } catch (error) {
    console.error("Fetch admin leaderboard error:", error);
    return NextResponse.json(
      { message: "Failed to fetch leaderboard data." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const { error, session } = await requireAdmin();
    if (error) return error;

    const body = await request.json().catch(() => ({}));
    const userId = String(body.userId || "").trim();
    const action = String(body.action || "adjust-xp").trim();

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json(
        { message: "Valid user id is required." },
        { status: 400 }
      );
    }

    await connectMongoDB();

    const user = await User.findById(userId).select("name role email").lean();

    if (!user) {
      return NextResponse.json({ message: "User not found." }, { status: 404 });
    }

    if (action === "remove") {
      await User.findByIdAndUpdate(userId, { isLeaderboardBanned: true });
      await logActivity({
        actionType: "LEADERBOARD_USER_REMOVED",
        message: `Admin removed ${user.name || user.email || "a user"} from the leaderboard`,
        targetId: userId,
      });

      return NextResponse.json({
        success: true,
        message: "User removed from leaderboard.",
      });
    }

    const ProfileModel =
      String(user.role || "").toLowerCase() === "mentor"
        ? MentorProfile
        : StudentProfile;
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const profile = await ProfileModel.findOne({ userId: userObjectId })
      .select("xp weeklyXP monthlyXP")
      .lean();
    const currentXP = Number(profile?.xp || 0);
    const currentWeeklyXP = Number(profile?.weeklyXP || 0);
    const currentMonthlyXP = Number(profile?.monthlyXP || 0);
    const requestedNewXP = Number(body.newXP);
    const requestedDelta = Number(body.xpDelta);
    const hasNewXP = Number.isFinite(requestedNewXP);
    const hasDelta = Number.isFinite(requestedDelta);

    if (!hasNewXP && !hasDelta) {
      return NextResponse.json(
        { message: "A new XP total or XP adjustment is required." },
        { status: 400 }
      );
    }

    const newXP = Math.max(
      0,
      Math.floor(hasNewXP ? requestedNewXP : currentXP + requestedDelta)
    );
    const xpDifference = newXP - currentXP;
    const updatedWeeklyXP = Math.max(0, currentWeeklyXP + xpDifference);
    const updatedMonthlyXP = Math.max(0, currentMonthlyXP + xpDifference);

    await ProfileModel.findOneAndUpdate(
      { userId: userObjectId },
      {
        $set: {
          userId: userObjectId,
          xp: newXP,
          weeklyXP: updatedWeeklyXP,
          monthlyXP: updatedMonthlyXP,
        },
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    );

    await logActivity({
      actionType: "LEADERBOARD_XP_ADJUSTED",
      message: `Admin set ${user.name || user.email || "a user"} to ${newXP} XP (${xpDifference >= 0 ? "+" : ""}${xpDifference})`,
      targetId: userId,
    });

    return NextResponse.json({
      success: true,
      message: "XP updated successfully.",
      xp: newXP,
      weeklyXP: updatedWeeklyXP,
      monthlyXP: updatedMonthlyXP,
      xpDifference,
      adminId: session?.user?.id || "",
    });
  } catch (error) {
    console.error("Admin leaderboard action error:", error);
    return NextResponse.json(
      { message: "Failed to update leaderboard." },
      { status: 500 }
    );
  }
}


