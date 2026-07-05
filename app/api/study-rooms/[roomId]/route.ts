import { NextResponse, type NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { AccessToken } from "livekit-server-sdk";
import mongoose from "mongoose";
import { connectDB } from "@/lib/connectDB";
import { authOptions } from "@/lib/authOptions";
import StudyRoom from "@/models/StudyRoom";
import MentorSession from "@/models/MentorSession";
import {
  escapeStudyRoomRegex,
  getMentorSessionExpiresAt,
  hasMentorSessionExpired,
  isMentorForSession as isMentorSessionMentor,
  isStudentForSession,
  normalizeStudyRoomId,
  resolveMentorId,
} from "@/lib/mentor-session-lifecycle";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function normalizeRoomId(roomId: string): string {
  return normalizeStudyRoomId(roomId);
}

function escapeRegex(text: string): string {
  return escapeStudyRoomRegex(text);
}

function resolveRoomHostId(room: unknown): string {
  const createdBy = (room as { createdBy?: { _id?: unknown } | unknown })?.createdBy;
  const host = (room as { host?: { _id?: unknown } | unknown })?.host;
  const owner = createdBy || host;

  return String(
    owner && typeof owner === "object" && "_id" in owner
      ? (owner as { _id?: unknown })._id
      : owner || ""
  ).trim();
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    // Handling Next.js 14/15 params correctly
    const resolvedParams = await params;
    const { roomId } = resolvedParams;
    const rawRoomId = String(roomId || "").trim();
    const normalizedRoomId = normalizeRoomId(roomId);
    
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Fallback if ID is missing
    const currentUserId = String(session.user.id || session.user.email || "guest").trim();
    const participantName = session.user.name || "Student";
    const metadataOnly =
      request.nextUrl.searchParams.get("metadataOnly") === "true";
    
    const liveKitUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;
    const liveKitApiKey = process.env.LIVEKIT_API_KEY;
    const liveKitApiSecret = process.env.LIVEKIT_API_SECRET;

    if (!normalizedRoomId) {
      return NextResponse.json({ message: "roomId is required" }, { status: 400 });
    }

    await connectDB();

    // Track whether this room is a MentorSession and whether the user is the Mentor.
    let mentorSessionExpiresAt: Date | null = null;
    let mentorSessionHostId = "";
    let isMentorSessionRoom = false;
    let isMentorForSession = false;
    let isStudentForMentorSession = false;

    if (mongoose.Types.ObjectId.isValid(rawRoomId)) {
      const mentorSession = await MentorSession.findById(rawRoomId)
        .select("mentorId students studentId scheduledAt duration status isSessionStarted actualStartTime")
        .lean();

      if (mentorSession) {
        isMentorSessionRoom = true;
        mentorSessionHostId = resolveMentorId(mentorSession);
        mentorSessionExpiresAt = getMentorSessionExpiresAt(mentorSession);
        isMentorForSession = isMentorSessionMentor(mentorSession, currentUserId);
        isStudentForMentorSession = isStudentForSession(
          mentorSession,
          currentUserId
        );

        // Authorization: only session participants can join
        if (!isMentorForSession && !isStudentForMentorSession) {
          return NextResponse.json(
            { message: "You are not authorized to join this session." },
            { status: 403 }
          );
        }

        // Server-side gate: block Students from joining before Mentor starts
        if (
          !isMentorForSession &&
          !mentorSession.isSessionStarted &&
          mentorSession.status !== "completed"
        ) {
          return NextResponse.json(
            { message: "Waiting for Mentor to start the session." },
            { status: 403 }
          );
        }

        // Expiry: calculate from actualStartTime + duration, not scheduledAt
        if (
          hasMentorSessionExpired(mentorSession) &&
          mentorSession.status !== "completed"
        ) {
          return NextResponse.json(
            { message: "This session has ended." },
            { status: 403 }
          );
        }

        if (!metadataOnly) {
          await MentorSession.updateOne(
            { _id: rawRoomId },
            isMentorForSession
              ? { $set: { mentorJoinedAt: new Date() } }
              : { $set: { studentJoinedAt: new Date() } }
          );
        }
      }
    }

    let room = await StudyRoom.findOne({
      roomId: { $regex: `^${escapeRegex(normalizedRoomId)}$`, $options: "i" },
    }).lean();

    if (!room) {
      console.log(`[Room API] Auto-creating room: ${normalizedRoomId}`);

      // 🛑 THE BUG FIX: Safely handling non-MongoDB IDs (like Google Auth IDs)
      const roomOwnerId =
        isMentorSessionRoom && mentorSessionHostId
          ? mentorSessionHostId
          : currentUserId;
      const isValidObjectId = mongoose.Types.ObjectId.isValid(roomOwnerId);
      const creatorId = isValidObjectId
        ? new mongoose.Types.ObjectId(roomOwnerId)
        : roomOwnerId;
      const participantId = mongoose.Types.ObjectId.isValid(currentUserId)
        ? new mongoose.Types.ObjectId(currentUserId)
        : currentUserId;

      const newRoom = await StudyRoom.create({
        roomId: normalizedRoomId,
        createdBy: creatorId,
        title: isMentorSessionRoom ? "Mentor Session" : "Study Buddy Session",
        participants: [participantId],
        isActive: true,
        status: "active",
        isLive: true,
      });

      room = await StudyRoom.findById(newRoom._id).lean();
    }

    const hostId = mentorSessionHostId || resolveRoomHostId(room);
    const isHost = isMentorSessionRoom
      ? Boolean(isMentorForSession)
      : Boolean(hostId && currentUserId === hostId);
    const isStudyBuddyRoom = normalizedRoomId.startsWith("SB-");

    if (metadataOnly) {
      return NextResponse.json(
        {
          room,
          roomName: normalizedRoomId,
          currentUserId,
          hostId,
          isHost,
          isStudyBuddyRoom,
          expiresAt: mentorSessionExpiresAt?.toISOString() || null,
        },
        { status: 200 }
      );
    }

    if (!liveKitUrl || !liveKitApiKey || !liveKitApiSecret) {
      console.error("LiveKit environment variables are missing.");
      return NextResponse.json({ message: "LiveKit config missing" }, { status: 500 });
    }

    console.log(`[Room API] Generating LiveKit token for user: ${participantName}`);

    const accessToken = new AccessToken(liveKitApiKey, liveKitApiSecret, {
      identity: currentUserId,
      name: participantName,
    });

    const participantRole = isMentorSessionRoom
      ? isMentorForSession
        ? "mentor"
        : "student"
      : isHost
        ? "host"
        : "student";
    const canControl = participantRole === "mentor" || participantRole === "host";

    accessToken.addGrant({
      room: normalizedRoomId,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
      ...(canControl
        ? { roomAdmin: true }
        : {}),
    });

    const token = await accessToken.toJwt();

    return NextResponse.json(
      {
        room,
        roomName: normalizedRoomId,
        currentUserId,
        hostId,
        isHost,
        isStudyBuddyRoom,
        participantRole,
        permissions: {
          canPublish: true,
          canControl,
        },
        expiresAt: mentorSessionExpiresAt?.toISOString() || null,
        token,
        liveKitUrl,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Fetch study room details error:", error);
    return NextResponse.json(
      { message: "Failed to fetch room details" },
      { status: 500 }
    );
  }
}


