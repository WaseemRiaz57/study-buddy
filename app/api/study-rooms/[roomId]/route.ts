import { NextResponse, type NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { AccessToken } from "livekit-server-sdk";
import mongoose from "mongoose";
import { connectDB } from "@/lib/connectDB";
import { authOptions } from "@/lib/authOptions";
import StudyRoom from "@/models/StudyRoom";
import MentorSession from "@/models/MentorSession";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function normalizeRoomId(roomId: string): string {
  return roomId.trim().toUpperCase();
}

function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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

    if (mongoose.Types.ObjectId.isValid(rawRoomId)) {
      const mentorSession = await MentorSession.findById(rawRoomId)
        .select("mentorId studentId scheduledAt status")
        .lean();

      if (mentorSession) {
        const mentorId = String(mentorSession.mentorId);
        const studentId = String(mentorSession.studentId);

        if (currentUserId !== mentorId && currentUserId !== studentId) {
          return NextResponse.json(
            { message: "You are not authorized to join this session." },
            { status: 403 }
          );
        }

        const expirationTime =
          new Date(mentorSession.scheduledAt).getTime() + 60 * 60 * 1000;

        if (
          Number.isFinite(expirationTime) &&
          Date.now() > expirationTime &&
          mentorSession.status !== "completed"
        ) {
          return NextResponse.json(
            { message: "This session has expired." },
            { status: 403 }
          );
        }

        if (!metadataOnly) {
          await MentorSession.updateOne(
            { _id: rawRoomId },
            currentUserId === mentorId
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
      const isValidObjectId = mongoose.Types.ObjectId.isValid(currentUserId);
      const creatorId = isValidObjectId ? new mongoose.Types.ObjectId(currentUserId) : currentUserId;

      const newRoom = await StudyRoom.create({
        roomId: normalizedRoomId,
        createdBy: creatorId,
        title: "Study Buddy Session",
        participants: [creatorId],
        isActive: true,
        status: "active",
        isLive: true,
      });

      room = await StudyRoom.findById(newRoom._id).lean();
    }

    const hostId = resolveRoomHostId(room);
    const isHost = Boolean(hostId && currentUserId === hostId);
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

    accessToken.addGrant({
      room: normalizedRoomId,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
      ...(isHost
        ? ({
            canAdmin: true,
            roomAdmin: true,
          } as { canAdmin: true; roomAdmin: true })
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


