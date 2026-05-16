import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";
import { authOptions } from "@/lib/authOptions";
import {
  purchaseStreakFreeze,
  STREAK_FREEZE_COST,
} from "@/lib/gamificationEngine";
import { logActivity } from "@/lib/logActivity";
import Notification from "@/models/Notification";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const result = await purchaseStreakFreeze(session.user.id);
    const userObjectId = new mongoose.Types.ObjectId(session.user.id);

    await Promise.allSettled([
      Notification.create({
        userId: userObjectId,
        recipientId: userObjectId,
        senderId: null,
        type: "system",
        title: "Streak Freeze Purchased",
        message: `You bought 1 Streak Freeze for ${STREAK_FREEZE_COST} coins.`,
        read: false,
        metadata: {
          cost: STREAK_FREEZE_COST,
          streakFreezes: result.profile.streakFreezes,
        },
      }),
      logActivity({
        actionType: "STREAK_FREEZE_PURCHASED",
        message: `${session.user.name || "A user"} bought a Streak Freeze for ${STREAK_FREEZE_COST} coins`,
        targetId: session.user.id,
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: "Streak Freeze purchased.",
      cost: result.cost,
      stats: result.profile,
    });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Failed to purchase Streak Freeze.",
      },
      { status: 400 }
    );
  }
}
