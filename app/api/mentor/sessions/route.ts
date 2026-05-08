import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";
import { authOptions } from "@/lib/authOptions";
import { connectMongoDB } from "@/lib/mongodb";
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

    const sessions = await MentorSession.find({ mentorId: session.user.id })
      .populate("studentId", "name image email")
      .sort({ scheduledAt: 1 });

    return NextResponse.json(sessions);
  } catch (error) {
    console.error("Fetch mentor sessions error:", error);
    return NextResponse.json(
      { message: "Failed to fetch mentor sessions" },
      { status: 500 }
    );
  }
}
