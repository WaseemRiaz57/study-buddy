import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";
import { authOptions } from "@/lib/authOptions";
import { awardUser } from "@/lib/gamificationEngine";
import { connectMongoDB } from "@/lib/mongodb";
import UsageCounter from "@/models/UsageCounter";

function startOfCurrentHalfHour() {
  const now = new Date();
  now.setMinutes(now.getMinutes() < 30 ? 0 : 30, 0, 0);
  return now;
}

export async function PATCH() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || !mongoose.Types.ObjectId.isValid(session.user.id)) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await connectMongoDB();

    const windowStart = startOfCurrentHalfHour();
    const usage = await UsageCounter.findOneAndUpdate(
      {
        userId: new mongoose.Types.ObjectId(session.user.id),
        feature: "active_time_30_min_reward",
        windowStart,
      },
      {
        $inc: { count: 1 },
        $setOnInsert: {
          userId: new mongoose.Types.ObjectId(session.user.id),
          feature: "active_time_30_min_reward",
          windowStart,
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).lean();

    if (Number(usage?.count || 0) > 1) {
      return NextResponse.json({
        awarded: false,
        message: "Active time reward already claimed for this window.",
      });
    }

    const reward = await awardUser(session.user.id, "ACTIVE_TIME_30_MIN", {
      xp: 10,
      coins: 0,
    });

    return NextResponse.json({
      awarded: reward.xpAwarded > 0 || reward.coinsAwarded > 0,
      reward,
      stats: reward.profile,
    });
  } catch (error) {
    console.error("Active time reward error:", error);
    return NextResponse.json(
      { message: "Failed to award active time reward." },
      { status: 500 }
    );
  }
}
