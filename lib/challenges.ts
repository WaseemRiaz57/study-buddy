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

type ContributorRecord = {
  userId: string;
  name: string;
  profileImage: string;
  initials: string;
  contributionHours: number;
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

function getInitials(name: string) {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "SB"
  );
}

function toHours(minutes: number) {
  return Math.round((Math.max(0, minutes) / 60) * 10) / 10;
}

export async function getGlobalEventEngagement(currentUserId: string) {
  const activeSince = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const [
    users,
    focusRows,
    mentorRows,
    heartbeatUsers,
    activeStudentProfiles,
    activeMentorProfiles,
  ] =
    await Promise.all([
      User.find({})
        .select("name email image profileImage role lastActive")
        .lean(),
      UserProgress.find({})
        .select("userId todayMinutes")
        .lean(),
      MentorSession.aggregate([
        { $match: { status: "completed" } },
        {
          $project: {
            duration: 1,
            participants: ["$studentId", "$mentorId"],
          },
        },
        { $unwind: "$participants" },
        {
          $group: {
            _id: "$participants",
            minutes: { $sum: "$duration" },
          },
        },
      ]),
      User.find({ lastActive: { $gte: activeSince } })
        .select("_id lastActive")
        .lean(),
      StudentProfile.find({ lastActiveDate: { $gte: activeSince } })
        .select("userId lastActiveDate")
        .lean(),
      MentorProfile.find({ lastActiveDate: { $gte: activeSince } })
        .select("userId lastActiveDate")
        .lean(),
    ]);

  const usersById = new Map(users.map((user: any) => [String(user._id), user]));
  const usersByEmail = new Map(
    users
      .filter((user: any) => user.email)
      .map((user: any) => [String(user.email).toLowerCase(), user])
  );
  const contributionMinutes = new Map<string, number>();

  for (const row of focusRows) {
    const rawKey = String(row.userId || "");
    const user =
      usersById.get(rawKey) || usersByEmail.get(rawKey.toLowerCase());

    if (!user) continue;

    const userId = String(user._id);
    contributionMinutes.set(
      userId,
      (contributionMinutes.get(userId) || 0) + Number(row.todayMinutes || 0)
    );
  }

  for (const row of mentorRows) {
    const userId = String(row._id || "");
    contributionMinutes.set(
      userId,
      (contributionMinutes.get(userId) || 0) + Number(row.minutes || 0)
    );
  }

  const contributors: ContributorRecord[] = [...contributionMinutes.entries()]
    .map(([userId, minutes]) => {
      const user = usersById.get(userId);
      const name = user?.name || "Scholar";

      return {
        userId,
        name,
        profileImage: user?.profileImage || user?.image || "",
        initials: getInitials(name),
        contributionHours: toHours(minutes),
      };
    })
    .filter((entry) => entry.contributionHours > 0)
    .sort((a, b) => b.contributionHours - a.contributionHours);

  const activeMap = new Map<string, Date>();

  for (const user of heartbeatUsers) {
    activeMap.set(String(user._id), new Date(user.lastActive || activeSince));
  }

  for (const profile of [...activeStudentProfiles, ...activeMentorProfiles]) {
    const userId = String(profile.userId || "");
    const profileDate = new Date(profile.lastActiveDate || activeSince);
    const existingDate = activeMap.get(userId);

    if (!existingDate || profileDate > existingDate) {
      activeMap.set(userId, profileDate);
    }
  }

  const activeUsers = [...activeMap.entries()]
    .map(([userId, lastActive]) => ({
      user: usersById.get(userId),
      lastActive,
    }))
    .filter((entry) => entry.user)
    .sort((a, b) => b.lastActive.getTime() - a.lastActive.getTime());

  const squadOnline = activeUsers.slice(0, 10).map(({ user, lastActive }) => {
    const name = user.name || "Scholar";

    return {
      id: String(user._id),
      name,
      profileImage: user.profileImage || user.image || "",
      initials: getInitials(name),
      lastActive,
    };
  });

  return {
    squadOnline,
    activeCount: activeUsers.length,
    topContributors: contributors.slice(0, 5).map((entry, index) => ({
      ...entry,
      rank: index + 1,
    })),
    contributorCount: contributors.length,
    currentUserContribution:
      contributors.find((entry) => entry.userId === currentUserId)
        ?.contributionHours || 0,
  };
}

export function buildPersonalRewardMilestones(
  personalContribution: number,
  globalTarget: number
) {
  const baseTarget = Math.max(1, Number(globalTarget || 0));
  const bronzeHours = Math.max(1, Math.ceil(baseTarget / 40000));
  const silverHours = Math.max(bronzeHours + 1, Math.ceil(baseTarget / 20000));
  const goldHours = Math.max(silverHours + 1, Math.ceil(baseTarget / 10000));

  return [
    { tier: "Bronze", hours: bronzeHours },
    { tier: "Silver", hours: silverHours },
    { tier: "Gold", hours: goldHours },
  ].map((milestone) => ({
    ...milestone,
    unlocked: personalContribution >= milestone.hours,
  }));
}

export function buildGlobalMilestones(globalTarget: number) {
  const target = Math.max(1, Number(globalTarget || 0));
  const fractions = [0.25, 0.5, 0.75, 1];

  return fractions.map((fraction) => {
    const value = Math.round(target * fraction);

    return {
      label:
        value >= 1000000
          ? `${Number((value / 1000000).toFixed(1))}M`
          : value >= 1000
            ? `${Math.round(value / 1000)}K`
            : value.toLocaleString(),
      value,
      percentage: Math.round(fraction * 100),
    };
  });
}

export function getProgressPercentage(currentValue: number, targetMetric: number) {
  if (!targetMetric || targetMetric <= 0) return 0;

  return Math.min(100, Math.round((currentValue / targetMetric) * 100));
}
