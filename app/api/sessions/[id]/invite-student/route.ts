import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";
import { authOptions } from "@/lib/authOptions";
import { connectMongoDB } from "@/lib/mongodb";
import MentorSession from "@/models/MentorSession";
import User from "@/models/User";

const MAX_STUDENTS_PER_SESSION = 4;

/**
 * POST /api/sessions/[id]/invite-student
 *
 * Appends a Student to an existing MentorSession's `students` array and
 * emits a real-time Socket.IO invitation notification to the Student via
 * the socket-server REST /emit endpoint.
 *
 * Body: { studentId: string }
 * Auth: Mentor only — must own the session.
 *
 * Errors:
 *   400 — invalid IDs or missing body
 *   403 — not the session's Mentor, or Student not connected to this Mentor
 *   404 — session not found
 *   409 — Student already in session, or session is full (4 Students max)
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userRole = String(session.user.role ?? "").toLowerCase();

    if (userRole !== "teacher" && userRole !== "mentor") {
      return NextResponse.json(
        { message: "Forbidden. Only Mentors can invite Students to a session." },
        { status: 403 }
      );
    }

    const { id: sessionId } = await params;

    if (
      !mongoose.Types.ObjectId.isValid(session.user.id) ||
      !mongoose.Types.ObjectId.isValid(sessionId)
    ) {
      return NextResponse.json(
        { message: "Valid session and Mentor ids are required." },
        { status: 400 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const studentId = String(body.studentId || "").trim();

    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      return NextResponse.json(
        { message: "A valid Student id is required." },
        { status: 400 }
      );
    }

    await connectMongoDB();

    // ── 1. Load the target session ──────────────────────────────────────────
    const mentorSession = await MentorSession.findById(sessionId);

    if (!mentorSession) {
      return NextResponse.json(
        { message: "Mentor session not found." },
        { status: 404 }
      );
    }

    // ── 2. Verify ownership ─────────────────────────────────────────────────
    if (String(mentorSession.mentorId) !== session.user.id) {
      return NextResponse.json(
        { message: "Forbidden. You are not the Mentor for this session." },
        { status: 403 }
      );
    }

    // ── 3. Enforce room capacity ────────────────────────────────────────────
    const currentStudents = mentorSession.students ?? [];

    if (currentStudents.length >= MAX_STUDENTS_PER_SESSION) {
      return NextResponse.json(
        {
          message: `This session already has the maximum of ${MAX_STUDENTS_PER_SESSION} Students.`,
        },
        { status: 409 }
      );
    }

    // ── 4. Prevent duplicate invitations ────────────────────────────────────
    const alreadyInSession = currentStudents.some(
      (sid) => String(sid) === studentId
    );

    if (alreadyInSession) {
      return NextResponse.json(
        { message: "This Student is already in the session." },
        { status: 409 }
      );
    }

    // ── 5. Verify Student is connected to this Mentor ───────────────────────
    const connectedSession = await MentorSession.findOne({
      mentorId: session.user.id,
      studentId,
      status: { $in: ["accepted", "completed", "payment_verified"] },
    }).select("_id");

    if (!connectedSession) {
      return NextResponse.json(
        {
          message:
            "You can only invite Students who have an existing session with you.",
        },
        { status: 403 }
      );
    }

    // ── 6. Append Student to the session ────────────────────────────────────
    const updatedSession = await MentorSession.findByIdAndUpdate(
      sessionId,
      { $addToSet: { students: studentId } },
      { new: true, runValidators: true }
    )
      .populate("studentId", "name image email")
      .populate("students", "name image email")
      .lean();

    // ── 7. Emit real-time Socket.IO invitation to the Student ───────────────
    const socketServerUrl = process.env.NEXT_PUBLIC_SOCKET_URL;
    const emitSecret = process.env.EMIT_SECRET;

    if (socketServerUrl) {
      try {
        const mentorUser = await User.findById(session.user.id)
          .select("name image")
          .lean();
        const mentorName =
          (mentorUser as { name?: string } | null)?.name ||
          session.user.name ||
          "Your Mentor";

        const emitPayload = {
          event: "mentor:session-invitation",
          room: `user:${studentId}`,
          data: {
            sessionId: String(sessionId),
            mentorId: session.user.id,
            mentorName,
            subject: mentorSession.subject,
            roomId: mentorSession.roomId || String(sessionId),
          },
        };

        const headers: HeadersInit = { "Content-Type": "application/json" };
        if (emitSecret) headers["x-emit-secret"] = emitSecret;

        await fetch(`${socketServerUrl}/emit`, {
          method: "POST",
          headers,
          body: JSON.stringify(emitPayload),
          signal: AbortSignal.timeout(3000),
        });
      } catch {
        // Socket notification is best-effort — don't fail the API call if it errors.
      }
    }

    return NextResponse.json(
      {
        message: "Student invited to session successfully.",
        session: updatedSession,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Invite Student to session error:", error);
    return NextResponse.json(
      { message: "Failed to invite Student to session." },
      { status: 500 }
    );
  }
}
