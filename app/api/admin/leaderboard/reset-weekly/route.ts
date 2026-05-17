import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { logActivity } from "@/lib/logActivity";
import { connectMongoDB } from "@/lib/mongodb";
import MentorProfile from "@/models/MentorProfile";
import StudentProfile from "@/models/StudentProfile";

export const dynamic = "force-dynamic";

function isAdminRole(role: unknown) {
  return String(role ?? "").toLowerCase() === "admin";
}

export async function POST() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (!isAdminRole(session.user.role)) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    await connectMongoDB();

    const [students, mentors] = await Promise.all([
      StudentProfile.updateMany({}, { $set: { weeklyXP: 0 } }),
      MentorProfile.updateMany({}, { $set: { weeklyXP: 0 } }),
    ]);

    await logActivity({
      actionType: "LEADERBOARD_WEEKLY_RESET",
      message: "Admin reset the weekly leaderboard",
      targetId: session.user.id,
    });

    return NextResponse.json({
      success: true,
      message: "Weekly leaderboard reset.",
      modifiedCount:
        Number(students.modifiedCount || 0) + Number(mentors.modifiedCount || 0),
    });
  } catch (error) {
    console.error("Reset weekly leaderboard error:", error);
    return NextResponse.json(
      { message: "Failed to reset weekly leaderboard." },
      { status: 500 }
    );
  }
}
