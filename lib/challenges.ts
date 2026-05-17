import mongoose from "mongoose";
import MentorProfile from "@/models/MentorProfile";
import MentorSession from "@/models/MentorSession";
import StudentProfile from "@/models/StudentProfile";
import User from "@/models/User";
import UserProgress from "@/models/UserProgress";

export const ELITE_CHALLENGES_COST = 500;

type ProfileDocument = {
  _id?: mongoose.Types.ObjectId;
  xp?: number;
  weeklyXP?: number;
  monthlyXP?: number;
  coins?: number;
  streak?: number;
  hasEliteChallenges?: boolean;
};

export function getProfileModelForRole(role: unknown) {
  return String(role || "student").toLowerCase() === "mentor"
    ? MentorProfile
    : StudentProfile;
}

export async function getUserAndProfile(userId: string) {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return { user: null, profile: null, ProfileModel: StudentProfile };
  }

  const user = await User.findById(userId).select("name email role").lean();
  const ProfileModel = getProfileModelForRole(user?.role);
  const profile = user
    ? await ProfileModel.findOne({
        userId: new mongoose.Types.ObjectId(userId),
      })
        .select("xp weeklyXP monthlyXP coins streak hasEliteChallenges")
        .lean<ProfileDocument>()
    : null;

  return { user, profile, ProfileModel };
}

export function getProfileStats(profile: ProfileDocument | null) {
  const xp = Number(profile?.xp || 0);

  return {
    xp,
    weeklyXP: Number(profile?.weeklyXP || 0),
    monthlyXP: Number(profile?.monthlyXP || 0),
    coins: Number(profile?.coins || 0),
    streak: Number(profile?.streak || 0),
    level: Math.floor(xp / 1000) + 1,
    nextLevelXp: (Math.floor(xp / 1000) + 1) * 1000,
    hasEliteChallenges: Boolean(profile?.hasEliteChallenges),
  };
}

export async function calculateGlobalStudyHours() {
  const [mentorSessionTotals, progressTotals] = await Promise.all([
    MentorSession.aggregate([
      { $match: { status: "completed" } },
      { $group: { _id: null, minutes: { $sum: "$duration" } } },
    ]),
    UserProgress.aggregate([
      { $group: { _id: null, minutes: { $sum: "$todayMinutes" } } },
    ]),
  ]);

  const mentorMinutes = Number(mentorSessionTotals?.[0]?.minutes || 0);
  const focusMinutes = Number(progressTotals?.[0]?.minutes || 0);

  return Math.round(((mentorMinutes + focusMinutes) / 60) * 10) / 10;
}

export function getProgressPercentage(currentValue: number, targetMetric: number) {
  if (!targetMetric || targetMetric <= 0) return 0;

  return Math.min(100, Math.round((currentValue / targetMetric) * 100));
}
