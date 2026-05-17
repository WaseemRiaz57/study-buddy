// app/api/focus/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { trackProgress } from "@/lib/challengeTracker";
import { connectMongoDB } from "@/lib/mongodb";
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

    const { minutes } = await req.json(); // Kitne minute focus kiya (e.g., 25)
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
    const challengeProgress = session.user.id
      ? await trackProgress(session.user.id, "focus_room", 1)
      : [];

    return NextResponse.json({ progress, earnedXp, challengeProgress });
  } catch {
    return NextResponse.json({ message: "Error updating focus session" }, { status: 500 });
  }
}
