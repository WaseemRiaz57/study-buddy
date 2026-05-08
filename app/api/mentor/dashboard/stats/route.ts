import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";
import { authOptions } from "@/lib/authOptions";
import { connectMongoDB } from "@/lib/mongodb";
import MentorProfile from "@/models/MentorProfile";
import MentorSession from "@/models/MentorSession";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userRole = String(session.user.role ?? "").toLowerCase();

    if (userRole !== "mentor") {
      return NextResponse.json(
        { message: "Forbidden. This feature is only available to mentors." },
        { status: 403 }
      );
    }

    if (!mongoose.Types.ObjectId.isValid(session.user.id)) {
      return NextResponse.json(
        { message: "Invalid authenticated user id." },
        { status: 400 }
      );
    }

    await connectMongoDB();

    const [mentorProfile, uniqueStudentIds, upcomingSessions] =
      await Promise.all([
        MentorProfile.findOne({ userId: session.user.id })
          .select("totalEarnings rating")
          .lean(),
        MentorSession.distinct("studentId", {
          mentorId: session.user.id,
          status: "completed",
        }),
        MentorSession.countDocuments({
          mentorId: session.user.id,
          status: "accepted",
        }),
      ]);

    return NextResponse.json({
      totalEarnings: mentorProfile?.totalEarnings ?? 0,
      rating: mentorProfile?.rating ?? 0,
      uniqueStudentsTaught: uniqueStudentIds.length,
      upcomingSessions,
    });
  } catch (error) {
    console.error("Fetch mentor dashboard stats error:", error);
    return NextResponse.json(
      { message: "Failed to fetch mentor dashboard stats" },
      { status: 500 }
    );
  }
}
