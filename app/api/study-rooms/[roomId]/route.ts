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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params;
    const normalizedRoomId = normalizeRoomId(roomId);
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const currentUserId = String(session.user.id).trim();
    const participantName = session.user.name || "Student";
    const liveKitUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;
    const liveKitApiKey = process.env.LIVEKIT_API_KEY;
    const liveKitApiSecret = process.env.LIVEKIT_API_SECRET;

    if (!normalizedRoomId) {
      return NextResponse.json({ message: "roomId is required" }, { status: 400 });
    }

    if (!/^[A-Z0-9-]{3,32}$/.test(normalizedRoomId)) {
      return NextResponse.json({ message: "Invalid roomId" }, { status: 400 });
    }

    if (!liveKitUrl || !liveKitApiKey || !liveKitApiSecret) {
      return NextResponse.json(
        { message: "LiveKit environment variables are not configured." },
        { status: 500 }
      );
    }

    await connectDB();

    let room = await StudyRoom.findOne({
      roomId: { $regex: `^${escapeRegex(normalizedRoomId)}$`, $options: "i" },
    })
      .populate("createdBy", "name")
      .populate("participants", "name")
      .lean();

    if (!room) {
      console.log(`[Room API] Room not found. Auto-creating room: ${normalizedRoomId}`);

      const creatorObjectId = new mongoose.Types.ObjectId(currentUserId);
      const newRoom = await StudyRoom.create({
        roomId: normalizedRoomId,
        createdBy: creatorObjectId,
        title: "Study Buddy Session",
        participants: [creatorObjectId],
        isActive: true,
        status: "active",
        isLive: true,
      });

      room = await StudyRoom.findById(newRoom._id)
        .populate("createdBy", "name")
        .populate("participants", "name")
        .lean();
    }

    const populatedRoom = room as {
      createdBy?: { _id?: unknown } | unknown;
    };
    const hostId = String(
      (typeof populatedRoom.createdBy === "object" && populatedRoom.createdBy !== null
        ? (populatedRoom.createdBy as { _id?: unknown })._id
        : populatedRoom.createdBy) || ""
    ).trim();

    console.log(`[Room API] Generating LiveKit token for room: ${normalizedRoomId}`);

    const accessToken = new AccessToken(liveKitApiKey, liveKitApiSecret, {
      identity: currentUserId,
      name: participantName,
      ttl: "2h",
    });

    accessToken.addGrant({
      room: normalizedRoomId,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    });

    const token = await accessToken.toJwt();

    return NextResponse.json(
      {
        room,
        roomName: normalizedRoomId,
        currentUserId,
        hostId,
        token,
        liveKitUrl,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Fetch study room details error:", error);
    return NextResponse.json(
      { message: "Failed to fetch room details" },
      { status: 500 }
    );
  }
}
