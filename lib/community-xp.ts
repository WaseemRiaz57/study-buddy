import mongoose from "mongoose";
import MentorProfile from "@/models/MentorProfile";
import StudentProfile from "@/models/StudentProfile";
import UserProgress from "@/models/UserProgress";

export async function awardCommunityXp({
  userId,
  email,
  role,
  xp,
}: {
  userId: string;
  email?: string | null;
  role?: string | null;
  xp: number;
}) {
  if (!mongoose.Types.ObjectId.isValid(userId) || xp <= 0) {
    return;
  }

  const normalizedRole = String(role || "").toLowerCase();
  const userObjectId = new mongoose.Types.ObjectId(userId);
  const updates: Promise<unknown>[] = [
    UserProgress.findOneAndUpdate(
      { userId: email || userId },
      {
        $inc: { xp },
        $set: { lastActiveDate: new Date() },
        $setOnInsert: { todayMinutes: 0, level: 1 },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).then(async (progress) => {
      if (!progress) return;
      progress.level = Math.floor(progress.xp / 1000) + 1;
      await progress.save();
    }),
  ];

  if (normalizedRole === "mentor") {
    updates.push(
      MentorProfile.findOneAndUpdate(
        { userId: userObjectId },
        { $inc: { xp } },
        { new: true }
      )
    );
  } else {
    updates.push(
      StudentProfile.findOneAndUpdate(
        { userId: userObjectId },
        { $inc: { xp } },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      )
    );
  }

  await Promise.allSettled(updates);
}
