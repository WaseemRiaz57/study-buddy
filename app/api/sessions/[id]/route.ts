import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";
import { authOptions } from "@/lib/authOptions";
import { connectMongoDB } from "@/lib/mongodb";
import MentorSession from "@/models/MentorSession";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    if (
      !mongoose.Types.ObjectId.isValid(session.user.id) ||
      !mongoose.Types.ObjectId.isValid(id)
    ) {
      return NextResponse.json(
        { message: "Valid session and user ids are required." },
        { status: 400 }
      );
    }

    await connectMongoDB();

    const mentorSession = await MentorSession.findById(id)
      .populate("studentId", "name image email")
      .populate("mentorId", "name image email role");

    if (!mentorSession) {
      return NextResponse.json(
        { message: "Session not found." },
        { status: 404 }
      );
    }

    const currentUserId = session.user.id;
    const studentId =
      typeof mentorSession.studentId === "object" && "_id" in mentorSession.studentId
        ? String(mentorSession.studentId._id)
        : String(mentorSession.studentId);
    const mentorId =
      typeof mentorSession.mentorId === "object" && "_id" in mentorSession.mentorId
        ? String(mentorSession.mentorId._id)
        : String(mentorSession.mentorId);

    if (studentId !== currentUserId && mentorId !== currentUserId) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(mentorSession);
  } catch (error) {
    console.error("Fetch mentor session error:", error);
    return NextResponse.json(
      { message: "Failed to fetch session" },
      { status: 500 }
    );
  }
}
