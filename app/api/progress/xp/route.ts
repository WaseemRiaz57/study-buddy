import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectMongoDB } from "@/lib/mongodb";
import UserProgress from "@/models/UserProgress";

const MAX_XP_AWARD = 1000;

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { xp } = await request.json();
    const xpAward = Number(xp);

    if (!Number.isInteger(xpAward) || xpAward < 1 || xpAward > MAX_XP_AWARD) {
      return NextResponse.json(
        { message: `xp must be an integer between 1 and ${MAX_XP_AWARD}.` },
        { status: 400 }
      );
    }

    await connectMongoDB();

    const progress = await UserProgress.findOneAndUpdate(
      { userId: session.user.email },
      {
        $inc: { xp: xpAward },
        $set: { lastActiveDate: new Date() },
        $setOnInsert: { todayMinutes: 0 },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    progress.level = Math.floor(progress.xp / 1000) + 1;
    await progress.save();

    return NextResponse.json({ progress, earnedXp: xpAward });
  } catch (error) {
    console.error("Award XP error:", error);
    return NextResponse.json(
      { message: "Failed to award XP" },
      { status: 500 }
    );
  }
}


