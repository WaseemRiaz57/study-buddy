import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";
import { authOptions } from "@/lib/authOptions";
import { connectMongoDB } from "@/lib/mongodb";
import {
  MENTOR_SESSION_ACTIVE_STATUS,
  resolveStudentIds,
} from "@/lib/mentor-session-lifecycle";
import { emitMentorSessionStarted } from "@/lib/study-room-socket";
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

    // ── Idempotency: if this session is already started, return success ──
    if (mentorSession.isSessionStarted) {
      return NextResponse.json(
        { message: "Session already started." },
        { status: 200 }
      );
    }

    // ── Concurrency guard: prevent starting a second session ──
    const existingActiveSession = await MentorSession.findOne({
      mentorId: session.user.id,
      isSessionStarted: true,
      status: MENTOR_SESSION_ACTIVE_STATUS,
      _id: { $ne: roomId },
    })
      .select("_id subject")
      .lean();

    if (existingActiveSession) {
      const activeSubject =
        (existingActiveSession as { subject?: string }).subject || "Untitled";
      return NextResponse.json(
        {
          message: "You are already in an active session.",
          activeSessionSubject: activeSubject,
        },
        { status: 400 }
      );
    }

    // Mark as started and record the actual start time for expiry calculation
    mentorSession.isSessionStarted = true;
    mentorSession.actualStartTime = new Date();
    mentorSession.status = MENTOR_SESSION_ACTIVE_STATUS;
    await mentorSession.save();

    // Emit socket event to students in the session
    const socketServerUrl = process.env.NEXT_PUBLIC_SOCKET_URL;
    const emitSecret = process.env.EMIT_SECRET;
    const studentsToNotify = resolveStudentIds(mentorSession);

    for (const studentId of studentsToNotify) {
      emitMentorSessionStarted(studentId, {
        sessionId: String(roomId),
        roomId: mentorSession.roomId || String(roomId),
      });
    }

    if (socketServerUrl) {
      try {
        const headers: HeadersInit = { "Content-Type": "application/json" };
        if (emitSecret) headers["x-emit-secret"] = emitSecret;

        // Notify each student
        await Promise.all(
          studentsToNotify.map((studentId: string) => {
            const emitPayload = {
              event: "session:started",
              room: `user:${studentId}`,
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
