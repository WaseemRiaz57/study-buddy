import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { awardUser, getGamificationStats } from "@/lib/gamificationEngine";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const stats = await getGamificationStats(session.user.id);

    return NextResponse.json({ stats });
  } catch (error) {
    console.error("Fetch gamification stats error:", error);
    return NextResponse.json(
      { message: "Failed to fetch gamification stats." },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const reward = await awardUser(session.user.id, "DAILY_LOGIN");

    return NextResponse.json({ reward, stats: reward.profile });
  } catch (error) {
    console.error("Daily login reward error:", error);
    return NextResponse.json(
      { message: "Failed to process daily login reward." },
      { status: 500 }
    );
  }
}


