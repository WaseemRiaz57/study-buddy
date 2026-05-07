import { NextResponse, type NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { AccessToken } from "livekit-server-sdk";
import mongoose from "mongoose";
import { connectDB } from "@/lib/connectDB";
import { authOptions } from "@/lib/authOptions";
import StudyRoom from "@/models/StudyRoom";

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
  return String(
    createdBy && typeof createdBy === "object" && "_id" in createdBy
      ? (createdBy as { _id?: unknown })._id
      : createdBy || ""
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
    const normalizedRoomId = normalizeRoomId(roomId);
    
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Fallback if ID is missing
    const currentUserId = String(session.user.id || session.user.email || "guest").trim();
    const participantName = session.user.name || "Student";
    
    const liveKitUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;
    const liveKitApiKey = process.env.LIVEKIT_API_KEY;
    const liveKitApiSecret = process.env.LIVEKIT_API_SECRET;

    if (!normalizedRoomId) {
      return NextResponse.json({ message: "roomId is required" }, { status: 400 });
    }

    if (!liveKitUrl || !liveKitApiKey || !liveKitApiSecret) {
      console.error("❌ ERROR: LiveKit environment variables are missing.");
      return NextResponse.json({ message: "LiveKit config missing" }, { status: 500 });
    }

    await connectDB();

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
