import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";
import { authOptions } from "@/lib/authOptions";
import { isMentorRole } from "@/lib/roles";
import { connectMongoDB } from "@/lib/mongodb";
import {
  MENTOR_SESSION_ACTIVE_STATUS,
  normalizeStudyRoomId,
  resolveStudentIds,
} from "@/lib/mentor-session-lifecycle";
import { clearStudyRoomRuntimeState } from "@/lib/redis";
import { emitMentorSessionStarted } from "@/lib/study-room-socket";
import MentorSession from "@/models/MentorSession";
import StudyRoom from "@/models/StudyRoom";

/**
 * POST /api/study-rooms/[roomId]/start-session
 *
 * Allows a Mentor to mark a session as started.
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userRole = String(session.user.role ?? "").toLowerCase();
    const hasMentorRole = isMentorRole(userRole);

    if (!hasMentorRole) {
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

    const staleActiveSessions = await MentorSession.find({
      mentorId: session.user.id,
      isSessionStarted: true,
      status: MENTOR_SESSION_ACTIVE_STATUS,
      _id: { $ne: roomId },
    })
      .select("_id roomId")
      .lean();

    if (staleActiveSessions.length > 0) {
      const now = new Date();
      const staleSessionIds = staleActiveSessions.map((staleSession) => staleSession._id);
      const staleRoomIds = Array.from(
        new Set(
          staleActiveSessions
            .flatMap((staleSession) => [
              String(staleSession._id),
              String(staleSession.roomId || ""),
            ])
            .map(normalizeStudyRoomId)
            .filter(Boolean)
        )
      );

      await MentorSession.updateMany(
        {
          _id: { $in: staleSessionIds },
          mentorId: session.user.id,
          isSessionStarted: true,
          status: MENTOR_SESSION_ACTIVE_STATUS,
        },
        {
          $set: {
            isSessionStarted: false,
            status: "completed",
            completedAt: now,
          },
        }
      );

      if (staleRoomIds.length > 0) {
        await StudyRoom.updateMany(
          { roomId: { $in: staleRoomIds } },
          {
            $set: {
              isActive: false,
              isLive: false,
              status: "ended",
              closedAt: now,
            },
          }
        );

        await Promise.all(
          staleRoomIds.map((staleRoomId) =>
            clearStudyRoomRuntimeState(staleRoomId).catch((error) => {
              console.error("Failed to clear stale Mentor room state:", error);
            })
          )
        );
      }
    }

    const startedRoomId = String(mentorSession._id);

    if (mentorSession.isSessionStarted) {
      if (mentorSession.roomId !== startedRoomId) {
        mentorSession.roomId = startedRoomId;
        await mentorSession.save();
      }

      return NextResponse.json(
        {
          message: "Session already started.",
          sessionId: String(mentorSession._id),
          roomId: startedRoomId,
        },
        { status: 200 }
      );
    }

    mentorSession.isSessionStarted = true;
    mentorSession.actualStartTime = new Date();
    mentorSession.status = MENTOR_SESSION_ACTIVE_STATUS;
    mentorSession.roomId = startedRoomId;
    await mentorSession.save();

    const socketServerUrl =
      process.env.NEXT_PUBLIC_SOCKET_SERVER_URL?.replace(/\/+$/, "");
    const emitSecret = process.env.EMIT_SECRET;
    const studentsToNotify = resolveStudentIds(mentorSession);

    for (const studentId of studentsToNotify) {
      emitMentorSessionStarted(studentId, {
        sessionId: String(roomId),
        roomId: startedRoomId,
      });
    }

    if (socketServerUrl) {
      try {
        const headers: HeadersInit = { "Content-Type": "application/json" };
        if (emitSecret) headers["x-emit-secret"] = emitSecret;

        await Promise.all(
          studentsToNotify.map((studentId: string) => {
            const emitPayload = {
              event: "session:started",
              room: `user:${studentId}`,
              data: {
                sessionId: String(roomId),
                roomId: startedRoomId,
              },
            };

            return fetch(`${socketServerUrl}/emit`, {
              method: "POST",
              headers,
              body: JSON.stringify(emitPayload),
              signal: AbortSignal.timeout(3000),
            }).catch((error) =>
              console.error("Socket emit failed for student", studentId, error)
            );
          })
        );
      } catch (error) {
        console.error("Socket emit error in start-session:", error);
      }
    }

    return NextResponse.json(
      {
        message: "Session started successfully.",
        sessionId: String(mentorSession._id),
        roomId: startedRoomId,
      },
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
