// app/api/focus/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { awardUser } from "@/lib/gamificationEngine";
import { trackProgress } from "@/lib/challengeTracker";
import { connectMongoDB } from "@/lib/mongodb";
import FocusSession from "@/models/FocusSession";
import UserProgress from "@/models/UserProgress";

// 1. User ka data (XP, Level) GET karna
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    await connectMongoDB();
    
    // Check karein agar user ka progress pehle se hai
    let progress = await UserProgress.findOne({ userId: session.user.email });
    
    // Agar naya user hai toh default progress bana dein
    if (!progress) {
      progress = await UserProgress.create({ userId: session.user.email });
    }

    // Naya din shuru ho gaya hai toh aaj ke minutes 0 kar do
    const today = new Date().toDateString();
    const lastActive = new Date(progress.lastActiveDate).toDateString();
    
    if (today !== lastActive) {
      progress.todayMinutes = 0;
      progress.lastActiveDate = new Date();
      await progress.save();
    }

    return NextResponse.json(progress);
  } catch {
    return NextResponse.json({ message: "Error fetching progress" }, { status: 500 });
  }
}

// 2. Timer khatam hone par XP aur Minutes Update karna
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { minutes, taskId, taskTitle } = await req.json(); // Kitne minute focus kiya (e.g., 25)
    const focusMinutes = Number(minutes);

    if (!Number.isInteger(focusMinutes) || focusMinutes < 1 || focusMinutes > 240) {
      return NextResponse.json(
        { message: "minutes must be an integer between 1 and 240." },
        { status: 400 }
      );
    }

    await connectMongoDB();

    const progress = await UserProgress.findOne({ userId: session.user.email });
    if (!progress) return NextResponse.json({ message: "Progress not found" }, { status: 404 });

    // XP calculate karein (1 minute = 10 XP)
    const earnedXp = focusMinutes * 10;
    progress.xp += earnedXp;
    progress.todayMinutes += focusMinutes;
    progress.lastActiveDate = new Date();

    // Level up logic (Har 1000 XP par naya level)
    const newLevel = Math.floor(progress.xp / 1000) + 1;
    progress.level = newLevel;

    await progress.save();
    if (session.user.id) {
      await FocusSession.create({
        userId: session.user.id,
        minutes: focusMinutes,
        taskId: String(taskId || "").slice(0, 100),
        taskTitle: String(taskTitle || "").slice(0, 180),
        completedAt: new Date(),
      });
    }
    const [challengeProgress, reward] = session.user.id
      ? await Promise.all([
          Promise.all([
            trackProgress(session.user.id, "focus_room", 1),
            trackProgress(session.user.id, "focus_minutes", focusMinutes),
          ]).then((results) => results.flat()),
          awardUser(session.user.id, "FOCUS_ROOM_COMPLETE"),
        ])
      : [[], null];

    return NextResponse.json({
      progress,
      earnedXp,
      challengeProgress,
      reward,
      stats: reward?.profile || null,
    });
  } catch {
    return NextResponse.json({ message: "Error updating focus session" }, { status: 500 });
  }
}


