import { NextResponse, type NextRequest } from "next/server";
import { connectMongoDB } from "@/lib/mongodb";
import { requireStudyRoomJwt } from "@/lib/study-room-auth";
import StudyRoom from "@/models/StudyRoom";

function normalizeRoomId(roomId: string): string {
  return roomId.trim();
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const authResult = await requireStudyRoomJwt(request);
    if (authResult.error) return authResult.error;

    const { roomId } = await params;
    const normalizedRoomId = normalizeRoomId(roomId);

    if (!normalizedRoomId) {
      return NextResponse.json({ message: "roomId is required" }, { status: 400 });
    }

    await connectMongoDB();

    const room = await StudyRoom.findOne({ roomId: normalizedRoomId })
      .populate("host", "name")
      .lean();

    if (!room) {
      return NextResponse.json({ message: "Room not found" }, { status: 404 });
    }

    const hostId =
      typeof room.host === "string"
        ? room.host
        : room.host && typeof room.host === "object"
        ? String(
            (room.host as { _id?: string; id?: string })._id ||
              (room.host as { _id?: string; id?: string }).id ||
              ""
          )
        : "";

    return NextResponse.json({
      _id: room._id,
      topic: room.topic,
      roomId: room.roomId,
      hostId,
      currentUserId: authResult.userId,
      maxParticipants: room.maxParticipants,
      privacy: room.privacy,
      isLive: room.isLive,
      createdAt: room.createdAt,
      host: room.host,
      participantsCount: Array.isArray(room.participants) ? room.participants.length : 0,
    });
  } catch (error) {
    console.error("Fetch study room details error:", error);
    return NextResponse.json(
      { message: "Failed to fetch room details" },
      { status: 500 }
    );
  }
}
