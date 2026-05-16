import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";
import { authOptions } from "@/lib/authOptions";
import { connectMongoDB } from "@/lib/mongodb";
import MentorProfile from "@/models/MentorProfile";
import StudentProfile from "@/models/StudentProfile";
import User from "@/models/User";

export const dynamic = "force-dynamic";

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

function buildBadges(role: string, streak: number, rank: number) {
  const badges = [];

  if (rank === 1) badges.push("Top Scholar");
  if (role === "mentor") badges.push("Mentor");
  if (streak >= 7) badges.push("Streak King");
  if (streak >= 14) badges.push("Consistency");

  return badges;
}

function normalizeProfile(profile: any, user: any) {
  const name = user?.name || "Scholar";

  return {
    userId: String(user?._id || profile.userId || ""),
    name,
    avatar: user?.image || user?.profileImage || "",
    initials: getInitials(name),
    role: user?.role || "student",
    xp: Number(profile?.xp || 0),
    coins: Number(profile?.coins || 0),
    streak: Number(profile?.streak || 0),
  };
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await connectMongoDB();

    const [studentProfiles, mentorProfiles] = await Promise.all([
      StudentProfile.find({})
        .select("userId xp coins streak")
        .populate("userId", "name image profileImage role")
        .lean(),
      MentorProfile.find({})
        .select("userId xp coins streak")
        .populate("userId", "name image profileImage role")
        .lean(),
    ]);

    const entries = [...studentProfiles, ...mentorProfiles]
      .map((profile: any) => normalizeProfile(profile, profile.userId))
      .filter((entry) => entry.userId)
      .sort((a, b) => b.xp - a.xp || b.streak - a.streak)
      .map((entry, index) => ({
        ...entry,
        rank: index + 1,
        badges: buildBadges(entry.role, entry.streak, index + 1),
      }));

    const currentUserId = session.user.id;
    let currentUser = entries.find((entry) => entry.userId === currentUserId);

    if (!currentUser && mongoose.Types.ObjectId.isValid(currentUserId)) {
      const user = await User.findById(currentUserId)
        .select("name image profileImage role")
        .lean();
      currentUser = {
        userId: currentUserId,
        name: user?.name || session.user.name || "User",
        avatar: user?.image || user?.profileImage || session.user.image || "",
        initials: getInitials(user?.name || session.user.name || "User"),
        role: user?.role || session.user.role || "student",
        xp: 0,
        coins: 0,
        streak: 0,
        rank: entries.length + 1,
        badges: [],
      };
    }

    return NextResponse.json({
      leaderboard: entries.slice(0, 50),
      currentUser,
    });
  } catch (error) {
    console.error("Fetch leaderboard error:", error);
    return NextResponse.json(
      { message: "Failed to fetch leaderboard." },
      { status: 500 }
    );
  }
}
