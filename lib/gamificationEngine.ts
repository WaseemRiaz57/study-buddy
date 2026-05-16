import mongoose from "mongoose";
import { connectMongoDB } from "@/lib/mongodb";
import MentorProfile from "@/models/MentorProfile";
import StudentProfile from "@/models/StudentProfile";
import User from "@/models/User";
import UserProgress from "@/models/UserProgress";

export type GamificationActionType =
  | "COMPLETED_SESSION"
  | "CREATED_POST"
  | "CREATED_COMMENT"
  | "DAILY_LOGIN";

type RewardDefinition = {
  xp: number;
  coins: number;
};

export const REWARD_DICTIONARY: Record<GamificationActionType, RewardDefinition> = {
  COMPLETED_SESSION: { xp: 100, coins: 20 },
  CREATED_POST: { xp: 10, coins: 2 },
  CREATED_COMMENT: { xp: 5, coins: 1 },
  DAILY_LOGIN: { xp: 5, coins: 5 },
};

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function isSameDay(a: Date, b: Date) {
  return startOfDay(a).getTime() === startOfDay(b).getTime();
}

function isYesterday(date: Date, today: Date) {
  const yesterday = startOfDay(today);
  yesterday.setDate(yesterday.getDate() - 1);
  return startOfDay(date).getTime() === yesterday.getTime();
}

function calculateNextStreak(lastActiveDate: Date | null, currentStreak: number, today: Date) {
  if (!lastActiveDate) {
    return 1;
  }

  if (isSameDay(lastActiveDate, today)) {
    return Math.max(1, currentStreak);
  }

  if (isYesterday(lastActiveDate, today)) {
    return Math.max(0, currentStreak) + 1;
  }

  return 0;
}

function applyStreakMultiplier(reward: RewardDefinition, nextStreak: number) {
  const multiplier = nextStreak >= 7 ? 1.2 : 1;

  return {
    xp: Math.round(reward.xp * multiplier),
    coins: Math.round(reward.coins * multiplier),
    multiplier,
  };
}

async function syncUserProgress({
  userKey,
  xp,
  today,
}: {
  userKey: string;
  xp: number;
  today: Date;
}) {
  if (!userKey || xp <= 0) return null;

  const progress = await UserProgress.findOneAndUpdate(
    { userId: userKey },
    {
      $inc: { xp },
      $set: { lastActiveDate: today },
      $setOnInsert: { todayMinutes: 0, level: 1 },
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  progress.level = Math.floor(progress.xp / 1000) + 1;
  await progress.save();

  return progress;
}

export async function awardUser(
  userId: string,
  actionType: GamificationActionType
) {
  const reward = REWARD_DICTIONARY[actionType];

  if (!reward) {
    throw new Error(`Unsupported gamification action: ${actionType}`);
  }

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new Error("Valid user id is required for gamification awards.");
  }

  await connectMongoDB();

  const user = await User.findById(userId).select("email role").lean();

  if (!user) {
    throw new Error("User not found for gamification award.");
  }

  const normalizedRole = String(user.role || "student").toLowerCase();
  const ProfileModel = normalizedRole === "mentor" ? MentorProfile : StudentProfile;
  const today = new Date();
  const userObjectId = new mongoose.Types.ObjectId(userId);
  const currentProfile = await ProfileModel.findOne({ userId: userObjectId })
    .select("xp coins streak lastActiveDate")
    .lean();

  const currentStreak = Number(currentProfile?.streak || 0);
  const lastActiveDate = currentProfile?.lastActiveDate
    ? new Date(currentProfile.lastActiveDate)
    : null;
  const nextStreak = calculateNextStreak(lastActiveDate, currentStreak, today);
  const alreadyClaimedDailyLogin =
    actionType === "DAILY_LOGIN" &&
    Boolean(lastActiveDate && isSameDay(lastActiveDate, today));
  const earned = alreadyClaimedDailyLogin
    ? { xp: 0, coins: 0, multiplier: nextStreak >= 7 ? 1.2 : 1 }
    : applyStreakMultiplier(reward, nextStreak);

  const profile = await ProfileModel.findOneAndUpdate(
    { userId: userObjectId },
    {
      $setOnInsert: { userId: userObjectId },
      $inc: { xp: earned.xp, coins: earned.coins },
      $set: { streak: nextStreak, lastActiveDate: today },
    },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  ).lean();

  await syncUserProgress({
    userKey: String(user.email || userId),
    xp: earned.xp,
    today,
  });

  return {
    actionType,
    xpAwarded: earned.xp,
    coinsAwarded: earned.coins,
    multiplier: earned.multiplier,
    alreadyClaimed: alreadyClaimedDailyLogin,
    profile: {
      xp: Number(profile?.xp || 0),
      coins: Number(profile?.coins || 0),
      streak: Number(profile?.streak || 0),
      lastActiveDate: profile?.lastActiveDate || today,
    },
  };
}

export async function getGamificationStats(userId: string) {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new Error("Valid user id is required.");
  }

  await connectMongoDB();

  const user = await User.findById(userId).select("role").lean();
  const normalizedRole = String(user?.role || "student").toLowerCase();
  const ProfileModel = normalizedRole === "mentor" ? MentorProfile : StudentProfile;
  const profile = await ProfileModel.findOne({
    userId: new mongoose.Types.ObjectId(userId),
  })
    .select("xp coins streak lastActiveDate")
    .lean();

  return {
    xp: Number(profile?.xp || 0),
    coins: Number(profile?.coins || 0),
    streak: Number(profile?.streak || 0),
    level: Math.floor(Number(profile?.xp || 0) / 1000) + 1,
    nextLevelXp: (Math.floor(Number(profile?.xp || 0) / 1000) + 1) * 1000,
    role: normalizedRole,
    lastActiveDate: profile?.lastActiveDate || null,
  };
}
