import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth-guard";
import { connectMongoDB } from "@/lib/mongodb";
import { startStudyRoom } from "@/lib/study-room";
import BuddyMatch from "@/models/BuddyMatch";
import StudySession from "@/models/StudySession";
import User from "@/models/User";

/**
 * POST /api/study-buddy/start-room
 *
 * Body: { matchId?: string, sessionId?: string, peerId?: string, subject?: string }
 *
 * Triggers StartStudyRoom (UC-14 / FR-7) when a peer accepts a match request.
 * Can be called with:
 *   - matchId   → resolves both students from BuddyMatch
 *   - sessionId → resolves both students from StudySession
 *   - peerId    → uses the caller + the given peer
 *
 * Returns Agora credentials + room details so the React frontend can connect.
 * Restricted to students only.
 */
export async function POST(req: NextRequest) {
  // ── Role guard ─────────────────────────────────────────────────
  const { error, session } = await requireRole("student");
  if (error) return error;

  try {
    const body = await req.json();
    const { matchId, sessionId, peerId, subject } = body;

    const currentUserId = session!.user.id;

    await connectMongoDB();

    let studentAId = currentUserId;
    let studentBId: string | null = null;
    let resolvedSubject = subject || "";

    // ── Resolve peer from matchId ───────────────────────────────
    if (matchId) {
      const match = await BuddyMatch.findById(matchId);
      if (!match) {
        return NextResponse.json(
          { message: "BuddyMatch not found." },
          { status: 404 }
        );
      }

      // Determine which side we are on
      if (match.studentId.toString() === currentUserId) {
        studentBId = match.matchedPeerId.toString();
      } else if (match.matchedPeerId.toString() === currentUserId) {
        studentBId = match.studentId.toString();
      } else {
        return NextResponse.json(
          { message: "You are not part of this match." },
          { status: 403 }
        );
      }

      // Upgrade match status to "Connected"
      match.status = "Connected";
      await match.save();

      resolvedSubject = resolvedSubject || match.subject;
    }

    // ── Resolve peer from sessionId ─────────────────────────────
    if (!studentBId && sessionId) {
      const studySession = await StudySession.findById(sessionId);
      if (!studySession) {
        return NextResponse.json(
          { message: "StudySession not found." },
          { status: 404 }
        );
      }

      const isRequester =
        studySession.requesterId.toString() === currentUserId;
      const isReceiver =
        studySession.receiverId.toString() === currentUserId;

      if (!isRequester && !isReceiver) {
        return NextResponse.json(
          { message: "You are not part of this session." },
          { status: 403 }
        );
      }

      studentBId = isRequester
        ? studySession.receiverId.toString()
        : studySession.requesterId.toString();

      // Mark session active
      studySession.status = "active";
      await studySession.save();

      resolvedSubject = resolvedSubject || studySession.subject;
    }

    // ── Resolve peer from explicit peerId ───────────────────────
    if (!studentBId && peerId) {
      const peer = await User.findById(peerId);
      if (!peer || peer.role !== "student") {
        return NextResponse.json(
          { message: "Peer not found or is not a student." },
          { status: 404 }
        );
      }
      studentBId = peer._id.toString();
    }

    // ── Validate ────────────────────────────────────────────────
    if (!studentBId) {
      return NextResponse.json(
        {
          message:
            "Provide at least one of: matchId, sessionId, or peerId to identify the study partner.",
        },
        { status: 400 }
      );
    }

    if (studentAId === studentBId) {
      return NextResponse.json(
        { message: "Cannot start a room with yourself." },
        { status: 400 }
      );
    }

    // ── Start the room (Algorithm 2) + dispatch notifications ───
    const result = await startStudyRoom(
      studentAId,
      studentBId,
      resolvedSubject
    );

    return NextResponse.json(
      {
        message: "Study room created successfully!",
        roomId: result.roomId,
        channelName: result.channelName,
        agoraAppId: result.agoraAppId,
        tokens: result.tokens,
        startTime: result.startTime,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("StartRoom Error:", err);
    return NextResponse.json(
      { message: "Internal server error while creating study room." },
      { status: 500 }
    );
  }
}
