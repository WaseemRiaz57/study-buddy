import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";
import { authOptions } from "@/lib/authOptions";
import { connectMongoDB } from "@/lib/mongodb";
import Assignment from "@/models/Assignment";
import MentorSession from "@/models/MentorSession";
import User from "@/models/User";

export const dynamic = "force-dynamic";

function getInitials(name: string) {
  return (
    name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "ST"
  );
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userRole = String(session.user.role ?? "").toLowerCase();

    if (userRole !== "teacher" && userRole !== "mentor") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    if (!mongoose.Types.ObjectId.isValid(session.user.id)) {
      return NextResponse.json(
        { message: "Invalid authenticated mentor id." },
        { status: 400 }
      );
    }

    await connectMongoDB();

    const connectedStatuses = ["accepted", "completed", "payment_verified"];
    const now = new Date();
    const [studentIds, upcomingSessions, pendingRequests] = await Promise.all([
      MentorSession.distinct("studentId", {
        mentorId: session.user.id,
        status: { $in: connectedStatuses },
      }),
      MentorSession.countDocuments({
        mentorId: session.user.id,
        status: { $in: ["accepted", "payment_verified"] },
        scheduledAt: { $gt: now },
      }),
      MentorSession.countDocuments({
        mentorId: session.user.id,
        status: "pending",
      }),
    ]);

    const [students, pendingAssignments] = await Promise.all([
      User.find({ _id: { $in: studentIds } })
        .select("name email image lastActive")
        .lean(),
      Assignment.countDocuments({
        mentorId: session.user.id,
        studentId: { $in: studentIds },
        status: "pending",
      }),
    ]);

    return NextResponse.json({
      stats: {
        totalActiveStudents: students.length,
        upcomingSessions,
        pendingRequests,
        pendingAssignments,
      },
      students: students.map((student) => {
        const name = student.name || "Unnamed Student";

        return {
          id: String(student._id),
          name,
          email: student.email || "",
          image: student.image || "",
          initials: getInitials(name),
          lastActive: student.lastActive || null,
        };
      }),
    });
  } catch (error) {
    console.error("Fetch mentor students error:", error);
    return NextResponse.json(
      { message: "Failed to fetch mentor students." },
      { status: 500 }
    );
  }
}


