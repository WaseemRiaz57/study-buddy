import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";
import { authOptions } from "@/lib/authOptions";
import { connectMongoDB } from "@/lib/mongodb";
import MentorSession from "@/models/MentorSession";

/**
 * POST /api/study-rooms/[roomId]/start-session
 * 
 * Allows a mentor to mark a session as started.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userRole = String(session.user.role ?? "").toLowerCase();

    if (userRole !== "teacher" && userRole !== "mentor") {
      return NextResponse.json(
        { message: "Forbidden. Only Mentors can start a session." },
        { status: 403 }
      );
    }

    const { roomId } = await params;

    if (!mongoose.Types.ObjectId.isValid(roomId)) {
      return NextResponse.json(
        { message: "Valid session ID is required." },
        { status: 400 }
      );
    }

    await connectMongoDB();

    const mentorSession = await MentorSession.findById(roomId);

    if (!mentorSession) {
      return NextResponse.json(
        { message: "Mentor session not found." },
        { status: 404 }
      );
    }

    if (String(mentorSession.mentorId) !== session.user.id) {
      return NextResponse.json(
        { message: "Forbidden. You are not the Mentor for this session." },
        { status: 403 }
      );
    }

    // Mark as started
    mentorSession.isSessionStarted = true;
    await mentorSession.save();

    // Emit socket event to students in the session
    const socketServerUrl = process.env.NEXT_PUBLIC_SOCKET_URL;
    const emitSecret = process.env.EMIT_SECRET;

    if (socketServerUrl) {
      try {
        const studentsToNotify = mentorSession.students || [];
        if (mentorSession.studentId && !studentsToNotify.includes(mentorSession.studentId)) {
          studentsToNotify.push(mentorSession.studentId);
        }

        const headers: HeadersInit = { "Content-Type": "application/json" };
        if (emitSecret) headers["x-emit-secret"] = emitSecret;

        // Notify each student
        await Promise.all(
          studentsToNotify.map((studentId: mongoose.Types.ObjectId) => {
            const emitPayload = {
              event: "session:started",
              room: `user:${studentId.toString()}`,
              data: {
                sessionId: String(roomId),
                roomId: mentorSession.roomId || String(roomId),
              },
            };

            return fetch(`${socketServerUrl}/emit`, {
              method: "POST",
              headers,
              body: JSON.stringify(emitPayload),
              signal: AbortSignal.timeout(3000),
            }).catch(e => console.error("Socket emit failed for student", studentId, e));
          })
        );
      } catch (error) {
        console.error("Socket emit error in start-session:", error);
      }
    }

    return NextResponse.json(
      { message: "Session started successfully." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Start session error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
