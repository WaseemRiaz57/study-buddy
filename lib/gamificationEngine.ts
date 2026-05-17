import mongoose from "mongoose";
import { connectMongoDB } from "@/lib/mongodb";
import MentorProfile from "@/models/MentorProfile";
import Notification from "@/models/Notification";
import StudentProfile from "@/models/StudentProfile";
import User from "@/models/User";
import UserProgress from "@/models/UserProgress";

export type GamificationActionType =
  | "COMPLETED_SESSION"
  | "CREATED_POST"
  | "CREATED_COMMENT"
  | "DAILY_LOGIN"
  | "CHALLENGE_COMPLETED";

type RewardDefinition = {
  xp: number;
  coins: number;
};

export const REWARD_DICTIONARY: Record<GamificationActionType, RewardDefinition> = {
  COMPLETED_SESSION: { xp: 100, coins: 20 },
  CREATED_POST: { xp: 10, coins: 2 },
  CREATED_COMMENT: { xp: 5, coins: 1 },
  DAILY_LOGIN: { xp: 5, coins: 5 },
  CHALLENGE_COMPLETED: { xp: 0, coins: 0 },
};

export const STREAK_FREEZE_COST = 200;

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

function missedAtLeastOneDay(lastActiveDate: Date | null, today: Date) {
  if (!lastActiveDate) return false;
  return !isSameDay(lastActiveDate, today) && !isYesterday(lastActiveDate, today);
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
  actionType: GamificationActionType,
  rewardOverride?: Partial<RewardDefinition>
) {
  const baseReward = REWARD_DICTIONARY[actionType];

  if (!baseReward) {
    throw new Error(`Unsupported gamification action: ${actionType}`);
  }

  const reward = {
    xp: Math.max(0, Math.round(Number(rewardOverride?.xp ?? baseReward.xp))),
    coins: Math.max(0, Math.round(Number(rewardOverride?.coins ?? baseReward.coins))),
  };

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
    .select("xp weeklyXP monthlyXP coins streak streakFreezes lastActiveDate")
    .lean();

  const currentStreak = Number(currentProfile?.streak || 0);
  const currentFreezes = Number(currentProfile?.streakFreezes || 0);
  const lastActiveDate = currentProfile?.lastActiveDate
    ? new Date(currentProfile.lastActiveDate)
    : null;
  const shouldUseFreeze =
    actionType === "DAILY_LOGIN" &&
    missedAtLeastOneDay(lastActiveDate, today) &&
    currentFreezes > 0;
  const nextStreak = shouldUseFreeze
    ? Math.max(1, currentStreak)
    : calculateNextStreak(lastActiveDate, currentStreak, today);
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
      $inc: {
        xp: earned.xp,
        weeklyXP: earned.xp,
        monthlyXP: earned.xp,
        coins: earned.coins,
        ...(shouldUseFreeze ? { streakFreezes: -1 } : {}),
      },
      $set: { streak: nextStreak, lastActiveDate: today },
    },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  ).lean();

  await syncUserProgress({
    userKey: String(user.email || userId),
    xp: earned.xp,
    today,
  });

  if (shouldUseFreeze) {
    await Notification.create({
      userId: userObjectId,
      recipientId: userObjectId,
      senderId: null,
      type: "system",
      title: "Streak Freeze Used",
      message: "Streak saved by Freeze!",
      read: false,
      metadata: {
        actionType,
        streak: nextStreak,
      },
    });
  }

  return {
    actionType,
    xpAwarded: earned.xp,
    coinsAwarded: earned.coins,
    multiplier: earned.multiplier,
    alreadyClaimed: alreadyClaimedDailyLogin,
    streakFreezeUsed: shouldUseFreeze,
    message: shouldUseFreeze ? "Streak saved by Freeze!" : "",
    profile: {
      xp: Number(profile?.xp || 0),
      weeklyXP: Number(profile?.weeklyXP || 0),
      monthlyXP: Number(profile?.monthlyXP || 0),
      coins: Number(profile?.coins || 0),
      streak: Number(profile?.streak || 0),
      streakFreezes: Number(profile?.streakFreezes || 0),
      lastActiveDate: profile?.lastActiveDate || today,
    },
  };
}

export async function purchaseStreakFreeze(userId: string) {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new Error("Valid user id is required.");
  }

  await connectMongoDB();

  const user = await User.findById(userId).select("role").lean();

  if (!user) {
    throw new Error("User not found.");
  }

  const normalizedRole = String(user.role || "student").toLowerCase();
  const ProfileModel = normalizedRole === "mentor" ? MentorProfile : StudentProfile;
  const userObjectId = new mongoose.Types.ObjectId(userId);
  const profile = await ProfileModel.findOneAndUpdate(
    {
      userId: userObjectId,
      coins: { $gte: STREAK_FREEZE_COST },
    },
    {
      $inc: {
        coins: -STREAK_FREEZE_COST,
        streakFreezes: 1,
      },
      $setOnInsert: { userId: userObjectId },
    },
    { new: true, runValidators: true, setDefaultsOnInsert: true }
  ).lean();

  if (!profile) {
    const existingProfile = await ProfileModel.findOne({ userId: userObjectId })
      .select("coins")
      .lean();

    if (!existingProfile) {
      await ProfileModel.create({ userId: userObjectId });
    }

    throw new Error("Not enough coins to buy a Streak Freeze.");
  }

  return {
    cost: STREAK_FREEZE_COST,
    profile: {
      xp: Number(profile.xp || 0),
      coins: Number(profile.coins || 0),
      streak: Number(profile.streak || 0),
      streakFreezes: Number(profile.streakFreezes || 0),
      lastActiveDate: profile.lastActiveDate || null,
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
    .select("xp weeklyXP monthlyXP coins streak streakFreezes lastActiveDate")
    .lean();

  return {
    xp: Number(profile?.xp || 0),
    weeklyXP: Number(profile?.weeklyXP || 0),
    monthlyXP: Number(profile?.monthlyXP || 0),
    coins: Number(profile?.coins || 0),
    streak: Number(profile?.streak || 0),
    streakFreezes: Number(profile?.streakFreezes || 0),
    level: Math.floor(Number(profile?.xp || 0) / 1000) + 1,
    nextLevelXp: (Math.floor(Number(profile?.xp || 0) / 1000) + 1) * 1000,
    role: normalizedRole,
    lastActiveDate: profile?.lastActiveDate || null,
  };
}
