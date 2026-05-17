import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";
import { authOptions } from "@/lib/authOptions";
import {
  ELITE_CHALLENGES_COST,
  getProfileModelForRole,
} from "@/lib/challenges";
import { logActivity } from "@/lib/logActivity";
import { connectMongoDB } from "@/lib/mongodb";
import User from "@/models/User";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || !mongoose.Types.ObjectId.isValid(session.user.id)) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await connectMongoDB();

    const user = await User.findById(session.user.id).select("name role").lean();

    if (!user) {
      return NextResponse.json({ message: "User not found." }, { status: 404 });
    }

    const userObjectId = new mongoose.Types.ObjectId(session.user.id);
    const ProfileModel = getProfileModelForRole(user.role);
    const existingProfile = await ProfileModel.findOne({ userId: userObjectId })
      .select("coins hasEliteChallenges")
      .lean();

    if (existingProfile?.hasEliteChallenges) {
      return NextResponse.json({
        success: true,
        message: "Elite Challenges are already unlocked.",
        hasEliteChallenges: true,
        coins: Number(existingProfile.coins || 0),
      });
    }

    const profile = await ProfileModel.findOneAndUpdate(
      {
        userId: userObjectId,
        coins: { $gte: ELITE_CHALLENGES_COST },
      },
      {
        $inc: { coins: -ELITE_CHALLENGES_COST },
        $set: { hasEliteChallenges: true },
        $setOnInsert: { userId: userObjectId },
      },
      { new: true, runValidators: true, setDefaultsOnInsert: true }
    ).lean();

    if (!profile) {
      return NextResponse.json(
        { message: "You need 500 coins to unlock Elite Challenges." },
        { status: 400 }
      );
    }

    await logActivity({
      actionType: "ELITE_CHALLENGES_UNLOCKED",
      message: `${user.name || session.user.name || "A user"} unlocked Elite Challenges for ${ELITE_CHALLENGES_COST} coins`,
      targetId: session.user.id,
    });

    return NextResponse.json({
      success: true,
      message: "Elite Challenges unlocked.",
      hasEliteChallenges: true,
      coins: Number(profile.coins || 0),
    });
  } catch (error) {
    console.error("Unlock elite challenges error:", error);
    return NextResponse.json(
      { message: "Failed to unlock Elite Challenges." },
      { status: 500 }
    );
  }
}


